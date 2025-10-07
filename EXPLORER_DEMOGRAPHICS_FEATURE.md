# 📊 Explorer Demographics Feature - Implementation Guide

## Overview

This feature adds comprehensive voter demographics (gender and disability statistics) to the KenPoliMarket explorer drill-down functionality, with proper map coordinate locking at each administrative level.

---

## ✅ What's Been Built

### 1. **Database Schema** 📊

**File**: `database/migrations/005_add_voter_demographics.sql`

**New Tables**:
- `county_voter_demographics` - County-level voter statistics
- `constituency_voter_demographics` - Constituency-level voter statistics
- `ward_voter_demographics` - Ward-level voter statistics
- `polling_station_voter_demographics` - Polling station-level voter statistics

**Fields for Each Level**:
- `total_registered_voters` - Total registered voters
- `male_voters` - Number of male voters
- `female_voters` - Number of female voters
- `pwd_voters` - Persons with Disabilities (PWD) voters
- `election_year` - Election year (2013-2030)
- `data_source` - Source of the data
- `verified` - Data verification status

**Smart Features**:
- ✅ Automatic percentage calculations via views
- ✅ Data validation constraints (gender sum ≤ total)
- ✅ Performance indexes on all foreign keys
- ✅ Helpful summary views with full hierarchy

---

### 2. **Sample Data Population** 🗂️

**File**: `database/scripts/populate_nairobi_demographics.sql`

**Features**:
- Generates realistic voter demographics for Nairobi County
- Populates all levels: County → Constituencies → Wards → Polling Stations
- Uses realistic distributions:
  - Male: 48-52% of voters
  - Female: 48-52% of voters
  - PWD: 2-3% of voters
- Includes verification queries to check data integrity

**To Run**:
```bash
# First, run the migration
psql -U your_user -d kenpolimarket -f database/migrations/005_add_voter_demographics.sql

# Then populate Nairobi data
psql -U your_user -d kenpolimarket -f database/scripts/populate_nairobi_demographics.sql
```

---

### 3. **Backend API** 🔌

**File**: `backend/routers/voter_demographics.py`

**New Endpoints**:

#### County Level
```
GET /api/voter-demographics/counties/{county_id}?year=2022
```
Returns voter demographics for a specific county.

#### Constituency Level
```
GET /api/voter-demographics/constituencies/{constituency_id}?year=2022
GET /api/voter-demographics/constituencies/by-county/{county_id}?year=2022
```
Returns demographics for a constituency or all constituencies in a county.

#### Ward Level
```
GET /api/voter-demographics/wards/{ward_id}?year=2022
GET /api/voter-demographics/wards/by-constituency/{constituency_id}?year=2022
```
Returns demographics for a ward or all wards in a constituency.

#### Polling Station Level
```
GET /api/voter-demographics/polling-stations/{polling_station_id}?year=2022
```
Returns demographics for a specific polling station.

**Response Format**:
```json
{
  "level": "county",
  "id": 47,
  "name": "Nairobi",
  "code": "047",
  "total_registered_voters": 2397164,
  "male_voters": 1198582,
  "female_voters": 1198582,
  "pwd_voters": 59929,
  "male_percentage": 50.0,
  "female_percentage": 50.0,
  "pwd_percentage": 2.5,
  "election_year": 2022,
  "parent_name": null
}
```

---

### 4. **Frontend Components** 🎨

#### VoterStatisticsPanel Component
**File**: `frontend/components/explorer/VoterStatisticsPanel.tsx`

**Features**:
- 📊 Visual pie charts for gender distribution
- ♿ Disability statistics with percentage breakdown
- 📈 Total voter count with prominent display
- 🎨 Color-coded cards (blue for male, pink for female, violet for PWD)
- 📱 Responsive design
- ⚡ Loading states and empty states

**Usage**:
```tsx
<VoterStatisticsPanel 
  statistics={voterStatistics} 
  loading={statisticsLoading}
/>
```

---

### 5. **Map Coordinate Locking** 🗺️

**File**: `frontend/components/explorer/LeafletInteractiveMap.tsx`

**Enhancements**:
- ✅ Calculates bounds from GeoJSON features
- ✅ Locks map to selected area's actual boundaries
- ✅ Proper zoom levels for each administrative level:
  - National: Zoom 7
  - County: Zoom 10
  - Constituency: Zoom 12
  - Ward: Zoom 14
- ✅ Smooth transitions between levels
- ✅ Fallback to marker-based bounds if GeoJSON unavailable

**How It Works**:
1. When a county/constituency/ward is selected, the component fetches its details
2. Finds the corresponding GeoJSON feature by name matching
3. Calculates the bounding box from the feature's coordinates
4. Fits the map to those bounds with appropriate padding and zoom

---

### 6. **Explorer Integration** 🔗

**File**: `frontend/components/explorer/CountyExplorerEnhanced.tsx`

**New Features**:
- Side-by-side map and statistics panel layout
- Automatic statistics fetching on drill-down
- Statistics update when clicking on any administrative level
- Responsive grid layout (2/3 map, 1/3 statistics on large screens)
- Statistics panel expands to full width when map is hidden

**User Flow**:
1. User clicks on a county → Map zooms to county bounds + Statistics panel shows county demographics
2. User clicks on a constituency → Map zooms to constituency bounds + Statistics update
3. User clicks on a ward → Map zooms to ward bounds + Statistics update
4. User clicks on a polling station → Statistics show polling station demographics

---

## 🚀 Testing the Feature

### 1. Start the Backend
```bash
cd backend
uvicorn main:app --reload --port 8001
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Navigate to Explorer
Open `http://localhost:3000/explorer`

### 4. Test Nairobi Drill-Down
1. Click on **Nairobi County**
   - Map should zoom to Nairobi boundaries
   - Statistics panel should show Nairobi voter demographics
   
2. Click on any **Constituency** (e.g., Westlands, Starehe)
   - Map should zoom to constituency boundaries
   - Statistics should update to show constituency demographics
   
3. Click on any **Ward**
   - Map should zoom to ward boundaries
   - Statistics should update to show ward demographics
   
4. Click on any **Polling Station**
   - Statistics should show polling station demographics

---

## 📊 Sample Queries

### Check Nairobi County Demographics
```sql
SELECT * FROM county_demographics_summary 
WHERE county_name = 'Nairobi' AND election_year = 2022;
```

### Check All Nairobi Constituencies
```sql
SELECT 
    c.name AS constituency,
    cd.total_registered_voters,
    cd.male_voters,
    cd.female_voters,
    cd.pwd_voters,
    cd.male_percentage,
    cd.female_percentage,
    cd.pwd_percentage
FROM constituency_voter_demographics cd
JOIN constituencies c ON cd.constituency_id = c.id
JOIN counties co ON c.county_id = co.id
WHERE co.name = 'Nairobi' AND cd.election_year = 2022
ORDER BY cd.total_registered_voters DESC;
```

### Check Ward Demographics with Full Hierarchy
```sql
SELECT * FROM ward_demographics_full
WHERE county_name = 'Nairobi' AND election_year = 2022
ORDER BY total_registered_voters DESC
LIMIT 10;
```

---

## 🔄 Extending to Other Counties

To add demographics for other counties, you can:

1. **Modify the population script** to target different counties:
```sql
-- Change the WHERE clause in populate_nairobi_demographics.sql
WHERE co.name = 'Mombasa' OR co.code = '001'
```

2. **Or create a generic script** that populates all counties:
```sql
-- Loop through all counties instead of just Nairobi
FOR v_county IN 
    SELECT id, name, registered_voters_2022
    FROM counties
    WHERE registered_voters_2022 IS NOT NULL
LOOP
    -- Generate demographics for each county
END LOOP;
```

---

## 🎯 Next Steps

1. **Add Real Data**: Replace sample data with actual IEBC voter registration data by gender and disability status
2. **Historical Data**: Add demographics for previous election years (2017, 2013)
3. **Trends Analysis**: Create charts showing demographic changes over time
4. **Export Features**: Add ability to export demographics data to CSV/PDF
5. **Comparison Tool**: Allow comparing demographics across different counties/constituencies

---

## 📝 Notes

- **Data Privacy**: All data is aggregated at administrative levels (no individual voter data)
- **Performance**: Indexes ensure fast queries even with large datasets
- **Scalability**: Schema supports all 47 counties, 290 constituencies, 1,450 wards, and 50,000+ polling stations
- **Flexibility**: Easy to add more demographic fields (age groups, education levels, etc.)

---

## 🐛 Troubleshooting

### Statistics Not Loading
- Check that the migration has been run
- Verify sample data has been populated for Nairobi
- Check browser console for API errors
- Verify backend is running on port 8001

### Map Not Zooming Correctly
- Ensure GeoJSON files are present in `/public` directory
- Check that county/constituency/ward names match between database and GeoJSON
- Verify LeafletInteractiveMap is receiving correct IDs

### Database Errors
- Ensure PostgreSQL is running
- Check that all foreign key relationships are intact
- Verify election_year is within valid range (2013-2030)

---

## 📚 Related Files

- Database: `database/migrations/005_add_voter_demographics.sql`
- Sample Data: `database/scripts/populate_nairobi_demographics.sql`
- Backend Models: `backend/models.py` (CountyVoterDemographics, etc.)
- Backend Schemas: `backend/schemas.py` (VoterStatisticsSummary, etc.)
- Backend Router: `backend/routers/voter_demographics.py`
- Frontend Component: `frontend/components/explorer/VoterStatisticsPanel.tsx`
- Map Component: `frontend/components/explorer/LeafletInteractiveMap.tsx`
- Explorer Page: `frontend/components/explorer/CountyExplorerEnhanced.tsx`

---

**Built with ❤️ for KenPoliMarket - Professional Data-Driven Political Analysis**

