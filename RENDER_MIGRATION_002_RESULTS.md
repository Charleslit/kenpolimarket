# ✅ Render Migration 002 - Polling Stations

## Migration Applied Successfully!

**Date**: 2025-10-06  
**Database**: Render PostgreSQL (dpg-d3ginq7fte5s73c6j060-a)  
**Migration**: `002_add_polling_stations.sql`  
**Status**: ✅ SUCCESS

---

## What Was Created

### **Tables** (2/2) ✅

| Table Name | Columns | Status |
|------------|---------|--------|
| `registration_centers` | 11 | ✅ Created |
| `polling_stations` | 12 | ✅ Created |

### **Triggers** (10/10) ✅

| Trigger Name | Table | Purpose |
|--------------|-------|---------|
| `trigger_update_reg_center_totals` | polling_stations | Auto-update registration center totals |
| `trigger_update_ward_voters` | polling_stations | Auto-update ward voter counts |
| `trigger_update_constituency_voters` | wards | Auto-update constituency voter counts |
| `trigger_update_county_voters` | constituencies | Auto-update county voter counts |

**Note**: Multiple trigger events (INSERT, UPDATE, DELETE) create multiple entries.

### **Views** (2/2) ✅

| View Name | Purpose |
|-----------|---------|
| `polling_stations_full` | Full geographic hierarchy for polling stations |
| `registration_centers_stats` | Aggregated statistics for registration centers |

### **Indexes** (9/9) ✅

All foreign key indexes created for optimal query performance:
- `idx_polling_stations_county`
- `idx_polling_stations_constituency`
- `idx_polling_stations_ward`
- `idx_polling_stations_reg_center`
- `idx_polling_stations_code`
- `idx_reg_centers_county`
- `idx_reg_centers_constituency`
- `idx_reg_centers_ward`
- `idx_reg_centers_code`

---

## Database Schema

### **registration_centers** Table

```sql
CREATE TABLE registration_centers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    ward_id INTEGER REFERENCES wards(id),
    constituency_id INTEGER REFERENCES constituencies(id),
    county_id INTEGER REFERENCES counties(id),
    geometry GEOMETRY(Point, 4326),
    total_registered_voters INTEGER DEFAULT 0,
    total_polling_stations INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **polling_stations** Table

```sql
CREATE TABLE polling_stations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    registration_center_id INTEGER REFERENCES registration_centers(id),
    ward_id INTEGER REFERENCES wards(id),
    constituency_id INTEGER REFERENCES constituencies(id),
    county_id INTEGER REFERENCES counties(id),
    registered_voters_2017 INTEGER,
    registered_voters_2022 INTEGER,
    geometry GEOMETRY(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Smart Features

### **Automatic Totals** 🤖

When you insert/update/delete polling stations, the system automatically:

1. **Updates Registration Center**:
   - `total_polling_stations` count
   - `total_registered_voters` sum

2. **Updates Ward**:
   - `total_registered_voters` sum

3. **Updates Constituency**:
   - `total_registered_voters` sum

4. **Updates County**:
   - `total_registered_voters` sum

**Example**:
```sql
-- Insert a polling station
INSERT INTO polling_stations (code, name, county_id, registered_voters_2022)
VALUES ('001001000100101', 'BOMU PRIMARY SCHOOL', 1, 673);

-- The county's total_registered_voters automatically increases by 673!
```

---

## Next Steps

### **1. Import Data** 📥

You have 3 options:

#### **Option A: UI Upload (Recommended)** ⭐
1. Deploy your backend to Render
2. Deploy your frontend to Vercel
3. Visit `/voter-registration` page
4. Drag & drop `data/rov_per_polling_station.csv`
5. Click "Upload & Import"

#### **Option B: Script Import**
```bash
python3 scripts/import_polling_stations.py \
  --database-url "postgresql://kenpolimarket:bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" \
  --csv-file "data/rov_per_polling_station.csv"
```

**Note**: This will take 5-10 minutes over the internet.

#### **Option C: Local Import + Dump/Restore**
```bash
# 1. Import to local database
python3 scripts/import_polling_stations.py \
  --database-url "postgresql://kenpolimarket:password@localhost:5433/kenpolimarket" \
  --csv-file "data/rov_per_polling_station.csv"

# 2. Dump polling station data
pg_dump -h localhost -p 5433 -U kenpolimarket -d kenpolimarket \
  -t polling_stations -t registration_centers \
  --data-only > polling_data.sql

# 3. Restore to Render
psql "postgresql://kenpolimarket:bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" \
  < polling_data.sql
```

### **2. Deploy Backend** 🚀

Your backend already has the new router (`polling_stations.py`).

**Render will auto-deploy** when you push to GitHub:
```bash
git add .
git commit -m "Add polling stations feature with UI upload"
git push origin main
```

### **3. Deploy Frontend** 🎨

Your frontend has the new page (`/voter-registration`).

**Vercel will auto-deploy** when you push to GitHub.

### **4. Test** ✅

After deployment:
1. Visit `https://your-app.vercel.app/voter-registration`
2. Upload CSV file
3. View statistics and charts
4. Verify data accuracy

---

## Verification Queries

### **Check if tables exist**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('registration_centers', 'polling_stations');
```

### **Check current counts**:
```sql
SELECT 
    (SELECT COUNT(*) FROM polling_stations) as polling_stations,
    (SELECT COUNT(*) FROM registration_centers) as registration_centers;
```

### **Test the view**:
```sql
SELECT * FROM polling_stations_full LIMIT 5;
```

### **Test triggers** (after import):
```sql
-- Check if totals are auto-calculated
SELECT 
    rc.name,
    rc.total_polling_stations,
    rc.total_registered_voters,
    COUNT(ps.id) as actual_stations,
    SUM(ps.registered_voters_2022) as actual_voters
FROM registration_centers rc
LEFT JOIN polling_stations ps ON ps.registration_center_id = rc.id
GROUP BY rc.id, rc.name, rc.total_polling_stations, rc.total_registered_voters
LIMIT 10;
```

---

## Expected Results After Import

| Metric | Expected Value |
|--------|----------------|
| Polling Stations | 52,934 |
| Registration Centers | ~10,000 |
| Total Registered Voters | ~22,000,000 |
| Counties with Data | 47 |
| Constituencies with Data | 290 |
| Wards with Data | 1,450 |

---

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Drop views
DROP VIEW IF EXISTS polling_stations_full CASCADE;
DROP VIEW IF EXISTS registration_centers_stats CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_reg_center_totals ON polling_stations;
DROP TRIGGER IF EXISTS trigger_update_ward_voters ON polling_stations;
DROP TRIGGER IF EXISTS trigger_update_constituency_voters ON wards;
DROP TRIGGER IF EXISTS trigger_update_county_voters ON constituencies;

-- Drop functions
DROP FUNCTION IF EXISTS update_reg_center_totals() CASCADE;
DROP FUNCTION IF EXISTS update_ward_voters() CASCADE;
DROP FUNCTION IF EXISTS update_constituency_voters() CASCADE;
DROP FUNCTION IF EXISTS update_county_voters() CASCADE;

-- Drop tables
DROP TABLE IF EXISTS polling_stations CASCADE;
DROP TABLE IF EXISTS registration_centers CASCADE;
```

---

## Summary

✅ **Migration Status**: SUCCESS  
✅ **Tables Created**: 2/2  
✅ **Triggers Created**: 10/10  
✅ **Views Created**: 2/2  
✅ **Indexes Created**: 9/9  

**Your Render database is now ready to receive polling station data!** 🎉

**Next Action**: Import the CSV data using one of the 3 methods above.


