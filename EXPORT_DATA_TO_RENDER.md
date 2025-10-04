# 📤 Export Local Data to Render Database

This guide shows you how to export your local database data and import it to your Render PostgreSQL database.

---

## 🎯 What This Does

This will copy all your local data to Render:
- ✅ Elections
- ✅ Candidates  
- ✅ Counties
- ✅ Forecasts

---

## 📋 Prerequisites

Before you start:

1. ✅ **Backend deployed to Render** (https://kenpolimarket-backend.onrender.com)
2. ✅ **Database created on Render** (kenpolimarket-db)
3. ✅ **Local database has data** (elections, candidates, forecasts)
4. ✅ **Local Docker containers running** (if using Docker)

---

## 🚀 Method 1: Python Script (Recommended)

This is the easiest method and works on all platforms.

### Step 1: Get Render Database URL

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on **`kenpolimarket-db`** (PostgreSQL database)
3. Scroll down to **"Connections"** section
4. Copy the **"External Database URL"**

It looks like:
```
postgresql://kenpolimarket:xxxxx@dpg-xxxxx.oregon-postgres.render.com/kenpolimarket
```

### Step 2: Run the Export Script

```bash
# Navigate to backend directory
cd backend

# Run the export script
python scripts/export_to_render.py
```

### Step 3: Follow the Prompts

The script will:
1. Ask for your Render database URL (paste it)
2. Connect to both local and Render databases
3. Export all data from local database
4. Show you what will be imported
5. Ask for confirmation
6. Import data to Render
7. Verify the import

### Example Output:

```
🚀 KenPoliMarket - Export Data to Render
==================================================

📋 Get Render Database Connection String
--------------------------------------------------

Paste your Render Database URL here: postgresql://...

✅ Database URL received

Connecting to Render database...
✅ Connected to Render database

Connecting to local database...
✅ Connected to local database

📋 Step 1: Export Local Database
==================================================

Exporting elections...
  ✅ 1 elections
Exporting candidates...
  ✅ 5 candidates
Exporting counties...
  ✅ 47 counties
Exporting forecasts...
  ✅ 235 forecasts

Total records to export: 288

📋 Step 2: Import to Render Database
==================================================

⚠️  WARNING: This will add/update data in your Render database.

Continue with import? (yes/no): yes

Importing elections...
  ✅ 1 elections imported
Importing candidates...
  ✅ 5 candidates imported
Importing counties...
  ✅ 47 counties imported
Importing forecasts...
  ✅ 235 forecasts imported

✅ All data imported successfully!

📋 Step 3: Verify Data
==================================================

Elections:  1
Candidates: 5
Counties:   47
Forecasts:  235

Total:      288 records

🎉 Export Complete!

Next steps:
  1. Test your backend: https://kenpolimarket-backend.onrender.com/api/docs
  2. Test your frontend: https://kenpolimarket.vercel.app

🚀 Your app is now live with data!
```

---

## 🚀 Method 2: Shell Script (Linux/Mac)

If you prefer using shell scripts and have PostgreSQL client tools installed:

### Step 1: Run the Export Script

```bash
./export_to_render.sh
```

### Step 2: Follow the Prompts

The script will:
1. Ask for your Render database URL
2. Export local database to SQL file
3. Import SQL file to Render
4. Verify the import

---

## ✅ Verify the Export

After exporting, verify your data is on Render:

### Option 1: Via Backend API

Visit: https://kenpolimarket-backend.onrender.com/api/docs

Try these endpoints:
- `GET /api/elections` - Should return your elections
- `GET /api/candidates` - Should return your candidates
- `GET /api/counties` - Should return 47 counties
- `GET /api/forecasts` - Should return your forecasts

### Option 2: Via Render Shell

1. Go to Render dashboard
2. Click on **`kenpolimarket-backend`** service
3. Click **"Shell"** tab
4. Run:
   ```bash
   python -c "
   from database import engine
   from sqlalchemy import text
   with engine.connect() as conn:
       result = conn.execute(text('SELECT COUNT(*) FROM elections'))
       print(f'Elections: {result.scalar()}')
       result = conn.execute(text('SELECT COUNT(*) FROM candidates'))
       print(f'Candidates: {result.scalar()}')
       result = conn.execute(text('SELECT COUNT(*) FROM counties'))
       print(f'Counties: {result.scalar()}')
       result = conn.execute(text('SELECT COUNT(*) FROM forecasts'))
       print(f'Forecasts: {result.scalar()}')
   "
   ```

### Option 3: Via Render Database Shell

1. Go to Render dashboard
2. Click on **`kenpolimarket-db`** (PostgreSQL)
3. Click **"Shell"** tab
4. Run:
   ```sql
   SELECT 'elections' as table_name, COUNT(*) as rows FROM elections
   UNION ALL
   SELECT 'candidates', COUNT(*) FROM candidates
   UNION ALL
   SELECT 'counties', COUNT(*) FROM counties
   UNION ALL
   SELECT 'forecasts', COUNT(*) FROM forecasts;
   ```

---

## 🔄 Re-running the Export

If you need to update data on Render:

1. Make changes to your local database
2. Run the export script again
3. The script uses `merge()` so it will:
   - **Update** existing records (same ID)
   - **Insert** new records (new ID)

---

## 🆘 Troubleshooting

### "Failed to connect to local database"

**Cause:** Local database not running

**Solution:**
```bash
# If using Docker
docker-compose up -d postgres

# If using local PostgreSQL
sudo systemctl start postgresql
```

### "Failed to connect to Render database"

**Cause:** Invalid database URL or network issue

**Solution:**
1. Double-check the database URL from Render dashboard
2. Make sure you copied the **External Database URL**
3. Check your internet connection

### "No module named 'models'"

**Cause:** Running script from wrong directory

**Solution:**
```bash
# Make sure you're in the backend directory
cd backend
python scripts/export_to_render.py
```

### "Table does not exist"

**Cause:** Render database schema not created

**Solution:**
1. Go to Render dashboard → `kenpolimarket-backend` → Shell
2. Run:
   ```bash
   python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"
   ```

---

## 📊 What Gets Exported

### Elections Table
- Election ID
- Name (e.g., "2027 Presidential Election")
- Date
- Type
- Status

### Candidates Table
- Candidate ID
- Name
- Party
- Party color
- Running mate
- Bio

### Counties Table
- County code
- County name
- Region
- Population (2019)
- Registered voters (2022)

### Forecasts Table
- Election ID
- Candidate ID
- County ID
- Vote share (mean, lower, upper)
- Win probability
- Model version

---

## 💡 Pro Tips

1. **Backup First:** The export script creates a backup in `database_backups/` (shell script only)

2. **Test Locally:** Make sure your local data is correct before exporting

3. **Incremental Updates:** You can run the export multiple times - it will update existing records

4. **Verify After Export:** Always check the API endpoints to confirm data is there

5. **Monitor Logs:** Check Render logs if you encounter issues

---

## 🎯 Next Steps After Export

Once data is exported:

1. **Test Backend API:**
   - Visit: https://kenpolimarket-backend.onrender.com/api/docs
   - Try the `/api/forecasts` endpoint
   - Verify data is returned

2. **Test Frontend:**
   - Visit: https://kenpolimarket.vercel.app
   - Navigate to Forecasts page
   - Check if county data loads
   - Test county search

3. **Verify Integration:**
   - Open browser console (F12)
   - Check for no CORS errors
   - Verify API calls succeed

---

## 📞 Support

If you encounter issues:

1. Check the error message carefully
2. Verify database URLs are correct
3. Check Render logs for backend errors
4. Make sure local database is running

---

**Ready to export? Run the Python script:**

```bash
cd backend
python scripts/export_to_render.py
```

🚀 **Your data will be live on Render in minutes!**

