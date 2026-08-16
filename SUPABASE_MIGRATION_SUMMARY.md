# Supabase Migration Summary

**Date**: 2026-08-16  
**Goal**: Move large dataset from Vercel environment variables to Supabase, prevent dataset from being cloneable from GitHub repository.

## Problem Solved

❌ **Previous Issue**: 
- `secrets/data.json` is 691 KB, exceeds Vercel's 64 KB environment variable limit
- Cannot store full dataset as a single Vercel env var

✅ **Solution**:
- Store dataset in Supabase PostgreSQL (private, encrypted)
- Use only two small API keys in Vercel (`SUPABASE_URL` and `SUPABASE_SERVICE_KEY`)
- Frontend calls `/api/data` which fetches from Supabase server-side
- No dataset cloneable from GitHub; no large files in repository

## Changes Made

### 1. Updated `/api/data.js`

**What Changed**:
- Added `fetchFromSupabase()` function to retrieve data from Supabase
- Uses HTTPS to call Supabase REST API with service role key (server-side only)
- Updated data fetch priority:
  1. **Supabase** (production data source)
  2. Local `secrets/data.json` (development fallback)
  3. `data/public.json` (if exists, offline fallback)
- Maintains same public field extraction (`extractPublicFields()`)
- Same response format: `{ ok: true, source: 'supabase', data: { ... } }`

**Key Security Features**:
- Service key never exposed to frontend (server-side only)
- Uses native Node.js `https` module (no external dependencies)
- Graceful fallback if Supabase unavailable
- Only public fields returned to client

### 2. Created `SUPABASE_SETUP.md`

Complete step-by-step guide for:
- Creating Supabase project
- Setting up `golday_data` table
- Inserting dataset from `secrets/data.json`
- Generating service role API key
- Testing connection locally
- Configuring Vercel environment variables

### 3. No Changes to Frontend or Data Structure

✅ `golgunu.html` unchanged
✅ API response format identical (same JSON structure)
✅ No impact on user experience
✅ Frontend still receives same public data

## What You Need To Do

### Phase 1: Supabase Setup (Required Before Deployment)

Follow **`SUPABASE_SETUP.md`** steps 1-6:

1. Create Supabase project
2. Copy your Project URL (→ `SUPABASE_URL`)
3. Create `golday_data` table
4. Insert dataset from `secrets/data.json`
5. Generate service role key (→ `SUPABASE_SERVICE_KEY`)

**Time Estimate**: ~10-15 minutes

### Phase 2: Vercel Configuration (Required Before Deployment)

Add two environment variables to Vercel project settings:

```
SUPABASE_URL = [Your Project URL from Supabase]
SUPABASE_SERVICE_KEY = [Your Service Role Key from Supabase, marked as Sensitive]
```

**Time Estimate**: ~2 minutes

### Phase 3: Deployment

1. Commit the changes to `api/data.js`
2. Push to GitHub
3. Vercel will auto-deploy
4. Test: Visit `/api/data` endpoint to verify data is returned

**Note**: Do NOT commit `secrets/data.json`. The `.gitignore` already excludes it.

## Repository State

### Files Changed
- ✏️ `api/data.js` - Updated to fetch from Supabase

### Files Added
- ✨ `SUPABASE_SETUP.md` - Setup guide
- ✨ `SUPABASE_MIGRATION_SUMMARY.md` - This file

### Files Unchanged
- ✓ `golgunu.html` - Still works as-is
- ✓ `secrets/data.json` - Local only, gitignored
- ✓ `.gitignore` - Already excludes secrets/

### Files NOT in Repository (Protected)
- 🔒 `secrets/data.json` - Private, local only
- 🔒 `.env` - Vercel env vars (local dev only)
- 🔒 Supabase service key - Only in Vercel Settings

## Data Flow Diagram

### Before (Vercel Env Var - FAILED)
```
secrets/data.json → Vercel ENV_VAR (691 KB) ❌ TOO LARGE
```

### After (Supabase - WORKING)
```
secrets/data.json → Supabase Database (private, encrypted)
                    ↓
                Vercel ENV (2 small keys)
                    ↓
                API /api/data (server-side)
                    ↓
                Frontend receives public fields only
```

## Security Checklist

Before deployment, verify:

- [ ] Supabase project created
- [ ] `golday_data` table created with correct schema
- [ ] Dataset inserted and readable
- [ ] Service role key generated and saved securely
- [ ] `SUPABASE_URL` added to Vercel (not sensitive)
- [ ] `SUPABASE_SERVICE_KEY` added to Vercel (marked as SENSITIVE)
- [ ] `.gitignore` includes `secrets/`
- [ ] No dataset files committed to GitHub
- [ ] Service key not exposed in any logs or comments

## Testing After Deployment

1. **Local Test** (optional):
   ```bash
   # Test if Supabase is reachable
   curl "https://your-supabase-url.supabase.co/rest/v1/golday_data?id=eq.1&select=data" \
     -H "apikey: YOUR_SERVICE_KEY" \
     -H "Authorization: Bearer YOUR_SERVICE_KEY"
   ```

2. **Vercel Test**:
   - Visit: `https://your-vercel-domain.com/api/data`
   - Should return: `{ ok: true, source: 'supabase', data: { players, goals, clubGoals, trophies, competitions } }`

3. **Frontend Test**:
   - Visit main website
   - Should display player stats and data
   - DevTools Network tab should show `/api/data` call returning JSON

## Rollback Plan (If Needed)

If Supabase deployment fails:

1. Revert `api/data.js` to previous version
2. It will automatically fall back to `secrets/data.json` (local dev)
3. Or use `/data/public.json` if it's committed

## Next Steps

1. ✅ **Prepare**: Code changes done (api/data.js updated)
2. ⏭️ **Setup Supabase**: Follow SUPABASE_SETUP.md
3. ⏭️ **Configure Vercel**: Add env vars
4. ⏭️ **Commit & Deploy**: Push to GitHub, Vercel auto-deploys
5. ⏭️ **Test**: Verify /api/data endpoint and frontend

---

**Status**: Ready for Supabase configuration. Do NOT deploy to Vercel yet.
