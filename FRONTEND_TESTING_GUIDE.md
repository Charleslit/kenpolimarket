# 🧪 Frontend Testing Guide - KenPoliMarket Dashboard

## ✅ Quick Start

### 1. Ensure Services Are Running

```bash
# Terminal 1: Backend API
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Database (Docker)
docker-compose ps  # Should show postgres and redis running
```

### 2. Access the Application

- **Home Page:** http://localhost:3000
- **Forecasts Dashboard:** http://localhost:3000/forecasts
- **Backend API:** http://localhost:8001/api
- **API Docs:** http://localhost:8001/api/docs

---

## 🧪 Manual Testing Checklist

### Test 1: Home Page
- [ ] Navigate to http://localhost:3000
- [ ] Verify "KenPoliMarket" heading is visible
- [ ] Click "View Forecasts" button
- [ ] Should redirect to /forecasts page

### Test 2: Forecasts Page - Initial Load
- [ ] Navigate to http://localhost:3000/forecasts
- [ ] Verify page loads without errors
- [ ] Check header shows "🇰🇪 KenPoliMarket Forecasts"
- [ ] Verify stats show "47 Counties • 2 Elections"
- [ ] Check election selector dropdown is populated
- [ ] Verify county map is rendered (grid of 47 counties)
- [ ] Check "Select a County" message is shown in chart area

### Test 3: County Map Interactions
- [ ] Hover over any county cell
- [ ] Verify tooltip appears with:
  - County name
  - County code
  - Population
  - Turnout percentage
- [ ] Click on a county (e.g., "1" for Mombasa)
- [ ] Verify county cell gets blue border (selected state)
- [ ] Check county details panel appears at bottom showing:
  - County code
  - Population (2019)
  - Registered voters (2022)

### Test 4: Forecast Charts
- [ ] After selecting a county, verify charts load
- [ ] Check "Voter Turnout Trend" area chart displays
- [ ] Verify X-axis shows years (2017, 2022)
- [ ] Verify Y-axis shows turnout percentage (0-100%)
- [ ] Hover over chart to see tooltip
- [ ] Check "Candidate Performance" line chart displays
- [ ] Verify multiple candidate lines with different colors
- [ ] Check legend shows candidate names and parties
- [ ] Verify "Election Results Summary" table displays
- [ ] Check table shows:
  - Year
  - Winner name
  - Party
  - Votes (formatted with commas)
  - Vote percentage
  - Turnout percentage

### Test 5: Election Selector
- [ ] Click election dropdown
- [ ] Verify both elections are listed:
  - 2022 Presidential - 2022 Presidential Election
  - 2017 Presidential - 2017 Presidential Election
- [ ] Select 2017 election
- [ ] Verify county map colors update (turnout changes)
- [ ] Select 2022 election
- [ ] Verify map colors update again

### Test 6: Responsive Design
- [ ] Resize browser window to mobile size (< 768px)
- [ ] Verify layout stacks vertically
- [ ] Check map and charts are still usable
- [ ] Resize to desktop size
- [ ] Verify two-column layout returns

### Test 7: Error Handling
- [ ] Stop backend server (Ctrl+C in backend terminal)
- [ ] Refresh forecasts page
- [ ] Verify error message appears:
  - "Error Loading Data"
  - "Failed to fetch counties" or similar
  - Message about backend API URL
- [ ] Restart backend server
- [ ] Refresh page
- [ ] Verify data loads successfully

### Test 8: Loading States
- [ ] Clear browser cache (Ctrl+Shift+R)
- [ ] Navigate to /forecasts
- [ ] Verify loading spinner appears briefly
- [ ] Check "Loading forecasts..." message
- [ ] After data loads, verify spinner disappears

---

## 🔍 API Testing

### Test Backend Endpoints

```bash
# Test 1: List all counties
curl -s http://localhost:8001/api/counties/ | jq '. | length'
# Expected: 47

# Test 2: Get specific county
curl -s http://localhost:8001/api/counties/1 | jq '.name'
# Expected: "Mombasa"

# Test 3: Get county demographics
curl -s http://localhost:8001/api/counties/1/demographics | jq '.'
# Expected: Array of demographic data

# Test 4: Get county ethnicity
curl -s http://localhost:8001/api/counties/1/ethnicity | jq '.'
# Expected: Array of ethnicity aggregates

# Test 5: Get election history
curl -s http://localhost:8001/api/counties/1/election-history | jq '.elections | length'
# Expected: 2

# Test 6: List elections
curl -s http://localhost:8001/api/elections/ | jq '. | length'
# Expected: 2

# Test 7: Get election results
curl -s http://localhost:8001/api/elections/1/results | jq '.summary'
# Expected: Summary statistics object
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to fetch counties"
**Cause:** Backend not running or wrong port  
**Solution:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### Issue 2: "County not found" errors
**Cause:** County codes mismatch (leading zeros)  
**Solution:** County codes are stored as "1", "2", "3" not "001", "002", "003"

### Issue 3: Charts not rendering
**Cause:** Missing dependencies or data format mismatch  
**Solution:**
```bash
cd frontend
npm install recharts d3 @types/d3
```

### Issue 4: Map not interactive
**Cause:** D3.js not loaded or SVG not rendering  
**Solution:** Check browser console for errors, ensure D3 is installed

### Issue 5: CORS errors
**Cause:** Backend CORS not configured for frontend  
**Solution:** Backend already has CORS middleware for http://localhost:3000

### Issue 6: Database connection errors
**Cause:** PostgreSQL not running  
**Solution:**
```bash
docker-compose up -d postgres redis
docker-compose ps  # Verify running
```

---

## 📊 Sample Test Data

### Counties to Test:
- **1** - Mombasa (Coastal, high turnout)
- **47** - Nairobi (Capital, largest population)
- **22** - Nakuru (Rift Valley)
- **30** - Baringo (Lower turnout)

### Expected Data:
- **Elections:** 2 (2022, 2017)
- **Candidates per election:** 2
- **Total results:** 188 (47 counties × 2 elections × 2 candidates)

---

## 🎯 Performance Benchmarks

### Expected Load Times:
- **Home page:** < 1 second
- **Forecasts page initial load:** < 2 seconds
- **County selection:** < 500ms
- **Chart rendering:** < 300ms
- **API response:** < 100ms

### Browser Console:
- **No errors** in console
- **No warnings** about missing dependencies
- **Network tab:** All API calls return 200 OK

---

## 🔧 Developer Tools Testing

### Chrome DevTools:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh page
4. Verify API calls:
   - `GET /api/counties/` → 200 OK
   - `GET /api/elections/` → 200 OK
   - `GET /api/elections/1/results` → 200 OK
5. Go to **Console** tab
6. Verify no errors
7. Go to **Elements** tab
8. Inspect county map SVG
9. Verify all 47 county cells are rendered

### React DevTools:
1. Install React DevTools extension
2. Open DevTools
3. Go to **Components** tab
4. Inspect component tree:
   - ForecastsPage
   - CountyMap
   - ForecastChart
5. Check component state:
   - `counties` array (47 items)
   - `elections` array (2 items)
   - `selectedCounty` (null or County object)

---

## ✅ Success Criteria

### All tests pass if:
- ✅ Home page loads without errors
- ✅ Forecasts page displays 47 counties
- ✅ County map is interactive (click, hover)
- ✅ Charts render with real data
- ✅ Election selector works
- ✅ County details panel updates on selection
- ✅ No console errors
- ✅ All API calls return 200 OK
- ✅ Responsive design works on mobile
- ✅ Loading states appear and disappear correctly

---

## 📝 Test Report Template

```markdown
# Frontend Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Development/Staging/Production]

## Test Results

### Home Page
- [ ] PASS / [ ] FAIL - Page loads
- [ ] PASS / [ ] FAIL - Navigation works

### Forecasts Page
- [ ] PASS / [ ] FAIL - Initial load
- [ ] PASS / [ ] FAIL - County map renders
- [ ] PASS / [ ] FAIL - Charts display
- [ ] PASS / [ ] FAIL - Interactions work

### API Integration
- [ ] PASS / [ ] FAIL - Counties endpoint
- [ ] PASS / [ ] FAIL - Elections endpoint
- [ ] PASS / [ ] FAIL - Election history endpoint

### Issues Found:
1. [Issue description]
2. [Issue description]

### Screenshots:
[Attach screenshots of any issues]

### Notes:
[Additional observations]
```

---

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - ✅ Mark Priority 3 as complete
   - ✅ Proceed to Priority 4 (Model Training)
   - ✅ Document any improvements needed

2. **If tests fail:**
   - 🔍 Review error messages
   - 🐛 Debug using browser console
   - 🔧 Fix issues and re-test
   - 📝 Update documentation

---

## 📖 Additional Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Recharts Docs:** https://recharts.org/
- **D3.js Docs:** https://d3js.org/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com/

---

**Happy Testing! 🎉🇰🇪📊**

