// API endpoint that returns sanitized, client-safe data for the frontend.
// Architecture:
//   1. Read from secrets/data.json (authoritative, gitignored source)
//   2. Extract only public fields (no metadata, no internal tracking)
//   3. Return as { ok: true, source: '...', data: { ... } }
//   4. Fallback to data/public.json if secrets unavailable

const fs = require('fs');
const path = require('path');

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

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Priority 1: environment variable (Phase A serverless deployment)
    if (process.env.GOLDDAY_DATA) {
      const parsed = JSON.parse(process.env.GOLDDAY_DATA);
      const publicFields = extractPublicFields({ data: parsed });
      return res.status(200).send(JSON.stringify({ ok: true, source: 'env', data: publicFields }));
    }

    // Priority 2: local secrets (gitignored private file - authoritative source)
    const localSecrets = path.join(__dirname, '..', 'secrets', 'data.json');
    if (fs.existsSync(localSecrets)) {
      const raw = fs.readFileSync(localSecrets, 'utf8');
      const parsed = JSON.parse(raw);
      const publicFields = extractPublicFields(parsed);
      return res.status(200).send(JSON.stringify({ ok: true, source: 'secrets', data: publicFields }));
    }

    // Priority 3: committed public data (fallback for offline/no-secrets scenarios)
    const publicPath = path.join(__dirname, '..', 'data', 'public.json');
    if (fs.existsSync(publicPath)) {
      const rawPublic = fs.readFileSync(publicPath, 'utf8');
      const parsedPublic = JSON.parse(rawPublic);
      const publicFields = extractPublicFields(parsedPublic);
      return res.status(200).send(JSON.stringify({ ok: true, source: 'public', data: publicFields }));
    }

    // No data source found
    return res.status(404).send(JSON.stringify({ ok: false, error: 'No data source available' }));
  } catch (err) {
    console.error('data.js error', err);
    return res.status(500).send(JSON.stringify({ ok: false, error: String(err) }));
  }
};
