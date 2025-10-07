# GeoJSON Files for Kenya Administrative Boundaries

This directory contains GeoJSON files for displaying Kenya's administrative boundaries on interactive maps.

## Current Status

### ✅ Available
- **kenya-counties.geojson** - All 47 counties with boundary polygons

### ❌ Needed
- **kenya-constituencies.geojson** - 290 constituencies (not yet available)
- **kenya-wards.geojson** - 1,450+ wards (not yet available)

## How to Add GeoJSON Files

### Option 1: Download from Official Sources (Recommended)

**Kenya Open Data Portal:**
- Visit: https://kenya.opendataforafrica.org/
- Search for "administrative boundaries"
- Download shapefiles and convert to GeoJSON

**IEBC (Independent Electoral and Boundaries Commission):**
- Visit: https://www.iebc.or.ke/
- Look for constituency and ward boundary data

**Humanitarian Data Exchange:**
- Visit: https://data.humdata.org/dataset/kenya-administrative-boundaries
- Download Kenya administrative boundaries

### Option 2: Convert Shapefiles to GeoJSON

If you have shapefiles (.shp), convert them using:

**Using GDAL/OGR:**
```bash
ogr2ogr -f GeoJSON kenya-constituencies.geojson constituencies.shp
```

**Using QGIS:**
1. Open shapefile in QGIS
2. Right-click layer → Export → Save Features As
3. Format: GeoJSON
4. Save to `frontend/public/`

**Using online tools:**
- https://mapshaper.org/ (drag & drop shapefile, export as GeoJSON)
- https://mygeodata.cloud/converter/shp-to-geojson

### Option 3: Use Geocoding API (For Centroids Only)

If you only need center points (not boundaries), you can use a geocoding service:

```javascript
// Example: Get coordinates for a constituency
const getCoordinates = async (name) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${name},Kenya&format=json`
  );
  const data = await response.json();
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon)
  };
};
```

## GeoJSON File Format

Your GeoJSON files should follow this structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Westlands",
        "code": "001",
        "county": "Nairobi",
        "registered_voters": 150000
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [36.8000, -1.2500],
            [36.8100, -1.2500],
            [36.8100, -1.2600],
            [36.8000, -1.2600],
            [36.8000, -1.2500]
          ]
        ]
      }
    }
  ]
}
```

### Important Property Names

The code looks for these property names (case-insensitive):

**For Counties:**
- `name` or `COUNTY_NAM` - County name
- `code` or `COUNTY_CODE` - County code

**For Constituencies:**
- `name` or `CONSTITUEN` - Constituency name
- `code` or `CONST_CODE` - Constituency code
- `county` or `COUNTY_NAM` - Parent county name

**For Wards:**
- `name` or `WARD_NAME` - Ward name
- `code` or `WARD_CODE` - Ward code
- `constituency` or `CONSTITUEN` - Parent constituency name

## File Placement

Place your GeoJSON files in the `frontend/public/` directory:

```
frontend/public/
├── kenya-counties.geojson          ✅ (already exists)
├── kenya-constituencies.geojson    ❌ (add this)
└── kenya-wards.geojson            ❌ (add this)
```

## Testing Your GeoJSON

After adding a GeoJSON file:

1. **Validate the JSON:**
   ```bash
   cat kenya-constituencies.geojson | jq .
   ```

2. **Check file size:**
   - Counties: ~500KB - 2MB
   - Constituencies: ~2MB - 5MB
   - Wards: ~5MB - 15MB

3. **Preview online:**
   - Upload to http://geojson.io/ to visualize

4. **Test in the app:**
   - Start the dev server
   - Navigate to `/explorer`
   - The map should automatically load the GeoJSON

## Fallback Behavior

If GeoJSON files are not available:
- **Counties**: Uses centroids calculated from existing kenya-counties.geojson
- **Constituencies**: Shows markers at approximate locations (needs GeoJSON for accuracy)
- **Wards**: Shows markers at approximate locations (needs GeoJSON for accuracy)
- **Polling Stations**: Uses lat/lng from database (if available)

## Data Sources

### Recommended Sources:

1. **Kenya Open Data**
   - https://kenya.opendataforafrica.org/

2. **IEBC Official Data**
   - https://www.iebc.or.ke/

3. **Humanitarian Data Exchange**
   - https://data.humdata.org/dataset/kenya-administrative-boundaries

4. **OpenStreetMap**
   - https://www.openstreetmap.org/
   - Use Overpass API to extract boundaries

5. **GADM (Global Administrative Areas)**
   - https://gadm.org/download_country.html
   - Select Kenya, download as GeoJSON

## Performance Optimization

For large GeoJSON files:

1. **Simplify geometries:**
   ```bash
   mapshaper kenya-wards.geojson -simplify 10% -o kenya-wards-simplified.geojson
   ```

2. **Remove unnecessary properties:**
   ```bash
   mapshaper kenya-wards.geojson -filter-fields name,code -o kenya-wards-clean.geojson
   ```

3. **Use TopoJSON** (smaller file size):
   ```bash
   geo2topo kenya-wards.geojson > kenya-wards.topojson
   ```

## Need Help?

If you're having trouble finding or converting GeoJSON data:

1. Check the IEBC website for official boundary data
2. Contact Kenya's National Bureau of Statistics
3. Use OpenStreetMap data as a fallback
4. Consider using centroids only (simpler but less accurate)

## Current Map Behavior

**Without GeoJSON files:**
- Constituencies and wards will show as markers at approximate locations
- No boundary polygons will be displayed
- Map will still be functional but less accurate

**With GeoJSON files:**
- Accurate boundary polygons displayed
- Precise centroid calculations
- Better visual representation
- Click on boundaries to select regions

