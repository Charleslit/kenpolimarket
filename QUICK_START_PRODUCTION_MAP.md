# 🚀 Quick Start: Production Map with Real GeoJSON

**Goal:** Replace the simplified grid map with a real interactive map using actual Kenya county boundaries.

---

## ⚡ 3-Step Setup (5 minutes)

### Step 1: Install Dependencies

```bash
cd frontend
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

### Step 2: Download GeoJSON Data

```bash
# From project root
./scripts/download_kenya_geojson.sh
```

**OR** download manually:
- Visit: https://data.humdata.org/dataset/cod-ab-ken
- Download GeoJSON for Admin Level 1 (Counties)
- Save to: `frontend/public/kenya-counties.geojson`

### Step 3: Update Your Code

In `frontend/app/forecasts/page.tsx`:

```tsx
// Add this import at the top
import LeafletCountyMap from '@/components/maps/LeafletCountyMap';

// Find the CountyMap component (around line 331) and replace it:
<LeafletCountyMap
  counties={filteredCounties}
  selectedCounty={selectedCounty}
  onCountyClick={handleCountyClick}
  electionResults={electionResults}
/>
```

In `frontend/app/layout.tsx`, add Leaflet CSS:

```tsx
import 'leaflet/dist/leaflet.css';
```

**That's it!** 🎉

---

## 🧪 Test It

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000/forecasts

Click the "County Explorer" tab and you should see a real map of Kenya!

---

## 🎨 What You Get

✅ **Real county boundaries** - Actual GeoJSON shapes, not a grid  
✅ **Interactive** - Click counties to select, hover for tooltips  
✅ **Color-coded** - By voter turnout percentage  
✅ **Responsive** - Works on mobile and desktop  
✅ **Pan & Zoom** - Full map controls  
✅ **Legend** - Shows what colors mean  
✅ **Popups** - Click counties for detailed info  

---

## 🔧 Troubleshooting

### "Failed to load GeoJSON"

**Check file exists:**
```bash
ls frontend/public/kenya-counties.geojson
```

**If missing, download manually:**
1. Go to: https://data.humdata.org/dataset/cod-ab-ken
2. Download "Admin 1 - Counties" in GeoJSON format
3. Save to `frontend/public/kenya-counties.geojson`

### "Counties not matching"

The GeoJSON property names might be different. Check what properties are available:

```bash
# View first feature properties
cat frontend/public/kenya-counties.geojson | jq '.features[0].properties'
```

Then update `LeafletCountyMap.tsx` line ~103:

```tsx
const countyName = feature.properties.COUNTY_NAM || 
                   feature.properties.name || 
                   feature.properties.NAME;  // Add your property name here
```

### "Map not showing"

1. Check browser console for errors
2. Make sure you imported Leaflet CSS in `layout.tsx`
3. Clear browser cache and reload

---

## 📊 Alternative: Use Existing D3 Map with GeoJSON

If you prefer to keep using D3 instead of Leaflet, I can update your existing `CountyMap.tsx` to use real GeoJSON. Just let me know!

---

## 🌍 Alternative Map Providers

### Want a different look?

**Satellite imagery:**
```tsx
<TileLayer
  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
/>
```

**Dark theme:**
```tsx
<TileLayer
  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
/>
```

**Terrain:**
```tsx
<TileLayer
  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
/>
```

---

## 📚 Full Documentation

See `PRODUCTION_MAP_SETUP.md` for:
- Detailed explanations
- Mapbox GL JS alternative
- D3.js with GeoJSON option
- Customization examples
- Performance optimization

---

## ✅ Checklist

- [ ] Install `leaflet` and `react-leaflet`
- [ ] Download `kenya-counties.geojson` to `frontend/public/`
- [ ] Import `LeafletCountyMap` in `forecasts/page.tsx`
- [ ] Add Leaflet CSS to `layout.tsx`
- [ ] Test in browser
- [ ] Customize colors/styles (optional)
- [ ] Deploy to production

---

**Questions?** Check the component code in `frontend/components/maps/LeafletCountyMap.tsx` or see the full guide in `PRODUCTION_MAP_SETUP.md`.

