# 🔧 Fix Blank Production Frontend

## Problem
Your production frontend (Vercel) is showing blank pages because it cannot connect to the backend API.

## Root Cause
The frontend is trying to connect to `http://localhost:8001/api` (development URL) instead of your production Render backend.

---

## ✅ Solution: Set Environment Variable in Vercel

### Step 1: Find Your Backend URL

Your Render backend should be at:
```
https://kenpolimarket-backend.onrender.com
```

Verify it's working by visiting:
```
https://kenpolimarket-backend.onrender.com/api/docs
```

You should see the FastAPI documentation page.

### Step 2: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click on your `kenpolimarket` project

2. **Navigate to Settings**
   - Click **"Settings"** tab
   - Click **"Environment Variables"** in the left sidebar

3. **Add the Environment Variable**
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://kenpolimarket-backend.onrender.com/api`
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

4. **Redeploy**
   - Go to **"Deployments"** tab
   - Click the **"..."** menu on the latest deployment
   - Click **"Redeploy"**
   - Wait 2-3 minutes for the build to complete

---

## 🔍 Verification Steps

### 1. Check Backend is Running
```bash
curl https://kenpolimarket-backend.onrender.com/api/health
```

Expected response:
```json
{"status": "healthy"}
```

### 2. Check API Endpoints
```bash
# Test counties endpoint
curl https://kenpolimarket-backend.onrender.com/api/counties/

# Test polling stations stats
curl https://kenpolimarket-backend.onrender.com/api/polling-stations/stats
```

### 3. Check Frontend After Redeploy
1. Visit your Vercel URL (e.g., `https://kenpolimarket.vercel.app`)
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Look for any errors
5. Go to **Network** tab
6. Refresh the page
7. Check if API calls are going to the correct URL

---

## 📊 2017 Top Counties Data

Here's the 2017 data you asked about:

| Rank | County | Stations | Total Voters | Avg/Station |
|------|--------|----------|--------------|-------------|
| 1 | Nairobi | 87 | 57,909 | 666 |
| 2 | Kiambu | 46 | 27,059 | 588 |
| 3 | Nakuru | 26 | 13,398 | 515 |
| 4 | Kakamega | 23 | 10,273 | 447 |
| 5 | Mombasa | 15 | 9,718 | 648 |
| 6 | Kisii | 19 | 9,024 | 475 |
| 7 | Murang'a | 17 | 8,941 | 526 |
| 8 | Uasin Gishu | 15 | 8,546 | 570 |
| 9 | Machakos | 17 | 7,743 | 455 |
| 10 | Meru | 15 | 7,498 | 500 |

**Note**: Only 580 out of 28,631 2017 stations matched the current polling_stations table (2% match rate). This is expected due to significant restructuring between 2017 and 2022 elections.

---

## 🚨 Common Issues & Solutions

### Issue 1: "Failed to fetch" errors
**Cause**: CORS not configured on backend  
**Solution**: Add your Vercel URL to backend CORS origins

In Render backend environment variables:
```
API_CORS_ORIGINS=https://kenpolimarket.vercel.app,https://kenpolimarket-backend.onrender.com
```

### Issue 2: Backend is sleeping (Render free tier)
**Cause**: Render free tier spins down after 15 minutes of inactivity  
**Solution**: 
- First request will take 30-60 seconds to wake up
- Consider upgrading to paid tier for always-on service
- Or implement a keep-alive ping

### Issue 3: Database connection errors
**Cause**: Backend can't connect to Render PostgreSQL  
**Solution**: Verify `DATABASE_URL` in Render backend environment variables:
```
postgresql://kenpolimarket:bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com:5432/kenpolimarket?sslmode=require
```

### Issue 4: Build succeeds but pages are blank
**Cause**: Environment variable not set during build  
**Solution**: 
1. Make sure `NEXT_PUBLIC_API_URL` is set in Vercel
2. Redeploy (don't just restart)
3. Check build logs for any errors

---

## 🔧 Quick Fix Commands

### Check if backend is accessible
```bash
# From your local machine
curl -I https://kenpolimarket-backend.onrender.com/api/health

# Should return HTTP 200
```

### Test API from browser console
Open your Vercel site, press F12, go to Console, and run:
```javascript
fetch('https://kenpolimarket-backend.onrender.com/api/counties/')
  .then(r => r.json())
  .then(d => console.log('Counties:', d))
  .catch(e => console.error('Error:', e));
```

---

## 📝 Environment Variables Checklist

### Vercel (Frontend)
- [x] `NEXT_PUBLIC_API_URL` = `https://kenpolimarket-backend.onrender.com/api`
- [ ] `NEXT_PUBLIC_ADMIN_PASSWORD` = (your admin password)

### Render Backend
- [x] `DATABASE_URL` = (PostgreSQL connection string)
- [ ] `API_CORS_ORIGINS` = `https://kenpolimarket.vercel.app`
- [ ] `API_SECRET_KEY` = (random secure string)
- [ ] `ENVIRONMENT` = `production`

---

## 🎯 Expected Behavior After Fix

1. **Homepage** (`/`)
   - Should load with navigation
   - No console errors

2. **Explorer Page** (`/explorer`)
   - Should show map
   - Should load county data
   - Should display statistics

3. **Forecasts Page** (`/forecasts`)
   - Should load forecast data
   - Should show charts
   - Should display predictions

4. **Voter Registration Page** (`/voter-registration`)
   - Should show statistics cards
   - Should display charts
   - Should show county breakdown table

---

## 🔍 Debugging Steps

If it's still blank after setting the environment variable:

1. **Check Vercel Build Logs**
   - Go to Vercel Dashboard → Deployments
   - Click on latest deployment
   - Check build logs for errors

2. **Check Browser Console**
   - Press F12
   - Look for red errors
   - Check Network tab for failed requests

3. **Check Backend Logs**
   - Go to Render Dashboard
   - Click on backend service
   - Check logs for errors

4. **Verify Environment Variable**
   - In Vercel: Settings → Environment Variables
   - Make sure `NEXT_PUBLIC_API_URL` is set for all environments
   - Make sure there are no typos

---

## 📞 Need Help?

If you're still seeing a blank page:

1. Share the Vercel deployment URL
2. Share any console errors (F12 → Console)
3. Share the Network tab showing failed requests
4. Confirm the backend URL is accessible

---

**Last Updated**: October 6, 2025  
**Status**: Ready to deploy fix

