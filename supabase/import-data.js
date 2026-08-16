#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEFAULT_SOURCE = 'C:\\Users\\ymehm\\secrets\\data.json';
const SCRIPT_DIR = __dirname;
const LOCAL_SEED_DIR = path.join(SCRIPT_DIR, 'local-seed');
const LOCAL_SEED_FILE = path.join(LOCAL_SEED_DIR, 'golday_data.seed.json');

function readDotEnvLocal(dotEnvPath) {
  if (!fs.existsSync(dotEnvPath)) {
    return;
  }

  const lines = fs.readFileSync(dotEnvPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function requestJson(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          body: responseBody
        });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const sourcePath = process.argv[2] || DEFAULT_SOURCE;
  const dotEnvLocal = path.join(process.cwd(), '.env.local');

  readDotEnvLocal(dotEnvLocal);

  if (!fs.existsSync(sourcePath)) {
    throw new Error('Dataset file not found: ' + sourcePath);
  }

  const raw = fs.readFileSync(sourcePath, 'utf8');
  const dataset = JSON.parse(raw);

  fs.mkdirSync(LOCAL_SEED_DIR, { recursive: true });
  const payload = [
    {
      id: 1,
      data: dataset,
      updated_at: new Date().toISOString()
    }
  ];
  fs.writeFileSync(LOCAL_SEED_FILE, JSON.stringify(payload, null, 2), 'utf8');

  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Set them in .env.local or shell env.'
    );
  }

  const endpoint = new URL(supabaseUrl + '/rest/v1/golday_data?on_conflict=id');
  const body = fs.readFileSync(LOCAL_SEED_FILE, 'utf8');

  const response = await requestJson(
    endpoint,
    {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: 'Bearer ' + serviceKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation'
      }
    },
    body
  );

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      'Supabase import failed (HTTP ' +
        response.statusCode +
        '): ' +
        response.body.slice(0, 600)
    );
  }

  let insertedCount = 0;
  try {
    const parsed = JSON.parse(response.body);
    if (Array.isArray(parsed)) insertedCount = parsed.length;
  } catch (err) {
    insertedCount = 0;
  }

  console.log('Supabase import successful.');
  console.log('Source file:', sourcePath);
  console.log('Seed payload file (gitignored):', LOCAL_SEED_FILE);
  console.log('Imported rows:', insertedCount);
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
