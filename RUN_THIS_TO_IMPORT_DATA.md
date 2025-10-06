# 🚀 Quick Import Guide

## The terminal was locking up, so I created a simple bash script for you!

---

## ✅ **Just Run This One Command:**

```bash
./run_import.sh
```

That's it! The script will:
1. ✅ Create the `voter_registration_history` table
2. ✅ Migrate existing 2022 data
3. ✅ Import 2017 historical data
4. ✅ Import 2022 historical data
5. ✅ Show you progress along the way

---

## 📋 **What the Script Does**

### **Step 1: Database Migration**
- Creates `voter_registration_history` table with proper schema
- Adds indexes for performance
- Migrates existing 2022 data from `polling_stations` table

### **Step 2: Historical Data Import**
- Parses `data/rov_per_polling_station.csv` (2022 data)
- Parses `data/https___iebc.or.ke_docs_Registered-Voters-Per-Polling-Station-For-2017-General-Elections.csv` (2017 data)
- Imports both to production database
- Shows progress and summary

---

## 🎯 **Expected Output**

You should see something like:

```
=========================================
KenPoliMarket Data Import Script
=========================================

Step 1: Creating voter_registration_history table...

🔌 Connecting to production database...
✅ Connected successfully!

📊 Creating voter_registration_history table...
✅ Table created!

📊 Creating indexes...
✅ Indexes created!

📊 Migrating existing 2022 data...
✅ Migrated 43,412 records for 2022!

🎉 Migration complete!

=========================================
Step 2: Importing historical data...
=========================================

📊 Parsing 2022 CSV...
✅ Found 43,412 stations

📊 Parsing 2017 CSV...
✅ Found 40,883 stations

📊 Summary:
   - 2022: 43,412 stations
   - 2017: 40,883 stations

🤔 Proceed with import to PRODUCTION database? (yes/no):
```

Type `yes` and press Enter!

---

## ⏱️ **How Long Will It Take?**

- Migration: ~30 seconds
- Import: ~2-3 minutes (batch processing is fast!)
- Total: ~3-4 minutes

---

## 🔍 **After Import**

Visit your production site and:
1. Go to `/explorer` page
2. Click the year selector (2017, 2022)
3. See the historical data! 🎉

---

## 🆘 **If Something Goes Wrong**

### **Error: "Could not connect to database"**
- Check your internet connection
- Verify Render database is running

### **Error: "Table already exists"**
- That's OK! The script uses `IF NOT EXISTS`
- It will skip creation and continue

### **Error: "CSV file not found"**
- Make sure you're in the project root directory
- Check that both CSV files exist in `data/` folder

### **Script hangs or freezes**
- Press `Ctrl+C` to cancel
- Check database connection
- Try running just the migration part first

---

## 📝 **Files Created**

- ✅ `run_import.sh` - Main import script (this is what you run!)
- ✅ `run_migration.py` - Python migration script (called by bash script)
- ✅ `scripts/import_historical_data.py` - Historical data import script
- ✅ `scripts/quick_migration.py` - Quick migration alternative
- ✅ `scripts/apply_migration.py` - Full migration script

---

## 🎊 **Ready?**

Just run:

```bash
./run_import.sh
```

And watch the magic happen! 🇰🇪📊🗳️

