# Explorer Map Setup Guide

## 🎉 What Changed

The explorer page (`/explorer`) now uses **Leaflet** for interactive maps, just like the forecasts page!

### Before vs After

| Feature | Old (Custom Map) | New (Leaflet Map) |
|---------|------------------|-------------------|
| Map Library | Custom CSS/HTML | Leaflet.js |
| Pan & Zoom | ❌ No | ✅ Yes |
| Real Map Tiles | ❌ No | ✅ Yes (OpenStreetMap) |
| Boundaries | ❌ No | ✅ Yes (with GeoJSON) |
| Mobile Support | ⚠️ Basic | ✅ Excellent |
| Coordinates | Hardcoded | GeoJSON centroids |

## 📁 Files Created

### 1. New Leaflet Map Component
**File:** `frontend/components/explorer/LeafletInteractiveMap.tsx`

This is the new interactive map that:
- ✅ Uses Leaflet for proper map rendering
- ✅ Loads GeoJSON files for boundaries
- ✅ Calculates centroids from polygons
- ✅ Falls back to approximate locations if GeoJSON not available
- ✅ Shows markers for counties, constituencies, wards, and polling stations

### 2. GeoJSON Documentation
**File:** `frontend/public/GEOJSON_README.md`

Complete guide on:
- Where to find GeoJSON files
- How to convert shapefiles
- File format requirements
- Property naming conventions

### 3. Download Script
**File:** `scripts/download_geojson.sh`

Automated script to download GeoJSON files from GADM (Global Administrative Areas).

## 🚀 Quick Start

### Step 1: Start the Database

The explorer needs the PostgreSQL database running:

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Or if using Docker
docker-compose up -d postgres
```

### Step 2: Start the Servers

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8001

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Step 3: View the Explorer

Open http://localhost:3000/explorer

## 📥 Adding GeoJSON Files

### Option 1: Automatic Download (Recommended)

Run the download script:

```bash
./scripts/download_geojson.sh
```

This will:
1. Download GeoJSON from GADM
2. Simplify the files (if mapshaper is installed)
3. Place them in `frontend/public/`

### Option 2: Manual Download

1. **Visit GADM:**
   - Go to https://gadm.org/download_country.html
   - Select "Kenya"
   - Choose "GeoJSON" format
   - Download levels 1, 2, and 3

2. **Rename and place files:**
   ```bash
   mv gadm41_KEN_1.json frontend/public/kenya-counties.geojson
   mv gadm41_KEN_2.json frontend/public/kenya-constituencies.geojson
   mv gadm41_KEN_3.json frontend/public/kenya-wards.geojson
   ```

### Option 3: Use Kenya Open Data

1. Visit https://kenya.opendataforafrica.org/
2. Search for "administrative boundaries"
3. Download shapefiles
4. Convert to GeoJSON using:
   ```bash
   ogr2ogr -f GeoJSON output.geojson input.shp
   ```

## 📊 Current Status

### ✅ Working Now
- **Counties (47)**: Using existing `kenya-counties.geojson`
- **Leaflet integration**: Full pan/zoom/tile support
- **API integration**: Fetching data from backend
- **Marker clustering**: Auto-zoom to fit markers

### ⚠️ Needs GeoJSON Files
- **Constituencies (290)**: Will show approximate locations until GeoJSON added
- **Wards (1450+)**: Will show approximate locations until GeoJSON added

### 📍 Polling Stations
- Uses `latitude` and `longitude` from database
- No GeoJSON needed (point data, not boundaries)

## 🗺️ How the Map Works

### 1. National Level (Counties)
```
User visits /explorer
  ↓
Fetches all counties from API
  ↓
Loads kenya-counties.geojson
  ↓
Calculates centroid for each county
  ↓
Shows markers on map
```

### 2. County Level (Constituencies)
```
User clicks a county
  ↓
Fetches constituencies for that county
  ↓
Tries to load kenya-constituencies.geojson
  ↓
If found: Uses GeoJSON centroids
If not found: Uses approximate locations
  ↓
Shows markers on map
```

### 3. Constituency Level (Wards)
```
User clicks a constituency
  ↓
Fetches wards for that constituency
  ↓
Tries to load kenya-wards.geojson
  ↓
If found: Uses GeoJSON centroids
If not found: Uses approximate locations
  ↓
Shows markers on map
```

### 4. Ward Level (Polling Stations)
```
User clicks a ward
  ↓
Fetches polling stations for that ward
  ↓
Uses lat/lng from database
  ↓
Shows markers on map
```

## 🎨 Customization

### Change Map Tiles

Edit `LeafletInteractiveMap.tsx`:

```tsx
<TileLayer
  attribution='&copy; OpenStreetMap'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
```

**Other tile options:**
- **Satellite:** `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- **Terrain:** `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png`
- **Dark mode:** `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`

### Change Marker Colors

Edit the `createCustomIcon` function in `LeafletInteractiveMap.tsx`:

```tsx
const colors = {
  county: '#2563eb',        // Blue
  constituency: '#16a34a',  // Green
  ward: '#ca8a04',          // Yellow
  polling_station: '#dc2626' // Red
};
```

### Adjust Map Height

Edit the MapContainer style:

```tsx
<MapContainer
  style={{ height: '600px', width: '100%' }}  // Change 600px
  ...
/>
```

## 🐛 Troubleshooting

### Map not showing?

1. **Check browser console** for errors
2. **Verify Leaflet CSS** is loaded (should be automatic)
3. **Check database** is running
4. **Verify API** is accessible at http://localhost:8001/api/counties/

### Markers in wrong locations?

1. **Check GeoJSON files** are in `frontend/public/`
2. **Validate GeoJSON** at http://geojson.io/
3. **Check property names** match what the code expects

### Map tiles not loading?

1. **Check internet connection** (tiles load from OpenStreetMap)
2. **Try different tile provider** (see customization above)
3. **Check browser console** for CORS errors

### Database connection errors?

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection settings in backend/config.py
# Default: localhost:5433
```

## 📈 Performance Tips

### Large GeoJSON Files

If GeoJSON files are too large (>5MB):

1. **Install mapshaper:**
   ```bash
   npm install -g mapshaper
   ```

2. **Simplify geometries:**
   ```bash
   mapshaper kenya-wards.geojson -simplify 10% -o kenya-wards-simple.geojson
   ```

3. **Remove unnecessary properties:**
   ```bash
   mapshaper kenya-wards.geojson -filter-fields name,code -o kenya-wards-clean.geojson
   ```

### Lazy Loading

The map is already lazy-loaded using Next.js dynamic imports:

```tsx
const LeafletInteractiveMap = dynamic(
  () => import('./LeafletInteractiveMap'),
  { ssr: false }  // Prevents server-side rendering
);
```

## 🔗 Useful Links

- **Leaflet Documentation:** https://leafletjs.com/
- **React-Leaflet:** https://react-leaflet.js.org/
- **GADM Data:** https://gadm.org/
- **Kenya Open Data:** https://kenya.opendataforafrica.org/
- **GeoJSON Validator:** http://geojson.io/
- **Mapshaper (simplify):** https://mapshaper.org/

## 📝 Next Steps

1. ✅ **Database Setup** - Get PostgreSQL running
2. ⏳ **Download GeoJSON** - Run `./scripts/download_geojson.sh`
3. ⏳ **Test the map** - Visit http://localhost:3000/explorer
4. ⏳ **Add polling station coordinates** - Update database with lat/lng

## 🎯 Summary

**What you have now:**
- ✅ Professional Leaflet-based map
- ✅ Pan, zoom, and tile support
- ✅ County boundaries from GeoJSON
- ✅ Automatic centroid calculation
- ✅ Fallback for missing data

**What you need to add:**
- ⏳ Constituencies GeoJSON file
- ⏳ Wards GeoJSON file
- ⏳ Polling station coordinates in database

**The map will work immediately** with approximate locations, and will automatically improve as you add GeoJSON files!

