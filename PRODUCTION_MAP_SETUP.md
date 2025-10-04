# 🗺️ Production Map Setup Guide

This guide will help you implement a real interactive county map with actual GeoJSON boundaries for Kenya's 47 counties.

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Option 1: Leaflet (Recommended)](#option-1-leaflet-recommended)
3. [Option 2: Mapbox GL JS](#option-2-mapbox-gl-js)
4. [Option 3: D3.js with GeoJSON](#option-3-d3js-with-geojson)
5. [Getting GeoJSON Data](#getting-geojson-data)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd frontend
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

### Step 2: Download Kenya GeoJSON Data

Run the provided script:

```bash
chmod +x scripts/download_kenya_geojson.sh
./scripts/download_kenya_geojson.sh
```

Or download manually from one of these sources:
- **Humanitarian Data Exchange (HDX)**: https://data.humdata.org/dataset/cod-ab-ken
- **GitHub (mikelmaron)**: https://raw.githubusercontent.com/mikelmaron/kenya-election-data/master/data/counties.geojson
- **IEBC Official**: Contact IEBC for official boundaries

### Step 3: Place GeoJSON File

Move the downloaded file to:
```
frontend/public/kenya-counties.geojson
```

### Step 4: Update Your Page

Replace the `CountyMap` component with `LeafletCountyMap`:

```tsx
// In frontend/app/forecasts/page.tsx
import LeafletCountyMap from '@/components/maps/LeafletCountyMap';

// Replace this:
<CountyMap
  counties={filteredCounties}
  selectedCounty={selectedCounty}
  onCountyClick={handleCountyClick}
  electionResults={electionResults}
/>

// With this:
<LeafletCountyMap
  counties={filteredCounties}
  selectedCounty={selectedCounty}
  onCountyClick={handleCountyClick}
  electionResults={electionResults}
/>
```

### Step 5: Add Leaflet CSS

In `frontend/app/layout.tsx`, add:

```tsx
import 'leaflet/dist/leaflet.css';
```

---

## 🗺️ Option 1: Leaflet (Recommended)

**Pros:**
- ✅ Easy to implement
- ✅ Great documentation
- ✅ Works well with React
- ✅ Free and open source
- ✅ Good performance

**Cons:**
- ❌ Larger bundle size (~150KB)
- ❌ Requires CSS import

### Implementation

I've already created `LeafletCountyMap.tsx` for you. It includes:
- Interactive county boundaries
- Click to select counties
- Hover tooltips with county info
- Color-coded by voter turnout
- Responsive design
- Legend

### Customization

You can customize colors, zoom levels, and more in the component:

```tsx
// Change base map style
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  // Try these alternatives:
  // Satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  // Dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  // Light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
/>
```

---

## 🌍 Option 2: Mapbox GL JS

**Pros:**
- ✅ Beautiful, modern design
- ✅ Excellent performance
- ✅ 3D capabilities
- ✅ Vector tiles

**Cons:**
- ❌ Requires API key (free tier: 50,000 loads/month)
- ❌ More complex setup

### Setup

```bash
npm install mapbox-gl react-map-gl
npm install -D @types/mapbox-gl
```

### Get API Key

1. Sign up at https://www.mapbox.com/
2. Get your access token
3. Add to `.env.local`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

### Example Component

```tsx
'use client';

import { useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function MapboxCountyMap() {
  const [viewState, setViewState] = useState({
    longitude: 37.9062,
    latitude: 0.0236,
    zoom: 6
  });

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: '100%', height: '500px' }}
    >
      <Source
        id="counties"
        type="geojson"
        data="/kenya-counties.geojson"
      >
        <Layer
          id="county-fills"
          type="fill"
          paint={{
            'fill-color': '#3b82f6',
            'fill-opacity': 0.5
          }}
        />
        <Layer
          id="county-borders"
          type="line"
          paint={{
            'line-color': '#1d4ed8',
            'line-width': 2
          }}
        />
      </Source>
    </Map>
  );
}
```

---

## 📊 Option 3: D3.js with GeoJSON

**Pros:**
- ✅ Full control over rendering
- ✅ Already using D3 in your project
- ✅ No additional dependencies
- ✅ Smaller bundle size

**Cons:**
- ❌ More code to write
- ❌ No built-in pan/zoom
- ❌ Requires more D3 knowledge

### Implementation

I can create a D3-based component that uses real GeoJSON. Let me know if you prefer this approach!

---

## 📥 Getting GeoJSON Data

### Official Sources

1. **Humanitarian Data Exchange (HDX)** - Most reliable
   - URL: https://data.humdata.org/dataset/cod-ab-ken
   - Format: Shapefile + GeoJSON
   - Admin levels: 0 (country), 1 (county), 2 (sub-county)

2. **IEBC (Independent Electoral and Boundaries Commission)**
   - Official electoral boundaries
   - May require formal request
   - Most accurate for elections

3. **Kenya National Bureau of Statistics (KNBS)**
   - Census boundaries
   - Matches population data

### Community Sources

1. **GitHub - mikelmaron/kenya-election-data**
   ```bash
   wget https://raw.githubusercontent.com/mikelmaron/kenya-election-data/master/data/counties.geojson
   ```

2. **geoBoundaries**
   - URL: https://www.geoboundaries.org/
   - Search for "Kenya"
   - Download ADM1 (county level)

### Converting Shapefiles to GeoJSON

If you download Shapefiles, convert them:

```bash
# Install GDAL
sudo apt-get install gdal-bin  # Ubuntu/Debian
brew install gdal              # macOS

# Convert
ogr2ogr -f GeoJSON -t_srs EPSG:4326 kenya-counties.geojson kenya-counties.shp
```

### Simplifying GeoJSON (Optional)

Large GeoJSON files can slow down your app. Simplify them:

```bash
# Install mapshaper
npm install -g mapshaper

# Simplify (keep 10% of points)
mapshaper kenya-counties.geojson -simplify 10% -o kenya-counties-simplified.geojson
```

---

## 🔧 Troubleshooting

### Issue: "Failed to load GeoJSON"

**Solution:**
1. Check file exists: `ls frontend/public/kenya-counties.geojson`
2. Verify it's valid JSON: `cat frontend/public/kenya-counties.geojson | jq .`
3. Check browser console for CORS errors

### Issue: "Counties not matching"

**Solution:**
The GeoJSON property names might differ. Check your GeoJSON:

```javascript
// Open browser console and run:
fetch('/kenya-counties.geojson')
  .then(r => r.json())
  .then(data => {
    console.log('First feature properties:', data.features[0].properties);
  });
```

Then update the component to match property names:

```tsx
// In LeafletCountyMap.tsx, update this line:
const countyName = feature.properties.COUNTY_NAM || 
                   feature.properties.name || 
                   feature.properties.NAME ||
                   feature.properties.County;
```

### Issue: "Map not displaying"

**Solution:**
1. Make sure Leaflet CSS is imported
2. Check for console errors
3. Verify container has height: `style={{ height: '500px' }}`

### Issue: "Performance is slow"

**Solutions:**
1. Simplify GeoJSON (see above)
2. Use vector tiles instead
3. Implement clustering for many features
4. Use Mapbox GL JS for better performance

---

## 🎨 Customization Examples

### Change Color Scheme

```tsx
const getTurnoutColor = (turnout: number): string => {
  // Green to red gradient
  if (turnout >= 80) return '#10b981';
  if (turnout >= 70) return '#84cc16';
  if (turnout >= 60) return '#eab308';
  if (turnout >= 50) return '#f97316';
  return '#ef4444';
};
```

### Add County Labels

```tsx
import { Marker, Popup } from 'react-leaflet';

// Calculate county centroids and add markers
{counties.map(county => (
  <Marker
    key={county.code}
    position={[county.lat, county.lng]}
  >
    <Popup>{county.name}</Popup>
  </Marker>
))}
```

### Add Search/Filter

```tsx
const [searchTerm, setSearchTerm] = useState('');

// Filter GeoJSON features
const filteredGeoJson = {
  ...geoJsonData,
  features: geoJsonData.features.filter(f =>
    f.properties.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
};
```

---

## 📚 Additional Resources

- **Leaflet Docs**: https://leafletjs.com/
- **React Leaflet**: https://react-leaflet.js.org/
- **Mapbox GL JS**: https://docs.mapbox.com/mapbox-gl-js/
- **D3 Geo**: https://d3js.org/d3-geo
- **GeoJSON Spec**: https://geojson.org/

---

## ✅ Next Steps

1. ✅ Install dependencies
2. ✅ Download GeoJSON data
3. ✅ Place in `/public` folder
4. ✅ Update your page to use `LeafletCountyMap`
5. ✅ Test in browser
6. ✅ Customize colors/styles as needed
7. ✅ Deploy to production

---

**Need help?** Check the component code in `frontend/components/maps/LeafletCountyMap.tsx` for implementation details.

