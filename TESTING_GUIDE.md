# 🧪 KenPoliMarket Testing Guide

Quick reference for testing all new features after deployment.

---

## 🎯 Quick Test Checklist

### 1. Backend API Tests (5 minutes)

**Base URL**: `https://your-backend.onrender.com`

```bash
# Replace with your actual backend URL
export API_URL="https://your-backend.onrender.com"

# Test 1: Health Check
curl $API_URL/health

# Test 2: Get Counties
curl $API_URL/api/counties | jq

# Test 3: Get Constituencies
curl $API_URL/api/constituencies | jq

# Test 4: Get Wards (filtered by constituency)
curl "$API_URL/api/wards?constituency_id=1" | jq

# Test 5: Get Candidates
curl $API_URL/api/candidates | jq

# Test 6: Create Governor Candidate (requires county_id)
curl -X POST $API_URL/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Governor",
    "party": "Test Party",
    "position": "Governor",
    "county_id": 1,
    "election_id": 1
  }' | jq

# Test 7: Try to create Governor without county_id (should fail)
curl -X POST $API_URL/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Governor",
    "party": "Test Party",
    "position": "Governor",
    "election_id": 1
  }' | jq
```

**Expected Results**:
- ✅ Health check returns 200 OK
- ✅ Counties list returns 47 counties
- ✅ Constituencies list returns data
- ✅ Wards filtered by constituency
- ✅ Governor creation succeeds with county_id
- ✅ Governor creation fails without county_id (validation error)

---

### 2. Frontend Feature Tests (10 minutes)

**Base URL**: `https://your-frontend.vercel.app` or `.onrender.com`

#### A. Candidate Manager (Position-Specific Fields)

1. Navigate to `/admin`
2. Click "Candidates" tab
3. Click "Add Candidate"
4. **Test Governor**:
   - Select Position: "Governor"
   - ✅ County dropdown appears
   - ✅ Constituency and Ward dropdowns hidden
   - Select a county
   - Fill in name and party
   - Click "Add Candidate"
   - ✅ Candidate created successfully

5. **Test MP**:
   - Select Position: "MP"
   - ✅ County dropdown appears
   - Select a county
   - ✅ Constituency dropdown appears (filtered by county)
   - ✅ Ward dropdown hidden
   - Select constituency
   - ✅ Candidate created successfully

6. **Test MCA**:
   - Select Position: "MCA"
   - ✅ All three dropdowns appear
   - Select county → constituencies filter
   - Select constituency → wards filter
   - ✅ Candidate created successfully

#### B. Export Features

1. **Test Scenario Export**:
   - Navigate to `/admin` → "Scenarios" tab
   - Create a simple scenario
   - Click "Calculate"
   - ✅ Export button appears in top-right
   - Click Export → "Export as PDF"
   - ✅ PDF downloads with branding
   - Click Export → "Export as CSV"
   - ✅ CSV downloads
   - Click Export → "Export as Image"
   - ✅ PNG image downloads

2. **Test Comparison Export**:
   - Navigate to `/comparisons`
   - Select two elections
   - Click "Compare"
   - ✅ Export button appears
   - Test PDF, CSV, and Image exports

3. **Test Explorer Export**:
   - Navigate to `/explorer`
   - ✅ Export button in search bar
   - Click Export → "Export as CSV"
   - ✅ Counties CSV downloads
   - Click on a county
   - ✅ Export constituencies CSV

4. **Test Export Demo Page**:
   - Navigate to `/test-exports`
   - ✅ Page loads with sample data
   - Test all export buttons
   - ✅ All exports work

#### C. PWA Features (Mobile Device Required)

1. **Install Prompt**:
   - Open site on mobile device (Chrome/Safari)
   - Wait 3 seconds
   - ✅ Install banner appears at bottom
   - Click "Install App"
   - ✅ App installs to home screen
   - Open installed app
   - ✅ Runs in standalone mode

2. **Offline Mode**:
   - With app installed, visit a few pages
   - Enable airplane mode
   - Navigate to previously visited pages
   - ✅ Pages load from cache
   - ✅ Yellow "offline" banner appears at top
   - Disable airplane mode
   - ✅ Banner disappears

3. **Service Worker**:
   - Open DevTools → Application → Service Workers
   - ✅ Service worker registered
   - ✅ Status: "activated and running"
   - Check Cache Storage
   - ✅ Caches exist with static assets

#### D. Data Management

1. **Election Data Manager**:
   - Navigate to `/admin` → "Election Data" tab
   - **Test Election Creation**:
     - Click "Elections" sub-tab
     - Fill in election details
     - Click "Create Election"
     - ✅ Election created

   - **Test Manual Entry**:
     - Click "Manual Entry" sub-tab
     - Select election, county, candidate
     - Enter vote count
     - Click "Add Result"
     - ✅ Result added

   - **Test Import** (optional):
     - Click "Import Data" sub-tab
     - Upload `data/sample_2022_presidential.csv`
     - ✅ Import succeeds
     - ✅ Shows success message with count

#### E. Enhanced Features

1. **County Explorer**:
   - Navigate to `/explorer`
   - ✅ Shows all 47 counties
   - Click on a county
   - ✅ Shows constituencies in that county
   - ✅ Breadcrumb navigation works
   - Click on a constituency
   - ✅ Shows wards in that constituency
   - Click breadcrumb to go back
   - ✅ Navigation works

2. **Voting Comparison**:
   - Navigate to `/comparisons`
   - Select two elections
   - ✅ National comparison shows candidate changes
   - Switch to "County-by-County"
   - ✅ Shows county-level swings
   - ✅ Color coding works (green=gain, red=loss)

3. **Scenario Calculator**:
   - Navigate to `/admin` → "Scenarios" tab
   - Create regional adjustments
   - Click "Calculate"
   - ✅ Regional Impact Analysis section appears
   - ✅ Shows before → after for each region
   - ✅ Color-coded changes display

---

## 🐛 Common Issues & Solutions

### Backend Issues

**Issue**: API returns 500 error
- **Check**: Render logs for error details
- **Solution**: Verify DATABASE_URL is set correctly

**Issue**: CORS error in browser console
- **Check**: `API_CORS_ORIGINS` environment variable
- **Solution**: Add your frontend URL to CORS origins

**Issue**: Candidate creation fails with validation error
- **Check**: Position-specific fields are provided
- **Solution**: Governor needs county_id, MP needs constituency_id, MCA needs ward_id

### Frontend Issues

**Issue**: Export buttons don't appear
- **Check**: Browser console for errors
- **Solution**: Verify jsPDF and html2canvas are installed

**Issue**: PWA install prompt doesn't appear
- **Check**: Must be HTTPS (Render provides this)
- **Check**: Must be production build
- **Solution**: Build with `npm run build`, serve with `npm start`

**Issue**: Cascading dropdowns don't filter
- **Check**: Browser console for API errors
- **Check**: Network tab for failed requests
- **Solution**: Verify constituencies and wards APIs are working

**Issue**: Service worker not registering
- **Check**: DevTools → Application → Service Workers
- **Check**: Must be production build
- **Solution**: Clear cache, rebuild, redeploy

### Database Issues

**Issue**: Migration already applied error
- **Solution**: Safe to ignore if columns exist

**Issue**: Connection timeout
- **Solution**: Render databases may sleep, retry after a moment

---

## 📊 Performance Benchmarks

### Expected Load Times

| Page | First Load | Cached Load | Offline |
|------|-----------|-------------|---------|
| Home | < 2s | < 0.5s | ✅ |
| Admin | < 3s | < 1s | ✅ |
| Explorer | < 2s | < 0.5s | ✅ |
| Comparisons | < 2s | < 1s | ✅ |

### Export Times

| Export Type | Small Dataset | Large Dataset |
|-------------|---------------|---------------|
| PDF | < 1s | < 3s |
| CSV | < 0.5s | < 1s |
| Image | < 2s | < 4s |

---

## ✅ Success Criteria

Your deployment is successful if:

- ✅ All API endpoints return 200 OK
- ✅ Candidate creation works with position validation
- ✅ Cascading dropdowns filter correctly
- ✅ All export features work (PDF, CSV, Image)
- ✅ PWA installs on mobile devices
- ✅ Offline mode works for cached pages
- ✅ County explorer navigation works
- ✅ Voting comparison displays correctly
- ✅ Scenario calculator shows regional breakdown

---

## 🎯 Quick Smoke Test (2 minutes)

Run this minimal test to verify everything is working:

1. ✅ Visit homepage → loads successfully
2. ✅ Navigate to `/admin` → loads successfully
3. ✅ Create a Governor candidate with county → succeeds
4. ✅ Navigate to `/explorer` → shows counties
5. ✅ Navigate to `/test-exports` → all exports work
6. ✅ Open on mobile → install prompt appears

If all 6 tests pass, your deployment is successful! 🎉

---

## 📞 Need Help?

1. **Check Logs**:
   - Backend: Render Dashboard → Logs
   - Frontend: Browser DevTools → Console
   - Database: Render Dashboard → Database → Logs

2. **Verify Environment Variables**:
   - Backend: Check `DATABASE_URL`, `API_CORS_ORIGINS`
   - Frontend: Check `NEXT_PUBLIC_API_URL`

3. **Test Locally First**:
   ```bash
   # Backend
   cd backend
   uvicorn main:app --reload
   
   # Frontend
   cd frontend
   npm run dev
   ```

4. **Database Connection**:
   ```bash
   psql "postgresql://kenpolimarket:***@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket"
   ```

---

**Happy Testing! 🚀**

