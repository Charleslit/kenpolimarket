# 🔄 Data Synchronization Strategy - Local to Production

**Date:** October 7, 2025  
**Purpose:** Keep production database in sync with correct voter registration data

---

## Problem Identified

The production database had **incomplete/incorrect voter registration data**:

### Example: Ruaraka Constituency
- **Local Database:** 123,465 registered voters ✅
- **Production Database:** 0 registered voters ❌

This caused the demographics population script to skip many constituencies because it only populates areas with `registered_voters_2022 > 0`.

---

## Solution: Automated Sync Script

Created `scripts/sync_voter_registration_to_production.py` to sync data from local to production.

### What It Does:

1. **Fetches data from local database** (Docker PostgreSQL on port 5433)
   - Counties with voter registration data
   - Constituencies with voter registration data
   - Wards with voter registration data
   - Polling stations with voter registration data

2. **Updates production database** (Render PostgreSQL)
   - Matches records by `code` field
   - Updates `registered_voters_2022` field
   - Commits in batches for performance

3. **Verifies the sync**
   - Compares local vs production data
   - Shows mismatches
   - Confirms sync success

---

## Data Volumes

| Level | Records | Status |
|-------|---------|--------|
| Counties | 47 | ✅ Synced |
| Constituencies | 290 | ✅ Synced |
| Wards | 1,369 | ✅ Synced |
| Polling Stations | 40,909 | 🔄 Syncing... |

---

## Usage

### Run the Sync:
```bash
python3 scripts/sync_voter_registration_to_production.py
```

### Options:
1. Counties only
2. Constituencies only
3. Wards only
4. Polling stations only
5. **All levels (recommended)** ← Default

### Confirmation Required:
The script asks for confirmation before updating production:
```
⚠️  This will update production database. Continue? (yes/no):
```

---

## After Sync: Re-populate Demographics

Once the sync completes, you need to **re-run the demographics population** script to populate all constituencies (not just the 5 that had data before):

```bash
python3 scripts/populate_nairobi_demographics_production.py
```

### Expected Results After Re-population:

**Before Sync:**
- 5 constituencies with demographics
- 5 wards with demographics
- 1,562 polling stations with demographics

**After Sync + Re-population:**
- **17 constituencies** with demographics (all Nairobi constituencies)
- **67 wards** with demographics (all Nairobi wards)
- **2,532 polling stations** with demographics (all Nairobi polling stations)

---

## Verification

### Check Ruaraka After Sync:

```python
python3 -c "
import psycopg2

PROD_DB_CONFIG = {
    'host': '35.227.164.209',
    'database': 'kenpolimarket',
    'user': 'kenpolimarket',
    'password': 'bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV',
    'port': 5432,
    'sslmode': 'require'
}

conn = psycopg2.connect(**PROD_DB_CONFIG)
cursor = conn.cursor()

cursor.execute('''
    SELECT name, registered_voters_2022
    FROM constituencies
    WHERE name = 'RUARAKA';
''')

result = cursor.fetchone()
print(f'Ruaraka: {result[1]:,} voters')

cursor.close()
conn.close()
"
```

**Expected Output:**
```
Ruaraka: 123,465 voters
```

---

## Automation Strategy

### Option 1: Manual Sync (Current)
- Run sync script manually when local data changes
- Good for development/testing
- Full control over when sync happens

### Option 2: Scheduled Sync (Future)
- Set up cron job to run sync daily/weekly
- Automatically keeps production in sync
- Example cron:
  ```bash
  0 2 * * 0 /path/to/sync_voter_registration_to_production.py
  # Runs every Sunday at 2 AM
  ```

### Option 3: CI/CD Integration (Recommended for Production)
- Add sync to deployment pipeline
- Sync runs automatically after data updates
- Ensures production always has latest data

---

## Data Flow

```
┌─────────────────────┐
│  Local Database     │
│  (Docker)           │
│  Port: 5433         │
│                     │
│  ✅ Complete data   │
│  ✅ All 47 counties │
│  ✅ 290 constituencies
│  ✅ 1,369 wards     │
│  ✅ 40,909 polling  │
│     stations        │
└──────────┬──────────┘
           │
           │ sync_voter_registration_to_production.py
           │
           ▼
┌─────────────────────┐
│  Production DB      │
│  (Render)           │
│  Port: 5432         │
│                     │
│  ✅ Synced data     │
│  ✅ All 47 counties │
│  ✅ 290 constituencies
│  ✅ 1,369 wards     │
│  ✅ 40,909 polling  │
│     stations        │
└─────────────────────┘
```

---

## Best Practices

### 1. **Always Backup Before Sync**
```bash
# Backup production database before major sync
pg_dump -h 35.227.164.209 -U kenpolimarket -d kenpolimarket > backup_before_sync.sql
```

### 2. **Test on Sample First**
- Run sync for one level (e.g., constituencies only)
- Verify results
- Then run full sync

### 3. **Monitor Progress**
- Script shows progress every 100 records
- Watch for errors
- Check final counts

### 4. **Verify After Sync**
- Run verification queries
- Compare sample records
- Test API endpoints

---

## Troubleshooting

### Issue: Sync Fails with Connection Timeout
**Solution:** Increase `connect_timeout` in `PROD_DB_CONFIG`

### Issue: Some Records Not Updated
**Solution:** Check that `code` fields match between local and production

### Issue: Sync Takes Too Long
**Solution:** 
- Sync one level at a time
- Increase batch size
- Run during off-peak hours

---

## Future Enhancements

1. **Differential Sync**
   - Only sync changed records
   - Track last sync timestamp
   - Faster updates

2. **Bidirectional Sync**
   - Sync production changes back to local
   - Conflict resolution
   - Merge strategies

3. **Real-time Sync**
   - Database triggers
   - Change data capture (CDC)
   - Event-driven updates

4. **Validation**
   - Data quality checks
   - Constraint validation
   - Anomaly detection

---

## Summary

✅ **Created sync script** to keep production in sync with local data  
✅ **Syncing all levels:** Counties, Constituencies, Wards, Polling Stations  
✅ **40,909 polling stations** being updated with correct voter counts  
✅ **After sync:** Re-run demographics population for complete data  

**Result:** Production will have accurate voter registration data for all administrative levels, enabling proper demographics population and analysis.

