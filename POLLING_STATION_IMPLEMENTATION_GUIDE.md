# 🗳️ Polling Station Data - Implementation Guide

## Executive Summary

**Data Source**: IEBC 2022 General Election - Registered Voters Per Polling Station  
**Total Records**: 52,934 polling stations across Kenya  
**Database Impact**: +2 new tables, +52,934 records  
**Value**: Enables granular voter registration analysis down to polling station level

---

## ✅ What We're Adding

### New Database Tables:

1. **`registration_centers`** (~10,000 records)
   - Schools, churches, community centers where voters register
   - Multiple polling stations per center
   - Linked to wards, constituencies, counties

2. **`polling_stations`** (52,934 records)
   - Individual voting stations
   - Registered voter counts for 2022 (and 2017 if available)
   - Unique 15-digit IEBC codes
   - Linked to registration centers and geographic hierarchy

### Data Hierarchy:
```
County (47)
  └─ Constituency (290)
      └─ Ward (1,450)
          └─ Registration Center (~10,000)
              └─ Polling Station (52,934)
```

---

## 📋 Implementation Steps

### Step 1: Apply Database Migration

**Local Database:**
```bash
cd /home/charles/Documents/augment-projects/kenpolimarket

# Apply migration
psql "postgresql://kenpolimarket:password@localhost:5433/kenpolimarket" \
  -f database/migrations/002_add_polling_stations.sql
```

**Render Database:**
```bash
# Apply migration to Render
psql "postgresql://kenpolimarket:bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" \
  -f database/migrations/002_add_polling_stations.sql
```

### Step 2: Import CSV Data

**Local:**
```bash
python3 scripts/import_polling_stations.py \
  --database-url "postgresql://kenpolimarket:password@localhost:5433/kenpolimarket" \
  --csv-file "data/rov_per_polling_station.csv"
```

**Render:**
```bash
python3 scripts/import_polling_stations.py \
  --database-url "postgresql://kenpolimarket:bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" \
  --csv-file "data/rov_per_polling_station.csv"
```

### Step 3: Verify Import

```sql
-- Check counts
SELECT COUNT(*) FROM registration_centers;  -- Should be ~10,000
SELECT COUNT(*) FROM polling_stations;      -- Should be 52,934

-- Check totals
SELECT SUM(registered_voters_2022) FROM polling_stations;  -- Should be ~22 million

-- Sample data
SELECT * FROM polling_stations_full LIMIT 10;

-- Check hierarchy
SELECT 
    co.name AS county,
    COUNT(DISTINCT c.id) AS constituencies,
    COUNT(DISTINCT w.id) AS wards,
    COUNT(DISTINCT rc.id) AS reg_centers,
    COUNT(ps.id) AS polling_stations,
    SUM(ps.registered_voters_2022) AS total_voters
FROM counties co
LEFT JOIN constituencies c ON c.county_id = co.id
LEFT JOIN wards w ON w.constituency_id = c.id
LEFT JOIN registration_centers rc ON rc.ward_id = w.id
LEFT JOIN polling_stations ps ON ps.registration_center_id = rc.id
GROUP BY co.name
ORDER BY total_voters DESC
LIMIT 10;
```

---

## 🔌 Backend API Endpoints to Add

Create these new endpoints in `backend/routers/`:

### File: `backend/routers/registration_centers.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

router = APIRouter(prefix="/api/registration-centers", tags=["registration-centers"])

@router.get("/")
async def list_registration_centers(
    county_id: Optional[int] = None,
    constituency_id: Optional[int] = None,
    ward_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
):
    """List registration centers with optional filtering"""
    pass

@router.get("/{id}")
async def get_registration_center(id: int):
    """Get a specific registration center with statistics"""
    pass

@router.get("/{id}/polling-stations")
async def get_registration_center_stations(id: int):
    """Get all polling stations in a registration center"""
    pass
```

### File: `backend/routers/polling_stations.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

router = APIRouter(prefix="/api/polling-stations", tags=["polling-stations"])

@router.get("/")
async def list_polling_stations(
    county_id: Optional[int] = None,
    constituency_id: Optional[int] = None,
    ward_id: Optional[int] = None,
    registration_center_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
):
    """List polling stations with optional filtering"""
    pass

@router.get("/{id}")
async def get_polling_station(id: int):
    """Get a specific polling station"""
    pass

@router.get("/stats")
async def get_polling_station_stats():
    """Get aggregated statistics"""
    pass

@router.get("/search")
async def search_polling_stations(q: str):
    """Search polling stations by name or code"""
    pass
```

---

## 🎨 Frontend Visualizations

### 1. Enhanced County Explorer

**Location**: `frontend/components/explorer/CountyExplorerEnhanced.tsx`

**Add drill-down levels**:
```
County → Constituency → Ward → Registration Center → Polling Station
```

**Features**:
- Click on ward to see registration centers
- Click on registration center to see polling stations
- Show voter counts at each level
- Breadcrumb navigation

### 2. Polling Station Map

**New Component**: `frontend/components/maps/PollingStationMap.tsx`

**Features**:
- Interactive map showing all 52,934 polling stations
- Color-coded by registered voters
- Cluster markers for performance
- Click to see station details
- Filter by county/constituency/ward

### 3. Voter Registration Dashboard

**New Page**: `frontend/app/voter-registration/page.tsx`

**Widgets**:
- Total registered voters (22M+)
- Voters by county (bar chart)
- Average voters per station (histogram)
- Registration center statistics
- Top 10 largest/smallest stations

### 4. Turnout Analysis

**New Component**: `frontend/components/analysis/TurnoutAnalysis.tsx`

**Features**:
- Compare registered voters vs. actual turnout
- Identify high/low turnout stations
- Historical comparison (2017 vs 2022)
- Anomaly detection

---

## 📊 Sample Queries

### Find largest polling stations:
```sql
SELECT 
    ps.name,
    ps.code,
    ps.registered_voters_2022,
    co.name AS county,
    c.name AS constituency
FROM polling_stations ps
JOIN counties co ON ps.county_id = co.id
JOIN constituencies c ON ps.constituency_id = c.id
ORDER BY ps.registered_voters_2022 DESC
LIMIT 10;
```

### Find registration centers with most stations:
```sql
SELECT 
    rc.name,
    rc.total_polling_stations,
    rc.total_registered_voters,
    w.name AS ward,
    co.name AS county
FROM registration_centers rc
JOIN wards w ON rc.ward_id = w.id
JOIN counties co ON rc.county_id = co.id
ORDER BY rc.total_polling_stations DESC
LIMIT 10;
```

### County-level summary:
```sql
SELECT 
    co.name AS county,
    COUNT(DISTINCT rc.id) AS reg_centers,
    COUNT(ps.id) AS polling_stations,
    SUM(ps.registered_voters_2022) AS total_voters,
    AVG(ps.registered_voters_2022)::INT AS avg_per_station
FROM counties co
LEFT JOIN registration_centers rc ON rc.county_id = co.id
LEFT JOIN polling_stations ps ON ps.registration_center_id = rc.id
GROUP BY co.name
ORDER BY total_voters DESC;
```

---

## 🚀 Next Steps

1. ✅ **Review this implementation plan**
2. ⏳ **Apply database migration** (local + Render)
3. ⏳ **Run import script** (local + Render)
4. ⏳ **Verify data integrity**
5. ⏳ **Create backend API endpoints**
6. ⏳ **Build frontend visualizations**
7. ⏳ **Test and deploy**

---

## 📈 Expected Benefits

### For Users:
- **Granular analysis**: Down to individual polling stations
- **Turnout insights**: Identify high/low participation areas
- **Historical comparison**: 2017 vs 2022 trends
- **Geographic visualization**: Interactive maps

### For Platform:
- **Unique feature**: Most platforms only show county-level data
- **Data depth**: 52,934 data points vs. 47 (counties)
- **Competitive advantage**: Unmatched granularity
- **Analyst appeal**: Professional-grade data

---

## ⚠️ Important Notes

1. **Data Size**: ~52,934 records will add ~26MB to database
2. **Performance**: Indexes are critical for fast queries
3. **Pagination**: Always paginate large result sets
4. **Caching**: Cache aggregated statistics
5. **Privacy**: This is public IEBC data (no PII concerns)

---

## 🎯 Success Criteria

- ✅ All 52,934 polling stations imported
- ✅ Total registered voters matches IEBC official count (~22M)
- ✅ All geographic relationships correct
- ✅ API endpoints respond in < 500ms
- ✅ Frontend visualizations load smoothly
- ✅ Drill-down navigation works seamlessly

---

**Ready to proceed with implementation!** 🚀


