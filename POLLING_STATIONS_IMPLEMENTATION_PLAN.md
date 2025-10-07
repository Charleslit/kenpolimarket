# Polling Stations & Voter Data Implementation Plan

**Date:** October 7, 2025  
**Goal:** Add polling stations as final drill-down level + show voter data at each level

---

## Overview

Enhance the explorer to:
1. **Drill down to polling stations** (46,093 stations from IEBC data)
2. **Show voter registration data** at each level:
   - County level: "Nairobi County has 4,397,073 voters"
   - Constituency level: "Westlands has 172,088 voters"
   - Ward level: "Kitisuru has 15,234 voters"
   - Polling Station level: "Kitisuru Primary School has 678 voters"

---

## Phase 1: Database Schema

### 1.1 Add PollingStation Model

```python
class PollingStation(Base):
    """Polling station model"""
    __tablename__ = "polling_stations"
    
    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey('wards.id', ondelete='CASCADE'))
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    registration_center_code = Column(String(50))
    registration_center_name = Column(String(200))
    registered_voters_2022 = Column(Integer, default=0)
    geometry = Column(Geometry('POINT', srid=4326))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ward = relationship("Ward", back_populates="polling_stations")
```

### 1.2 Update Ward Model

Add relationship:
```python
polling_stations = relationship("PollingStation", back_populates="ward", cascade="all, delete-orphan")
```

### 1.3 Add registered_voters to Ward

```python
registered_voters_2022 = Column(Integer)
```

---

## Phase 2: Data Import

### 2.1 Update import_iebc_data.py

Add polling station import:
```python
def import_polling_stations(db, parsed_data, ward_map):
    """Import polling stations from IEBC data"""
    stations = {}
    
    for row in parsed_data:
        ps_code = row['ps_code']
        if ps_code not in stations:
            stations[ps_code] = {
                'code': ps_code,
                'name': row['ps_name'],
                'reg_center_code': row['reg_center_code'],
                'reg_center_name': row['reg_center_name'],
                'ward_code': f"{row['const_code']}-{row['ward_code']}"[:20],
                'registered_voters': row['registered_voters']
            }
    
    # Import to database
    for ps_data in stations.values():
        ward_id = ward_map.get(ps_data['ward_code'])
        if ward_id:
            db.execute("""
                INSERT INTO polling_stations 
                (code, name, registration_center_code, registration_center_name, 
                 ward_id, registered_voters_2022, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    registered_voters_2022 = EXCLUDED.registered_voters_2022
            """, (ps_data['code'], ps_data['name'], ...))
```

### 2.2 Calculate Aggregated Voter Counts

```python
# Update ward voter counts
UPDATE wards w
SET registered_voters_2022 = (
    SELECT SUM(registered_voters_2022)
    FROM polling_stations ps
    WHERE ps.ward_id = w.id
);

# Update constituency voter counts
UPDATE constituencies c
SET registered_voters_2022 = (
    SELECT SUM(w.registered_voters_2022)
    FROM wards w
    WHERE w.constituency_id = c.id
);

# Update county voter counts
UPDATE counties co
SET registered_voters_2022 = (
    SELECT SUM(c.registered_voters_2022)
    FROM constituencies c
    WHERE c.county_id = co.id
);
```

---

## Phase 3: Backend API

### 3.1 Add Polling Stations Router

**File:** `backend/routers/polling_stations.py`

```python
@router.get("/", response_model=List[PollingStationResponse])
async def get_polling_stations(
    ward_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get polling stations, optionally filtered by ward"""
    query = db.query(PollingStation)
    if ward_id:
        query = query.filter(PollingStation.ward_id == ward_id)
    return query.offset(skip).limit(limit).all()

@router.get("/{id}", response_model=PollingStationResponse)
async def get_polling_station(id: int, db: Session = Depends(get_db)):
    """Get a specific polling station"""
    station = db.query(PollingStation).filter(PollingStation.id == id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Polling station not found")
    return station
```

### 3.2 Update Existing Routers to Include Voter Data

**Counties Router:**
```python
@router.get("/{id}", response_model=CountyResponse)
async def get_county(id: int, db: Session = Depends(get_db)):
    county = db.query(County).filter(County.id == id).first()
    if not county:
        raise HTTPException(status_code=404, detail="County not found")
    
    # Include voter count
    response = CountyResponse.from_orm(county)
    response.registered_voters_2022 = county.registered_voters_2022
    return response
```

Similar updates for constituencies and wards.

---

## Phase 4: Frontend Updates

### 4.1 Update CountyExplorerEnhanced Component

Add voter data display:

```typescript
interface LocationData {
  id: number;
  name: string;
  code?: string;
  registered_voters_2022?: number;
  // ... other fields
}

// Display component
<div className="voter-stats">
  <div className="stat-item">
    <span className="stat-label">Registered Voters (2022):</span>
    <span className="stat-value">
      {currentLocation.registered_voters_2022?.toLocaleString() || 'N/A'}
    </span>
  </div>
</div>
```

### 4.2 Add Polling Station Level

```typescript
const [currentLevel, setCurrentLevel] = useState<'national' | 'county' | 'constituency' | 'ward' | 'polling_station'>('national');

// Add polling station fetch
const fetchPollingStations = async (wardId: number) => {
  const response = await fetch(`${API_URL}/polling_stations/?ward_id=${wardId}`);
  const data = await response.json();
  setPollingStations(data);
};

// Add to drill-down logic
const handleLocationClick = async (location: LocationData) => {
  if (currentLevel === 'ward') {
    // Drill down to polling stations
    await fetchPollingStations(location.id);
    setCurrentLevel('polling_station');
    setSelectedWard(location);
  }
  // ... existing logic
};
```

### 4.3 Update Map Markers

```typescript
// Add polling station markers
{currentLevel === 'polling_station' && pollingStations.map(station => (
  <Marker
    key={station.id}
    position={[station.latitude, station.longitude]}
    icon={pollingStationIcon}
  >
    <Popup>
      <div>
        <h4>{station.name}</h4>
        <p>Code: {station.code}</p>
        <p>Voters: {station.registered_voters_2022?.toLocaleString()}</p>
      </div>
    </Popup>
  </Marker>
))}
```

---

## Phase 5: Data Visualization

### 5.1 Add Breadcrumb with Voter Counts

```typescript
<div className="breadcrumb-with-stats">
  <div className="breadcrumb">
    <span onClick={() => navigateToLevel('national')}>Kenya</span>
    {selectedCounty && (
      <>
        <span> → </span>
        <span onClick={() => navigateToLevel('county')}>
          {selectedCounty.name}
          <span className="voter-count">
            ({selectedCounty.registered_voters_2022?.toLocaleString()} voters)
          </span>
        </span>
      </>
    )}
    {selectedConstituency && (
      <>
        <span> → </span>
        <span onClick={() => navigateToLevel('constituency')}>
          {selectedConstituency.name}
          <span className="voter-count">
            ({selectedConstituency.registered_voters_2022?.toLocaleString()} voters)
          </span>
        </span>
      </>
    )}
    {/* ... similar for ward and polling station */}
  </div>
</div>
```

### 5.2 Add Summary Stats Panel

```typescript
<div className="summary-stats">
  <div className="stat-card">
    <h3>Current Level</h3>
    <p className="level-name">{getCurrentLevelName()}</p>
  </div>
  
  <div className="stat-card">
    <h3>Registered Voters</h3>
    <p className="voter-count">
      {currentLocation.registered_voters_2022?.toLocaleString() || 'N/A'}
    </p>
  </div>
  
  <div className="stat-card">
    <h3>Sub-divisions</h3>
    <p className="subdivision-count">
      {getSubdivisionCount()}
    </p>
  </div>
</div>
```

---

## Implementation Steps

### Step 1: Database (Local)
1. ✅ Add PollingStation model to `backend/models.py`
2. ✅ Update Ward model with relationship
3. ✅ Add registered_voters_2022 to Ward model
4. ✅ Create migration script
5. ✅ Run migration on local database

### Step 2: Data Import (Local)
1. ✅ Update `scripts/import_iebc_data.py` to import polling stations
2. ✅ Add voter count aggregation queries
3. ✅ Run import script
4. ✅ Verify data: 46,093 polling stations

### Step 3: Backend API (Local)
1. ✅ Create `backend/routers/polling_stations.py`
2. ✅ Add PollingStation schema to `backend/schemas.py`
3. ✅ Update existing routers to include voter counts
4. ✅ Test API endpoints

### Step 4: Frontend (Local)
1. ✅ Update `CountyExplorerEnhanced.tsx` with polling station level
2. ✅ Add voter data display components
3. ✅ Update map markers for polling stations
4. ✅ Add breadcrumb with voter counts
5. ✅ Test drill-down functionality

### Step 5: Production Deployment
1. ✅ Run migration on production database
2. ✅ Import polling stations to production
3. ✅ Deploy backend changes
4. ✅ Deploy frontend changes
5. ✅ Verify production functionality

---

## Expected Results

### Data Hierarchy:

```
Kenya (National)
├── Nairobi County (4,397,073 voters)
│   ├── Westlands Constituency (172,088 voters)
│   │   ├── Kitisuru Ward (15,234 voters)
│   │   │   ├── Kitisuru Primary School (678 voters)
│   │   │   ├── Runda Academy (542 voters)
│   │   │   └── ... more polling stations
│   │   ├── Parklands/Highridge Ward (18,456 voters)
│   │   └── ... more wards
│   ├── Dagoretti North Constituency (145,234 voters)
│   └── ... more constituencies
├── Mombasa County (...)
└── ... more counties
```

### User Experience:

1. **Click on Nairobi** → See "Nairobi County: 4,397,073 voters"
2. **Click on Westlands** → See "Westlands Constituency: 172,088 voters"
3. **Click on Kitisuru Ward** → See "Kitisuru Ward: 15,234 voters"
4. **Click on polling station** → See "Kitisuru Primary School: 678 voters"

---

## Timeline

- **Phase 1-2 (Database & Import):** 1-2 hours
- **Phase 3 (Backend API):** 1 hour
- **Phase 4 (Frontend):** 2-3 hours
- **Phase 5 (Production):** 1 hour

**Total:** ~6-8 hours of development time

---

**Ready to implement?** Let's start with Phase 1!

