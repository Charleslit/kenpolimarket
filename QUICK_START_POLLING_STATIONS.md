# 🚀 Quick Start: Polling Station Data

## TL;DR - 3 Commands to Get Started

```bash
# 1. Setup database & import data (local)
./scripts/setup_polling_stations.sh "postgresql://kenpolimarket:password@localhost:5433/kenpolimarket"

# 2. Start backend
cd backend && uvicorn main:app --reload --port 8000 &

# 3. Start frontend
cd frontend && npm run dev
```

Then visit: **http://localhost:3000/voter-registration**

---

## What You Get

### **📊 Dashboard Features**:
- Upload CSV files via drag & drop
- View 52,934 polling stations
- See 22M+ registered voters
- Analyze by county, constituency, ward
- Interactive charts and tables

### **🎯 Use Cases**:
1. **Upload Data**: Drag & drop IEBC CSV files
2. **View Statistics**: Total voters, stations, centers
3. **Analyze Counties**: Compare voter distribution
4. **Search Stations**: Find specific polling stations
5. **Export Data**: Download filtered results

---

## Option 1: UI Upload (Easiest)

**Perfect if you want to use the web interface**

### Step 1: Apply Migration Only
```bash
psql "postgresql://kenpolimarket:password@localhost:5433/kenpolimarket" \
  -f database/migrations/002_add_polling_stations.sql
```

### Step 2: Start Services
```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Step 3: Upload via UI
1. Go to `http://localhost:3000/voter-registration`
2. Drag & drop `data/rov_per_polling_station.csv`
3. Click "Upload & Import"
4. Wait 2-3 minutes
5. Done! ✅

---

## Option 2: Script Import (Fastest)

**Perfect if you want automation**

### One Command:
```bash
./scripts/setup_polling_stations.sh "postgresql://kenpolimarket:password@localhost:5433/kenpolimarket"
```

This will:
- ✅ Apply migration
- ✅ Import all 52,934 stations
- ✅ Verify data integrity
- ✅ Show sample results

Then start your services and view the dashboard.

---

## Option 3: Manual Import

**Perfect if you want full control**

### Step 1: Migration
```bash
psql "your-database-url" -f database/migrations/002_add_polling_stations.sql
```

### Step 2: Import
```bash
python3 scripts/import_polling_stations.py \
  --database-url "your-database-url" \
  --csv-file "data/rov_per_polling_station.csv"
```

### Step 3: Verify
```bash
psql "your-database-url" -c "SELECT COUNT(*) FROM polling_stations;"
# Should return: 52934
```

---

## For Render (Production)

### Apply to Render Database:
```bash
./scripts/setup_polling_stations.sh \
  "postgresql://kenpolimarket:bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket"
```

**Note**: This will take 5-10 minutes over the internet.

---

## Troubleshooting

### "Migration already applied"
✅ This is fine! The script will continue with import.

### "CSV file not found"
Make sure you're in the project root directory:
```bash
cd /home/charles/Documents/augment-projects/kenpolimarket
```

### "Connection timeout"
Add timeout parameter:
```bash
PGCONNECT_TIMEOUT=30 ./scripts/setup_polling_stations.sh "your-url"
```

### "Import taking too long"
- Local: Should take 2-3 minutes
- Render: Can take 5-10 minutes (network latency)
- Progress is shown every 1000 rows

---

## Verify Success

### Check counts:
```sql
-- Should be 52,934
SELECT COUNT(*) FROM polling_stations;

-- Should be ~10,000
SELECT COUNT(*) FROM registration_centers;

-- Should be ~22 million
SELECT SUM(registered_voters_2022) FROM polling_stations;
```

### View sample data:
```sql
SELECT 
    ps.name,
    ps.registered_voters_2022,
    co.name as county
FROM polling_stations ps
JOIN counties co ON ps.county_id = co.id
ORDER BY ps.registered_voters_2022 DESC
LIMIT 5;
```

---

## What's Next?

After import, you can:

1. **View Dashboard**: `http://localhost:3000/voter-registration`
2. **Use API**: `http://localhost:8000/api/polling-stations/stats`
3. **Search Stations**: `http://localhost:8000/api/polling-stations/search?q=BOMU`
4. **Filter by County**: `http://localhost:8000/api/polling-stations/?county_id=1`

---

## API Examples

### Get statistics:
```bash
curl http://localhost:8000/api/polling-stations/stats | jq
```

### Search for a station:
```bash
curl "http://localhost:8000/api/polling-stations/search?q=BOMU" | jq
```

### Get county breakdown:
```bash
curl http://localhost:8000/api/polling-stations/by-county | jq
```

### List stations in a county:
```bash
curl "http://localhost:8000/api/polling-stations/?county_id=1&limit=10" | jq
```

---

## Need Help?

Check these files:
- **Full Guide**: `VOTER_REGISTRATION_FEATURE_COMPLETE.md`
- **Implementation Details**: `POLLING_STATION_IMPLEMENTATION_GUIDE.md`
- **Data Analysis**: `POLLING_STATION_DATA_ANALYSIS.md`

---

**Ready to import 52,934 polling stations? Let's go! 🚀**


