# 🎯 QUICK START: Supabase Configuration

**Status**: Code changes complete ✅ | Awaiting your Supabase setup 🔧

---

## 📋 Exactly What You Need To Do

### Step 1: Create Supabase Account
- Go to https://app.supabase.com
- Create new project
- **Save your Project URL** (example: `https://xyzabc123.supabase.co`)

### Step 2: Create Table
In Supabase SQL Editor, run:
```sql
CREATE TABLE IF NOT EXISTS golday_data (
  id BIGINT PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (id = 1)
);
ALTER TABLE golday_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON golday_data FOR SELECT USING (true);
```

### Step 3: Insert Your Data
In Supabase SQL Editor, paste this (replace `[YOUR_JSON_HERE]`):
```sql
INSERT INTO golday_data (id, data) VALUES (1, '[YOUR_JSON_HERE]'::jsonb)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
```

To get `[YOUR_JSON_HERE]`:
1. Open `C:\Users\ymehm\secrets\data.json` in your text editor
2. Copy the entire file contents
3. Paste it in place of `[YOUR_JSON_HERE]` in the SQL above
4. Run the query

### Step 4: Get Your Service Key
In Supabase Settings → API:
1. Find "Service role (secret)" 
2. Click copy button
3. **Save this key securely** (don't share or commit it!)

### Step 5: Add to Vercel
In Vercel Project Settings → Environment Variables, add:

```
SUPABASE_URL = [Your Project URL from Step 1]
SUPABASE_SERVICE_KEY = [Your Service Key from Step 4, mark as SENSITIVE]
```

### Step 6: Deploy
```bash
cd C:\Users\ymehm\goal.day-website
git add api/data.js SUPABASE_*.md
git commit -m "Configure Supabase for private data storage"
git push origin master
```

Vercel will auto-deploy.

### Step 7: Test
Visit: `https://your-vercel-domain.com/api/data`

Should return: `{ "ok": true, "source": "supabase", "data": {...} }`

---

## 🔐 Security Summary

✅ **Protected**:
- Service key stored in Vercel only (not in code)
- Full dataset NOT in GitHub
- Server-side only (never sent to frontend)
- HTTPS encrypted communication

✅ **Unchanged**:
- Frontend sees same public data
- Frontend works same way
- No code changes needed in `golgunu.html`

---

## 📄 Documentation

For detailed step-by-step instructions, see:
- **`SUPABASE_SETUP.md`** ← START HERE (has screenshots and all details)
- `SUPABASE_READY.md` (complete overview)
- `SUPABASE_MIGRATION_SUMMARY.md` (technical details)

---

## ⚠️ Important Notes

- **Do NOT commit** `secrets/data.json` (already gitignored)
- **Do NOT share** the service key (it's sensitive!)
- **Do NOT use** the anon key (use service role key instead)
- **Do keep** the service key safe and private
- The frontend can still see public data (this is intentional)

---

## ✅ Checklist

Before you finish, verify:
- [ ] Supabase project created
- [ ] Table created in Supabase
- [ ] Dataset inserted successfully
- [ ] Service key generated
- [ ] `SUPABASE_URL` added to Vercel
- [ ] `SUPABASE_SERVICE_KEY` added to Vercel (marked Sensitive)
- [ ] Code committed and pushed
- [ ] `/api/data` endpoint returns data

---

**Ready?** Open `SUPABASE_SETUP.md` for the full step-by-step guide with screenshots!
