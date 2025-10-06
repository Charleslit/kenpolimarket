# 🚨 URGENT FIX: Double /api/api/ Issue

## Problem Found! ✅

Your frontend is hitting:
```
https://kenpolimarket-backend.onrender.com/api/api/counties/
                                              ^^^^^^^^
                                              DOUBLE /api/
```

Instead of:
```
https://kenpolimarket-backend.onrender.com/api/counties/
```

## Root Cause

The code in `frontend/components/explorer/InteractiveMap.tsx` line 6:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
```

Then on line 101:
```typescript
fetch(`${API_BASE_URL}/counties/`)
```

This creates: `BASE_URL` + `/api/counties/` = **DOUBLE /api/**

---

## ✅ SOLUTION: Update Vercel Environment Variable

### Step-by-Step Fix (2 minutes)

**In Vercel Dashboard:**

1. **Go to**: https://vercel.com/dashboard

2. **Click** your `kenpolimarket` project

3. **Click** Settings tab → Environment Variables

4. **Look for**: `NEXT_PUBLIC_API_URL`
   - If it exists, click **Edit**
   - If it doesn't exist, click **Add New**

5. **Set the value to**:
   ```
   https://kenpolimarket-backend.onrender.com
   ```

   ⚠️ **IMPORTANT**: Do NOT include `/api` at the end!

   ❌ Wrong: `https://kenpolimarket-backend.onrender.com/api`
   ✅ Correct: `https://kenpolimarket-backend.onrender.com`

6. **Select environments**: Production, Preview, Development (all three)

7. **Click** Save

8. **Redeploy**:
   - Go to Deployments tab
   - Click the "..." menu on the latest deployment
   - Click "Redeploy"
   - Wait 2-3 minutes

---

## 🔍 Why This Works

Your code has:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

// Then later:
fetch(`${API_BASE_URL}/counties/`)
```

**With wrong env var** (`https://...onrender.com/api`):
- Result: `https://kenpolimarket-backend.onrender.com/api` + `/api/counties/`
- Final: `https://kenpolimarket-backend.onrender.com/api/api/counties/` ❌

**With correct env var** (`https://...onrender.com`):
- Result: `https://kenpolimarket-backend.onrender.com` + `/api/counties/`
- Final: `https://kenpolimarket-backend.onrender.com/api/counties/` ✅

---

## 🔍 Files That Need Checking

Let me search for all files with this pattern:

```bash
# Files that might have the same issue
frontend/components/explorer/InteractiveMap.tsx
frontend/app/voter-registration/page.tsx
frontend/components/dashboard/RegionalBreakdown.tsx
```

All files that use `API_BASE_URL` and then add `/api/` again.

---

## 🎯 Quick Test

After fixing, test these URLs in your browser:

### Should Work (200 OK):
```
https://kenpolimarket-backend.onrender.com/api/counties/
https://kenpolimarket-backend.onrender.com/api/polling-stations/stats
https://kenpolimarket-backend.onrender.com/api/docs
```

### Should NOT Work (404):
```
https://kenpolimarket-backend.onrender.com/api/api/counties/
```

---

## 📝 Correct Configuration

### Vercel Environment Variable:
```
NEXT_PUBLIC_API_URL=https://kenpolimarket-backend.onrender.com
```
(NO `/api` at the end)

### Frontend Code:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Then in fetch calls:
fetch(`${API_BASE_URL}/counties/`)
```

This creates: `https://kenpolimarket-backend.onrender.com` + `/api/counties/` = ✅ Correct!

---

## 🚀 After Fix

Your explorer page should:
1. Load the map
2. Show county markers
3. Allow drilling down to constituencies → wards → polling stations
4. Display voter registration data

---

## ⏱️ Time to Fix: 2 minutes

1. Update environment variable in Vercel (30 seconds)
2. Redeploy (2 minutes)
3. Test (30 seconds)

**Total**: ~3 minutes to working production site! 🎉

