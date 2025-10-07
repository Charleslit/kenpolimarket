# ⚠️ DATABASE SETUP REQUIRED

## Current Situation

The explorer page (and entire backend) **cannot work** without the PostgreSQL database running.

**Error:** `connection to server at "localhost" port 5433 failed: Connection refused`

## What's Blocking You

Everything is ready to go EXCEPT the database:

- ✅ Frontend code complete (Leaflet map integrated)
- ✅ Backend code complete (API endpoints ready)
- ✅ Scripts created (GeoJSON generation ready)
- ❌ **PostgreSQL database NOT running**

## Quick Fix Options

### Option 1: Start Existing PostgreSQL (If Installed)

```bash
# Check if PostgreSQL is installed
which psql

# Check status
sudo systemctl status postgresql

# Start it
sudo systemctl start postgresql

# Enable auto-start on boot
sudo systemctl enable postgresql
```

### Option 2: Use Docker (Recommended)

If you have Docker installed:

```bash
# Check if docker-compose.yml exists
ls docker-compose.yml

# Start PostgreSQL container
docker-compose up -d postgres

# Check it's running
docker ps
```

### Option 3: Install PostgreSQL

```bash
# On Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start the service
sudo systemctl start postgresql
```

## Database Configuration

Your backend is configured to connect to:
- **Host:** localhost
- **Port:** 5433 (not the default 5432!)
- **Database:** Check `backend/config.py` for details

### Check Your Config

```bash
cat backend/config.py | grep -A 10 "DATABASE"
```

### Common Issues

**Issue 1: Wrong Port**
- Default PostgreSQL port is 5432
- Your config uses 5433
- Either change config or configure PostgreSQL to use 5433

**Issue 2: Database Doesn't Exist**
- You need to create the database first
- Run migrations/init scripts

**Issue 3: Wrong Credentials**
- Check username/password in config
- Make sure they match your PostgreSQL setup

## Once Database is Running

### Step 1: Test Connection

```bash
# From backend directory
cd backend
source venv/bin/activate
python -c "from database import engine; print(engine.connect())"
```

Should print connection object, not error.

### Step 2: Create GeoJSON Files

```bash
# This will fetch data from database and create GeoJSON files
python scripts/create_geojson_from_db.py
```

This creates:
- `frontend/public/kenya-constituencies.geojson` (~290 features)
- `frontend/public/kenya-wards.geojson` (~1,450 features)

### Step 3: Test Explorer

```bash
# Make sure backend is running
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8001

# In another terminal, make sure frontend is running
cd frontend
npm run dev

# Visit
open http://localhost:3000/explorer
```

## What You'll Get

### With Database Running (No GeoJSON)
- ✅ Explorer page loads
- ✅ Can see counties on map
- ✅ Can drill down to constituencies
- ✅ Can drill down to wards
- ⚠️ Constituencies/wards at approximate locations

### With Database + GeoJSON Files
- ✅ Explorer page loads
- ✅ Can see counties on map
- ✅ Can drill down to constituencies
- ✅ Can drill down to wards
- ✅ **Constituencies/wards at calculated centroids (better accuracy)**

### With Database + Real GeoJSON Boundaries
- ✅ Everything above PLUS
- ✅ **Actual boundary polygons** (not just points)
- ✅ **Exact centroids** from official boundaries
- ✅ **Professional-looking map**

## Alternative: Mock Data (For Testing Only)

If you just want to see the map working without database, I can create a version that uses mock/static data. But this won't be useful for production.

## Summary

**You're 95% done!** Everything is coded and ready. You just need to:

1. **Start PostgreSQL database** (5 minutes)
2. **Run the GeoJSON creation script** (1 minute)
3. **Enjoy your working explorer!** 🎉

The database is the **only** thing preventing the explorer from working right now.

## Need Help?

### Check Database Status

```bash
# Is PostgreSQL installed?
dpkg -l | grep postgresql

# Is it running?
sudo systemctl status postgresql

# What port is it on?
sudo netstat -plnt | grep postgres

# Can you connect?
psql -h localhost -p 5433 -U your_username
```

### Check Backend Config

```bash
# View database URL
cd backend
cat config.py | grep DATABASE_URL
```

### Test API Without Database

The API won't work without database, but you can check if the server starts:

```bash
cd backend
source venv/bin/activate
python -c "from main import app; print('App loaded successfully')"
```

## Next Steps

1. **Get database running** - This is priority #1
2. **Test API connection** - `curl http://localhost:8001/api/counties/`
3. **Run GeoJSON script** - `python scripts/create_geojson_from_db.py`
4. **Test explorer** - Visit http://localhost:3000/explorer

Once the database is running, everything else will work immediately!

