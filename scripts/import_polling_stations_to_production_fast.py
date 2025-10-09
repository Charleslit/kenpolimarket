#!/usr/bin/env python3
"""
Fast import of polling stations to PRODUCTION using bulk staging + single upsert.
- Parses IEBC CSV (data/rov_per_polling_station.csv)
- Loads parsed rows into a TEMP staging table with execute_values (bulk insert)
- Performs one SQL upsert joining to counties/constituencies/wards by normalized codes
- Much faster than per-row upserts
"""

import psycopg2
from psycopg2.extras import execute_values
import re
import sys
from pathlib import Path

PROD_DB_CONFIG = {
    'host': '35.227.164.209',
    'database': 'kenpolimarket',
    'user': 'kenpolimarket',
    'password': 'bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV',
    'port': 5432,
    'sslmode': 'require',
    'connect_timeout': 30
}

CSV_PATH = Path('data/rov_per_polling_station.csv')


def parse_iebc_line(line: str):
    """Parse a line from the IEBC CSV-like file into fields we need.
    Returns tuple(county_code, const_code, ward_code, ps_code, ps_name, voters) or None
    """
    line = line.strip().strip('"')
    if not line or 'County Name' in line or 'REGISTERED VOTERS' in line:
        return None

    parts = re.split(r'\s{2,}', line)
    if len(parts) < 10:
        return None

    try:
        county_code = parts[0].strip()
        county_name = parts[1].strip()
        offset = 0
        # Handle split county names (e.g., 'NAIROBI CITY', 'ELGEYO MARAKWET', etc.)
        if county_name in ['UASIN', 'NAIROBI', 'TAITA', 'ELGEYO', 'THARAKA', 'TRANS']:
            county_name = f"{county_name} {parts[2].strip()}"
            offset = 1

        const_code = parts[2 + offset].strip()
        const_name = parts[3 + offset].strip()
        ward_code = parts[4 + offset].strip()
        ward_name = parts[5 + offset].strip()
        reg_center_code = parts[6 + offset].strip()

        combined = ' '.join(parts[7 + offset:])
        m = re.search(r'(\d{15})', combined)
        if not m:
            return None
        ps_code = m.group(1)
        prefix = combined[:m.start()].strip()
        suffix = combined[m.end():].strip()

        reg_center_name = prefix if prefix else parts[7 + offset].strip()
        voters_match = re.search(r'(\d+)$', suffix)
        if voters_match:
            voters = int(voters_match.group(1))
            ps_name = suffix[:voters_match.start()].strip() or reg_center_name
        else:
            return None

        if voters > 2147483647 or voters < 0:
            return None

        return (county_code, const_code, ward_code, ps_code, ps_name, voters)
    except Exception:
        return None


def main():
    if not CSV_PATH.exists():
        print(f"❌ CSV not found at {CSV_PATH}")
        sys.exit(1)

    print("🚀 Fast import to PRODUCTION (staging + bulk upsert)")

    # Connect
    try:
        conn = psycopg2.connect(**PROD_DB_CONFIG)
        conn.autocommit = False
        cur = conn.cursor()
        print("✅ Connected to production")
        # Speed up this session safely for bulk load
        cur.execute("SET LOCAL synchronous_commit TO OFF;")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

    # Initial count
    cur.execute("SELECT COUNT(*) FROM polling_stations")
    initial = cur.fetchone()[0]
    print(f"📊 Existing polling_stations: {initial:,}")

    # Create TEMP staging
    cur.execute(
        """
        CREATE TEMP TABLE IF NOT EXISTS staging_polling_stations (
          county_code text,
          const_code text,
          ward_code text,
          ps_code text,
          ps_name text,
          voters integer
        );
        """
    )

    # Parse and bulk insert into staging
    print("📥 Parsing CSV and staging (bulk)")
    rows = []
    total = 0
    skipped = 0
    batch_size = 10000

    with CSV_PATH.open('r', encoding='utf-8') as f:
        lines = f.readlines()

    for line in lines[5:]:  # Skip header
        total += 1
        rec = parse_iebc_line(line)
        if not rec:
            skipped += 1
            continue
        rows.append(rec)
        if len(rows) >= batch_size:
            execute_values(cur,
                "INSERT INTO staging_polling_stations (county_code,const_code,ward_code,ps_code,ps_name,voters) VALUES %s",
                rows
            )
            print(f"   Staged {total:,} lines... (skipped: {skipped:,})")
            rows.clear()

    if rows:
        execute_values(cur,
            "INSERT INTO staging_polling_stations (county_code,const_code,ward_code,ps_code,ps_name,voters) VALUES %s",
            rows
        )

    # Do NOT commit here; keep TEMP table rows for the upsert in the same transaction

    # Upsert from staging → target via single SQL
    print("🗳️  Upserting from staging to polling_stations...")
    upsert_sql = """
    WITH norm AS (
      SELECT 
        lpad(county_code, 3, '0') AS county_code3,
        lpad(const_code, 3, '0') AS const_code3,
        CASE WHEN ward_code LIKE '%-%' THEN ward_code
             ELSE lpad(const_code, 3, '0') || '-' || lpad(ward_code, 4, '0')
        END AS ward_code_norm,
        ps_code, ps_name, voters
      FROM staging_polling_stations
    ),
    joined AS (
      SELECT n.ps_code, n.ps_name, n.voters,
             co.id AS county_id,
             c.id  AS constituency_id,
             w.id  AS ward_id
      FROM norm n
      JOIN counties co ON co.code = n.county_code3
      JOIN constituencies c ON c.code = n.const_code3
      JOIN wards w ON w.code = n.ward_code_norm
    )
    INSERT INTO polling_stations (code, name, ward_id, constituency_id, county_id, registered_voters_2022)
    SELECT ps_code, ps_name, ward_id, constituency_id, county_id, voters
    FROM joined
    ON CONFLICT (code) DO UPDATE SET
      registered_voters_2022 = EXCLUDED.registered_voters_2022,
      ward_id = EXCLUDED.ward_id,
      constituency_id = EXCLUDED.constituency_id,
      county_id = EXCLUDED.county_id,
      name = EXCLUDED.name,
      updated_at = CURRENT_TIMESTAMP;
    """
    cur.execute(upsert_sql)
    conn.commit()

    # Final count
    cur.execute("SELECT COUNT(*) FROM polling_stations")
    final = cur.fetchone()[0]

    print("\n✅ Bulk import complete")
    print(f"   Total lines read: {total:,}")
    print(f"   Skipped during parse: {skipped:,}")
    print(f"   Before: {initial:,} → After: {final:,} (Δ {final - initial:,})")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()

