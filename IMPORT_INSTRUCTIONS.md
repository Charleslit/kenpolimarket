# 📥 Polling Station Data Import Instructions

## Current Status

✅ **Migration Applied** - Tables and triggers created on Render  
⏳ **Data Import Pending** - Need to import geographic hierarchy + polling stations

---

## Problem Identified

The Render database currently has:
- ✅ 47 counties
- ❌ 0 constituencies  
- ❌ 0 wards

**We need to import constituencies and wards BEFORE importing polling stations.**

---

## Solution: 2-Step Import Process

### **Step 1: Import Geographic Hierarchy**

This extracts constituencies and wards from the CSV and imports them:

```bash
python3 scripts/import_geographic_hierarchy.py \
  --database-url "postgresql://kenpolimarket:bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" \
  --csv-file "data/rov_per_polling_station.csv"
```

**Expected Output**:
```
✅ Found 47 counties
✅ Found 251 unique constituencies
✅ Found 751 unique wards
✅ Imported 251 constituencies
✅ Imported 751 wards
```

### **Step 2: Import Polling Stations**

After Step 1 completes, import the polling stations:

```bash
python3 scripts/import_polling_stations_simple.py \
  --database-url "postgresql://kenpolimarket:bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" \
  --csv-file "data/rov_per_polling_station.csv"
```

**Expected Output**:
```
✅ Loaded 47 counties, 251 constituencies, 751 wards
✓ Imported 500 stations...
✓ Imported 1,000 stations...
...
✓ Imported 52,928 stations...
✅ Polling stations in database: 52,928
✅ Total registered voters: 22,120,458
```

---

## Alternative: Combined Script

I can create a single script that does both steps. Would you like me to create that?

---

## Troubleshooting

### DNS Resolution Errors

If you see:
```
could not translate host name "dpg-xxx.oregon-postgres.render.com" to address
```

**Solutions**:
1. **Wait a moment** - DNS can be temporarily unavailable
2. **Check internet connection**
3. **Try again** - Usually resolves itself
4. **Use IP address** (if Render provides one)

### Connection Timeouts

If the connection is slow:
1. The scripts use 30-second timeouts
2. Import happens in batches of 500 rows
3. Progress is shown every 500 rows
4. Total time: 5-10 minutes for 52,928 stations

---

## Verification After Import

### Check Counts:
```bash
PGCONNECT_TIMEOUT=10 psql "postgresql://kenpolimarket:bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" -c "
SELECT 
    (SELECT COUNT(*) FROM counties) as counties,
    (SELECT COUNT(*) FROM constituencies) as constituencies,
    (SELECT COUNT(*) FROM wards) as wards,
    (SELECT COUNT(*) FROM polling_stations) as polling_stations,
    (SELECT SUM(registered_voters_2022) FROM polling_stations) as total_voters;
"
```

**Expected**:
```
counties | constituencies | wards | polling_stations | total_voters
---------+----------------+-------+------------------+--------------
      47 |            251 |   751 |           52,928 |   22,120,458
```

### View Sample Data:
```bash
psql "your-database-url" -c "
SELECT 
    ps.code,
    ps.name,
    ps.registered_voters_2022,
    co.name as county,
    c.name as constituency,
    w.name as ward
FROM polling_stations ps
LEFT JOIN counties co ON ps.county_id = co.id
LEFT JOIN constituencies c ON ps.constituency_id = c.id
LEFT JOIN wards w ON ps.ward_id = w.id
ORDER BY ps.registered_voters_2022 DESC
LIMIT 10;
"
```

---

## Files Created

### Scripts:
1. **`scripts/import_geographic_hierarchy.py`** - Import constituencies & wards
2. **`scripts/import_polling_stations_simple.py`** - Import polling stations
3. **`scripts/import_polling_stations.py`** - Original (more complex)

### Migrations:
1. **`database/migrations/002_add_polling_stations_fixed.sql`** - Fixed migration (APPLIED ✅)

### Documentation:
1. **`IMPORT_INSTRUCTIONS.md`** - This file
2. **`VOTER_REGISTRATION_FEATURE_COMPLETE.md`** - Full feature guide
3. **`QUICK_START_POLLING_STATIONS.md`** - Quick start
4. **`RENDER_MIGRATION_002_RESULTS.md`** - Migration results

---

## Next Steps After Import

### 1. Deploy Backend

Your backend already has the polling stations router. Just push to GitHub:

```bash
git add .
git commit -m "Add polling stations feature with data import"
git push origin main
```

Render will auto-deploy.

### 2. Deploy Frontend

Your frontend has the `/voter-registration` page. Push to GitHub:

```bash
git push origin main
```

Vercel will auto-deploy.

### 3. Test the UI

Visit: `https://your-app.vercel.app/voter-registration`

You should see:
- ✅ Statistics cards (22M voters, 52,928 stations)
- ✅ Bar charts (top 10 counties)
- ✅ County breakdown table
- ✅ CSV upload interface

### 4. Upload More Data (Optional)

You can upload additional CSV files via the UI:
1. Go to `/voter-registration`
2. Drag & drop CSV file
3. Click "Upload & Import"
4. Watch progress

---

## Summary

**Current Status**:
- ✅ Migration applied to Render
- ✅ Tables created (polling_stations, registration_centers)
- ✅ Triggers created (auto-update totals)
- ✅ Import scripts created
- ⏳ Data import pending (DNS issues)

**To Complete**:
1. Run `import_geographic_hierarchy.py` (when DNS resolves)
2. Run `import_polling_stations_simple.py`
3. Verify counts
4. Deploy backend & frontend
5. Test UI

**Estimated Time**:
- Step 1: 1-2 minutes
- Step 2: 5-10 minutes
- Total: ~10 minutes

---

## Need Help?

If you encounter issues:
1. Check the error message
2. Verify database connection
3. Check DNS resolution
4. Try again (DNS issues usually resolve quickly)
5. Contact me for assistance

---

**You're almost there! Just need to run the 2 import scripts when DNS is stable.** 🚀


