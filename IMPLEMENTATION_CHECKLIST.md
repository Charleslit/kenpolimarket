# ✅ Production Map Implementation Checklist

Follow this checklist to implement real GeoJSON county boundaries in production.

---

## 🎯 Choose Your Implementation

- [ ] **Option A: Leaflet** (Recommended - easiest, mobile-friendly)
- [ ] **Option B: D3.js** (No dependencies, full control)
- [ ] **Option C: Mapbox GL** (Premium, best performance)

---

## 📦 Option A: Leaflet Implementation

### Step 1: Install Dependencies
```bash
cd frontend
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

- [ ] Dependencies installed
- [ ] No errors in terminal

### Step 2: Download GeoJSON Data
```bash
cd ..
./scripts/download_kenya_geojson.sh
```

**OR** download manually:
- [ ] Visit https://data.humdata.org/dataset/cod-ab-ken
- [ ] Download "Admin 1 - Counties" GeoJSON
- [ ] Save to `frontend/public/kenya-counties.geojson`

**Verify:**
```bash
ls -lh frontend/public/kenya-counties.geojson
# Should show file size (e.g., 2.5M)
```

- [ ] GeoJSON file exists
- [ ] File size > 100KB

### Step 3: Add Leaflet CSS

Edit `frontend/app/layout.tsx`:

```tsx
// Add this import at the top
import 'leaflet/dist/leaflet.css';
```

- [ ] CSS import added
- [ ] No TypeScript errors

### Step 4: Update Forecasts Page

Edit `frontend/app/forecasts/page.tsx`:

```tsx
// Change this import (around line 4):
import CountyMap from '@/components/maps/CountyMap';

// To this:
import LeafletCountyMap from '@/components/maps/LeafletCountyMap';

// Then find the CountyMap component (around line 331) and replace:
<CountyMap
  counties={filteredCounties}
  selectedCounty={selectedCounty}
  onCountyClick={handleCountyClick}
  electionResults={electionResults}
/>

// With:
<LeafletCountyMap
  counties={filteredCounties}
  selectedCounty={selectedCounty}
  onCountyClick={handleCountyClick}
  electionResults={electionResults}
/>
```

- [ ] Import changed
- [ ] Component replaced
- [ ] No TypeScript errors

### Step 5: Test Locally

```bash
cd frontend
npm run dev
```

- [ ] Server starts without errors
- [ ] Visit http://localhost:3000/forecasts
- [ ] Click "County Explorer" tab
- [ ] Map loads with real Kenya boundaries
- [ ] Counties are clickable
- [ ] Hover shows tooltips
- [ ] Pan and zoom work

### Step 6: Fix County Name Matching (if needed)

If counties don't match, check GeoJSON properties:

```bash
cat frontend/public/kenya-counties.geojson | head -100 | grep -i "properties"
```

Update `LeafletCountyMap.tsx` line ~103:

```tsx
const countyName = feature.properties.COUNTY_NAM || 
                   feature.properties.name || 
                   feature.properties.NAME ||
                   feature.properties.County;  // Add your property name
```

- [ ] County names match
- [ ] All 47 counties are colored correctly

### Step 7: Customize (Optional)

**Change base map:**
```tsx
// In LeafletCountyMap.tsx, line ~200
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  // Try: satellite, dark, terrain, etc.
/>
```

**Change colors:**
```tsx
// In LeafletCountyMap.tsx, getTurnoutColor function
const getTurnoutColor = (countyCode: string): string => {
  // Customize color scheme here
};
```

- [ ] Customizations applied (if desired)

### Step 8: Deploy to Production

```bash
# Build for production
cd frontend
npm run build

# Test production build
npm start
```

- [ ] Build succeeds
- [ ] No errors in production build
- [ ] Map works in production mode

---

## 📦 Option B: D3.js Implementation

### Step 1: Download GeoJSON Data
```bash
./scripts/download_kenya_geojson.sh
```

- [ ] GeoJSON file in `frontend/public/kenya-counties.geojson`
- [ ] File size > 100KB

### Step 2: Update Forecasts Page

Edit `frontend/app/forecasts/page.tsx`:

```tsx
// Change import:
import D3CountyMap from '@/components/maps/D3CountyMap';

// Replace component:
<D3CountyMap
  counties={filteredCounties}
  selectedCounty={selectedCounty}
  onCountyClick={handleCountyClick}
  electionResults={electionResults}
/>
```

- [ ] Import changed
- [ ] Component replaced
- [ ] No TypeScript errors

### Step 3: Test Locally

```bash
cd frontend
npm run dev
```

- [ ] Map loads with real boundaries
- [ ] Counties clickable
- [ ] Zoom works (scroll wheel)
- [ ] Pan works (click and drag)

### Step 4: Fix County Name Matching (if needed)

Update `D3CountyMap.tsx` property names as needed.

- [ ] All counties match and display correctly

### Step 5: Deploy

```bash
npm run build
npm start
```

- [ ] Production build works
- [ ] Map displays correctly

---

## 🧪 Testing Checklist

### Functionality Tests
- [ ] Map loads without errors
- [ ] All 47 counties visible
- [ ] Counties are color-coded by turnout
- [ ] Click county → selects it
- [ ] Selected county shows blue border
- [ ] Hover → shows tooltip
- [ ] Tooltip shows correct data
- [ ] Legend displays correctly
- [ ] Pan works (Leaflet/Mapbox only)
- [ ] Zoom works

### Browser Tests
- [ ] Chrome/Edge (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (iOS)

### Performance Tests
- [ ] Map loads in < 2 seconds
- [ ] No lag when clicking counties
- [ ] Smooth pan/zoom
- [ ] No console errors
- [ ] No memory leaks

### Data Tests
- [ ] All 47 counties present
- [ ] County names match database
- [ ] Turnout colors accurate
- [ ] Population data correct
- [ ] Voter registration data correct

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to load GeoJSON"

**Solutions:**
```bash
# Check file exists
ls frontend/public/kenya-counties.geojson

# Check file is valid JSON
cat frontend/public/kenya-counties.geojson | jq . > /dev/null

# Re-download if needed
./scripts/download_kenya_geojson.sh
```

- [ ] Issue resolved

### Issue: "Counties not matching"

**Solutions:**
1. Check GeoJSON property names:
```bash
cat frontend/public/kenya-counties.geojson | jq '.features[0].properties'
```

2. Update component to match property names

- [ ] Issue resolved

### Issue: "Map not showing"

**Solutions:**
1. Check browser console for errors
2. Verify Leaflet CSS imported (Leaflet only)
3. Check container has height
4. Clear browser cache

- [ ] Issue resolved

### Issue: "Performance is slow"

**Solutions:**
1. Simplify GeoJSON:
```bash
npm install -g mapshaper
mapshaper kenya-counties.geojson -simplify 20% -o kenya-counties-simplified.geojson
```

2. Use Mapbox GL for better performance

- [ ] Issue resolved

---

## 📊 Performance Benchmarks

### Target Metrics
- [ ] Initial load: < 2 seconds
- [ ] Time to interactive: < 3 seconds
- [ ] County click response: < 100ms
- [ ] Zoom/pan: 60 FPS
- [ ] Bundle size increase: < 200KB

### Actual Metrics
- Initial load: _______ seconds
- Time to interactive: _______ seconds
- County click: _______ ms
- FPS: _______
- Bundle size: _______ KB

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Production build succeeds
- [ ] Performance acceptable
- [ ] Mobile tested
- [ ] Cross-browser tested

### Deployment
- [ ] GeoJSON file in production `/public` folder
- [ ] Environment variables set (if using Mapbox)
- [ ] CDN configured (if applicable)
- [ ] Monitoring enabled

### Post-Deployment
- [ ] Map loads in production
- [ ] All features work
- [ ] Performance acceptable
- [ ] No errors in logs
- [ ] User feedback collected

---

## 📝 Documentation

- [ ] Update README with map implementation details
- [ ] Document GeoJSON source
- [ ] Document customization options
- [ ] Add troubleshooting guide
- [ ] Update API documentation (if applicable)

---

## 🎉 Success Criteria

Your implementation is successful when:

- ✅ Real Kenya county boundaries display
- ✅ All 47 counties are visible and interactive
- ✅ Counties match your database
- ✅ Performance is acceptable (< 2s load)
- ✅ Works on mobile and desktop
- ✅ No console errors
- ✅ Users can click, hover, and navigate
- ✅ Data displays correctly

---

## 📚 Reference Files

- **Quick Start:** `QUICK_START_PRODUCTION_MAP.md`
- **Full Guide:** `PRODUCTION_MAP_SETUP.md`
- **Comparison:** `MAP_OPTIONS_COMPARISON.md`
- **Download Script:** `scripts/download_kenya_geojson.sh`
- **Leaflet Component:** `frontend/components/maps/LeafletCountyMap.tsx`
- **D3 Component:** `frontend/components/maps/D3CountyMap.tsx`

---

**Ready to start?** Pick your option and work through the checklist! ✨

