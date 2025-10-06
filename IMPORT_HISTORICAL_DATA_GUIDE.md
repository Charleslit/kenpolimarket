# 📥 Import Historical Data to Production

## 🎯 Goal
Import 2017 and 2022 voter registration data to your production database so users can see it on the live site.

---

## 📋 Prerequisites

Before importing, you need to:

1. ✅ **Apply Database Migration** (if not done yet)
2. ✅ **Have Database Password** ready
3. ✅ **Have CSV Files** (you already have these!)

---

## 🗄️ Step 1: Apply Database Migration (If Not Done)

First, check if the migration is already applied:

```bash
# Check if voter_registration_history table exists
PGPASSWORD='your_password' psql \
  "postgresql://kenpolimarket@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" \
  -c "\dt voter_registration_history"
```

**If table doesn't exist**, apply the migration:

```bash
PGPASSWORD='your_password' psql \
  "postgresql://kenpolimarket@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" \
  -f database/migrations/003_add_voter_registration_history.sql
```

---

## 📤 Step 2: Import Data Using Python Script

### **Option A: Direct Import (Recommended)**

I've created a Python script that imports both CSV files directly to production:

```bash
# Set database password
export DB_PASSWORD='your_render_db_password'

# Run import script
python3 scripts/import_historical_data.py
```

**What it does**:
1. ✅ Parses both 2017 and 2022 CSV files
2. ✅ Connects to production database
3. ✅ Inserts data into `voter_registration_history` table
4. ✅ Triggers automatically update aggregates
5. ✅ Shows statistics and progress

**Expected Output**:
```
============================================================
🇰🇪 KenPoliMarket - Historical Data Import
============================================================

📖 Step 1: Parsing CSV files...
------------------------------------------------------------
📖 Reading 2022 CSV: data/rov_per_polling_station.csv
✅ Parsed 43,412 stations from 2022 CSV
📖 Reading 2017 CSV: data/https___iebc.or.ke_docs_...
✅ Parsed 40,883 stations from 2017 CSV

📊 Summary:
   - 2022: 43,412 stations
   - 2017: 40,883 stations

🤔 Proceed with import to PRODUCTION database? (yes/no): yes

📤 Step 2: Importing to database...
------------------------------------------------------------
🔌 Connecting to production database...
✅ Connected to database
📊 Importing 43,412 stations for year 2022...
✅ Successfully imported 43,412 records for 2022
📊 Statistics for 2022:
   - Polling Stations: 43,412
   - Total Registered Voters: 20,545,027

📊 Importing 40,883 stations for year 2017...
✅ Successfully imported 40,883 records for 2017
📊 Statistics for 2017:
   - Polling Stations: 40,883
   - Total Registered Voters: 19,611,423

============================================================
✅ Import completed successfully!

🎉 Next steps:
   1. Visit https://your-app.vercel.app/explorer
   2. Click year selector (2017 or 2022)
   3. View historical voter registration data!
============================================================
```

---

### **Option B: Use Admin UI (After Deployment)**

Once Vercel deployment completes, you can also use the admin interface:

1. **Go to**: `https://your-app.vercel.app/admin`
2. **Login**: Enter password (`ken2027`)
3. **Click**: "📥 Data Import" tab
4. **Select Year**: Click "2017"
5. **Upload**: Drag and drop `https___iebc.or.ke_docs_Registered-Voters-Per-Polling-Station-For-2017-General-Elections.csv`
6. **Import**: Click "Upload & Import"
7. **Repeat**: For 2022 with `rov_per_polling_station.csv`

**Pros**:
- ✅ User-friendly interface
- ✅ Progress tracking
- ✅ Error reporting

**Cons**:
- ❌ Slower (uploads file to backend first)
- ❌ May timeout on large files

---

## 🔍 Step 3: Verify Import

### **Check Database**:

```bash
# Check 2017 data
PGPASSWORD='your_password' psql \
  "postgresql://kenpolimarket@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" \
  -c "SELECT COUNT(*), SUM(registered_voters) FROM voter_registration_history WHERE election_year = 2017;"

# Check 2022 data
PGPASSWORD='your_password' psql \
  "postgresql://kenpolimarket@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" \
  -c "SELECT COUNT(*), SUM(registered_voters) FROM voter_registration_history WHERE election_year = 2022;"
```

### **Check Website**:

1. Go to `https://your-app.vercel.app/explorer`
2. Click year selector at top
3. Click "2017" - should show 2017 data
4. Click "2022" - should show 2022 data
5. Map and statistics should update

---

## 📊 Expected Data

| Year | Polling Stations | Registered Voters |
|------|------------------|-------------------|
| 2017 | ~40,883 | ~19.6 million |
| 2022 | ~43,412 | ~20.5 million |

---

## 🐛 Troubleshooting

### **Error: "voter_registration_history table does not exist"**

**Solution**: Apply migration first (see Step 1)

```bash
PGPASSWORD='your_password' psql \
  "postgresql://kenpolimarket@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" \
  -f database/migrations/003_add_voter_registration_history.sql
```

---

### **Error: "DB_PASSWORD environment variable not set"**

**Solution**: Set the password

```bash
export DB_PASSWORD='your_render_db_password'
```

---

### **Error: "Connection timeout"**

**Solution**: Increase timeout or check network

```bash
# The script already has 30s timeout
# If still failing, check your internet connection
```

---

### **Error: "Polling station not found"**

**Cause**: Some 2017 polling stations may not exist in the current `polling_stations` table (which has 2022 data)

**Solution**: This is expected. The script will skip stations that don't match. You'll still get most of the data imported.

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Apply migration (if needed)
PGPASSWORD='your_password' psql \
  "postgresql://kenpolimarket@dpg-d3ginq7fte5s73c6j060-a.oregon-postgres.render.com/kenpolimarket" \
  -f database/migrations/003_add_voter_registration_history.sql

# 2. Set password
export DB_PASSWORD='your_password'

# 3. Run import
python3 scripts/import_historical_data.py

# 4. Verify on website
# Visit: https://your-app.vercel.app/explorer
# Click year selector: 2017 or 2022
```

---

## 🔐 Security Notes

- ✅ Script connects directly to production database
- ✅ Uses SSL connection (required by Render)
- ✅ Password via environment variable (not hardcoded)
- ✅ Batch inserts for performance
- ✅ ON CONFLICT handling (won't duplicate data)

---

## 📝 Files Involved

**CSV Files**:
- `data/rov_per_polling_station.csv` (2022 data)
- `data/https___iebc.or.ke_docs_Registered-Voters-Per-Polling-Station-For-2017-General-Elections.csv` (2017 data)

**Scripts**:
- `scripts/import_historical_data.py` (Import script)

**Database**:
- `database/migrations/003_add_voter_registration_history.sql` (Migration)

---

## 🎉 After Import

Once imported, users can:

1. ✅ Visit `/explorer` page
2. ✅ Select year (2017 or 2022)
3. ✅ See historical voter registration data
4. ✅ Compare trends across years
5. ✅ Drill down: Counties → Constituencies → Wards → Polling Stations

---

## 🚀 Next Steps

After importing 2017 and 2022 data:

1. **Import 2013 data** (when available)
2. **Add 2027 forecast data** (when ready)
3. **Create trend analysis** (compare 2017 vs 2022 growth)
4. **Add turnout data** (actual votes cast vs registered)

---

**Ready to import? Run the script!** 🎯

