# Production Setup Manual: Supabase + Vercel

This guide contains all manual steps needed to deploy the GolDay website with Supabase.

---

## What's Already Done (Automated)

✅ **Code**: `api/data.js` updated to fetch from Supabase  
✅ **Database Schema**: `supabase/schema.sql` ready to run  
✅ **Frontend**: No changes needed (calls `/api/data` unchanged)  
✅ **Security**: Secrets protected in `.gitignore`  
✅ **Repository**: Safe to push (no secrets, no large datasets)

---

## What You Must Do Manually (4 Steps)

### STEP 1: Create Supabase Project

**Location**: https://app.supabase.com

1. Click **"New Project"**
2. Fill in:
   - **Name**: `goal-day-website`
   - **Database password**: Generate strong password (save it!)
   - **Region**: Choose your region
3. Click **"Create new project"**
4. Wait 2-3 minutes for provisioning

**After creation, go to Settings → API and copy:**
- **`PROJECT_URL`** (example: `https://xyzabc123def.supabase.co`)
  - Save this → will become `SUPABASE_URL` in Vercel

---

### STEP 2: Create Database Table

**In Supabase dashboard:**

1. Click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire content from: `supabase/schema.sql`
4. Paste into SQL editor
5. Click **Run**
6. You should see: "Query executed successfully"

---

### STEP 3: Import Dataset Automatically (Local Script)

1. In project root, create a local env file from the template:
   ```powershell
   Copy-Item .env.local.example .env.local
   ```
2. Open `.env.local` and set:
   - `SUPABASE_URL` (Project URL from Supabase Settings → API)
   - `SUPABASE_SERVICE_KEY` (service_role secret from Supabase Settings → API)
3. Run the import script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\supabase\import-data.ps1
   ```
4. Expected output includes:
   - `Supabase import successful.`
   - `Imported rows: 1`
5. The generated seed payload file is local-only and gitignored:
   - `supabase/local-seed/golday_data.seed.json`

---

### STEP 4: Configure Vercel Environment Variables

**In Supabase dashboard:**

1. Click **Settings** (left sidebar)
2. Click **API**
3. Find section "Project API keys"
4. Copy the key under **"service_role (secret)"**
   - This is sensitive! Keep it safe.
   - Save this → will become `SUPABASE_SERVICE_KEY` in Vercel

---

**Location**: Vercel Project → Settings → Environment Variables

Add these two variables:

| Variable Name | Value | Target Envs | Mark Sensitive |
|---|---|---|---|
| `SUPABASE_URL` | Your PROJECT_URL from Step 1 | Production, Preview | NO |
| `SUPABASE_SERVICE_KEY` | Your service_role key from Step 3 | Production, Preview | **YES** |

**Important**: Mark `SUPABASE_SERVICE_KEY` as **Sensitive** so it's not exposed in build logs.

---

## After Manual Setup Complete

Once you've completed all 4 steps above:

```bash
cd C:\Users\ymehm\goal.day-website

# Stage all changes
git add api/data.js supabase/schema.sql

# Commit
git commit -m "Configure Supabase for production deployment"

# Push to GitHub
git push origin master
```

Vercel will auto-deploy. Your site will:
1. Fetch data from Supabase (server-side only)
2. Return public fields to frontend
3. Display stats in golgunu.html

---

## Testing

### Test 1: Verify Database
In Supabase SQL Editor, run:
```sql
SELECT * FROM golday_data;
```
Should return 1 row with your dataset.

### Test 2: Verify API Endpoint
After Vercel deploys, visit:
```
https://your-vercel-domain.com/api/data
```
Should return:
```json
{
  "ok": true,
  "source": "supabase",
  "data": { "players": {...}, "goals": {...}, ... }
}
```

### Test 3: Verify Frontend
Visit your website → should display player stats and data

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "Table does not exist" | Re-run schema.sql from Step 2 |
| "Invalid JSON" | Make sure you copied entire contents of secrets/data.json |
| "HTTP 401" in API logs | Check service_role key is correct and marked as Sensitive in Vercel |
| "No data source available" | Verify data was inserted (Test 1: run SELECT query) |
| Frontend shows error | Check browser console and Vercel logs |

---

## Security Verification

✅ Confirm these are true:
- `secrets/data.json` is NOT in `.git/` (gitignored)
- `SUPABASE_SERVICE_KEY` is NOT in GitHub (only in Vercel)
- Frontend NEVER receives service key
- Frontend ONLY sees public fields (players, goals, clubGoals, trophies, competitions)
- API uses HTTPS encryption
- Database has RLS enabled

---

## Rollback (If Needed)

If deployment fails:
1. Go back to previous commit
2. Revert `api/data.js`
3. It will fall back to `secrets/data.json` (development mode)
4. Redeploy

---

## Architecture Diagram

```
Production (Live):
  Supabase Database ← server-side HTTPS ← Vercel ← Browser

Development (Local):
  secrets/data.json ← Node.js ← localhost:3000 ← Browser

Fallback:
  data/public.json (if available) ← Node.js ← Vercel/localhost
```

---

## What's Protected

🔒 **NOT in GitHub**:
- `secrets/data.json` (691 KB private dataset)
- `.env` (local environment variables)
- `SUPABASE_SERVICE_KEY` (only in Vercel Settings)
- Any private data or credentials

✅ **Safe in GitHub**:
- `api/data.js` (no secrets hardcoded)
- `supabase/schema.sql` (public schema only)
- `golgunu.html` (frontend code)
- All documentation

---

**Status**: Ready to deploy. Complete the 4 manual steps above, then commit and push.
