// API endpoint that returns sanitized, client-safe data for the frontend.
// Architecture:
//   1. Fetch from Supabase (production data source, server-side only)
//   2. Fallback to local secrets/data.json (development, gitignored)
//   3. Fallback to data/public.json if available
//   4. Extract only public fields (no metadata, no internal tracking)
//   5. Return as { ok: true, source: '...', data: { ... } }

const fs = require('fs');
const path = require('path');
const https = require('https');

function extractPublicFields(rawData) {
  // Return only the fields that are safe and necessary for the frontend
  // rawData is expected to have: data.players, data.goals, data.clubGoals, data.trophies, data.competitions
  if (!rawData || !rawData.data) return null;
  
  return {
    players: rawData.data.players || {},
    goals: rawData.data.goals || {},
    clubGoals: rawData.data.clubGoals || {},
    trophies: rawData.data.trophies || {},
    competitions: rawData.data.competitions || {}
  };
}

function fetchFromSupabase() {
  return new Promise((resolve, reject) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return reject(new Error('Missing Supabase credentials'));
    }

    const url = new URL(supabaseUrl + '/rest/v1/golday_data?id=eq.1&select=data');
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Accept': 'application/json'
      }
    };

    const request = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          if (response.statusCode !== 200) {
            return reject(new Error('Supabase HTTP ' + response.statusCode));
          }

          const parsed = JSON.parse(data);
          // Response is an array; we want the first element
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].data) {
            resolve({ ok: true, data: parsed[0].data });
          } else {
            reject(new Error('Invalid Supabase response format'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    request.on('error', reject);
    request.end();
  });
}

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const respond = (success, source, data, error) => {
    if (success) {
      return res.status(200).send(JSON.stringify({ ok: true, source: source, data: data }));
    } else {
      return res.status(500).send(JSON.stringify({ ok: false, error: error }));
    }
  };

  try {
    // Priority 1: Supabase (production data source)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      return fetchFromSupabase()
        .then((result) => {
          const publicFields = extractPublicFields(result.data);
          return respond(true, 'supabase', publicFields);
        })
        .catch((err) => {
          // Fall through to next priority
          console.warn('Supabase fetch failed:', err.message);
          // Continue with fallback priorities
          return tryLocalSecrets();
        });
    }

    // If Supabase not configured, try local sources
    return tryLocalSecrets();

    function tryLocalSecrets() {
      // Priority 2: local secrets (gitignored private file)
      const localSecrets = path.join(__dirname, '..', 'secrets', 'data.json');
      if (fs.existsSync(localSecrets)) {
        try {
          const raw = fs.readFileSync(localSecrets, 'utf8');
          const parsed = JSON.parse(raw);
          const publicFields = extractPublicFields(parsed);
          return respond(true, 'local-secrets', publicFields);
        } catch (err) {
          console.error('Failed to read local secrets:', err);
          // Continue to next priority
        }
      }

      // Priority 3: committed public data (fallback)
      const publicPath = path.join(__dirname, '..', 'data', 'public.json');
      if (fs.existsSync(publicPath)) {
        try {
          const rawPublic = fs.readFileSync(publicPath, 'utf8');
          const parsedPublic = JSON.parse(rawPublic);
          const publicFields = extractPublicFields(parsedPublic);
          return respond(true, 'public-file', publicFields);
        } catch (err) {
          console.error('Failed to read public file:', err);
        }
      }

      // No data source found
      return respond(false, null, null, 'No data source available');
    }
  } catch (err) {
    console.error('data.js error:', err);
    return respond(false, null, null, String(err));
  }
};
