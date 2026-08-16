# Supabase Setup Guide for Goal.Day Website

This guide explains how to configure Supabase to store the private football statistics dataset and connect it to the Vercel deployment.

## Architecture Overview

- **Data Storage**: Supabase PostgreSQL database (private, encrypted)
- **API Keys**: Supabase Service Role (stored in Vercel as environment variables)
- **Frontend Access**: `/api/data` endpoint (server-side only, returns public fields only)
- **Local Development**: Falls back to `secrets/data.json` if Supabase unavailable

## Step-by-Step Supabase Configuration

### Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New project"
3. Enter:
   - **Name**: `goal-day-website` (or your preference)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for provisioning (~2-3 minutes)

### Step 2: Get Your Supabase Project URL

Once the project is ready:

1. In the left sidebar, click **Settings → API**
2. Under "Project API keys", copy the **Project URL**
   - Example: `https://xyzabc123def.supabase.co`
   - **Save this value** → will be `SUPABASE_URL` in Vercel

### Step 3: Create the Data Table

1. In the left sidebar, click **SQL Editor**
2. Click "New query"
3. Paste this SQL:

```sql
-- Create table for golday dataset
CREATE TABLE IF NOT EXISTS golday_data (
  id BIGINT PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (id = 1)  -- Only one row allowed
);

-- Enable RLS if needed (not required for server-side queries with service key)
ALTER TABLE golday_data ENABLE ROW LEVEL SECURITY;

-- Grant public read access (if needed for later)
CREATE POLICY "Enable read access for all users" ON golday_data
  FOR SELECT USING (true);
```

4. Click "Run" button
5. You should see "Executed successfully"

### Step 4: Insert Your Dataset

1. In the SQL Editor, create a new query
2. Copy the entire contents of `secrets/data.json` from your local machine
3. Paste this SQL (replace `[DATA_HERE]` with your actual JSON):

```sql
-- Insert the dataset
INSERT INTO golday_data (id, data) VALUES (
  1,
  '[DATA_HERE]'::jsonb
)
ON CONFLICT (id) DO UPDATE 
  SET data = EXCLUDED.data,
      updated_at = NOW();
```

**How to get the JSON:**
- Open `secrets/data.json` from your local machine
- Copy the entire file content
- Paste it in place of `[DATA_HERE]` above
- Make sure it's valid JSON

4. Click "Run"
5. You should see "Insert 1 row" confirmation

### Step 5: Generate Service Role API Key

1. In the left sidebar, click **Settings → API**
2. Under "Project API keys", find "Service role (secret)"
3. Click the copy icon next to the service role key
   - **IMPORTANT**: This is sensitive! Do NOT commit or expose it
   - **Save this value** → will be `SUPABASE_SERVICE_KEY` in Vercel
   - Keep this private and only use server-side

### Step 6: Test the Connection Locally (Optional)

You can test that your data is accessible by running this curl command:

```bash
# Replace YOUR_SUPABASE_URL and YOUR_SERVICE_KEY with actual values
curl -X GET \
  "YOUR_SUPABASE_URL/rest/v1/golday_data?id=eq.1&select=data" \
  -H "apikey: YOUR_SERVICE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Accept: application/json"
```

You should receive a JSON response with your dataset.

## Vercel Deployment Configuration

Once Supabase is set up, add these environment variables to Vercel:

### In Vercel Project Settings (Environment Variables):

1. **Variable Name**: `SUPABASE_URL`
   - **Value**: Your Project URL from Step 2
   - **Environments**: Production, Preview
   - **Sensitive**: No (this is just the public database URL)

2. **Variable Name**: `SUPABASE_SERVICE_KEY`
   - **Value**: Your Service Role Secret from Step 5
   - **Environments**: Production, Preview
   - **Sensitive**: YES (mark as sensitive)

### Access in Vercel:

After deployment, the API at `https://your-vercel-domain.com/api/data` will:

1. Fetch from Supabase using the service role key (server-side only)
2. Extract only public fields (players, goals, clubGoals, trophies, competitions)
3. Return filtered JSON to the frontend
4. Fall back to `secrets/data.json` if Supabase is unavailable (development)

## Security Notes

✅ **What's Protected:**
- Service Role key is only in Vercel, never exposed to frontend
- Frontend can only access public fields via `/api/data`
- Full dataset never stored in GitHub or Vercel source code
- Data transfers are encrypted (HTTPS)

⚠️ **Important Reminders:**
- NEVER commit `SUPABASE_SERVICE_KEY` to GitHub
- NEVER paste the service key in any public channel
- Keep `secrets/data.json` local and gitignored
- The frontend can still see public data (this is intentional—users need it to view stats)

## Troubleshooting

### "Connection refused" error
- Check that your `SUPABASE_URL` is correct (no trailing slash)
- Verify the service key is valid in Settings → API

### "404 Not Found"
- Ensure the `golday_data` table exists in Supabase
- Check that you inserted data in Step 4

### "Invalid Supabase response format"
- Verify the `data` column contains valid JSON
- Check that the table has data (run: `SELECT * FROM golday_data;`)

### API returns empty data
- Verify the extraction in `api/data.js` matches your JSON structure
- Check browser DevTools Network tab to see the raw `/api/data` response

## Next Steps

1. ✅ Complete all Supabase setup steps above
2. ✅ Save `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
3. ✅ Add environment variables to Vercel
4. ⏭️ Test the API endpoint
5. ⏭️ Deploy to Vercel
6. ⏭️ Verify frontend loads data from `/api/data`

---

**Questions?** Check the `/api/data.js` file for the current data-fetching implementation.
