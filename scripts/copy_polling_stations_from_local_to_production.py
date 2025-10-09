#!/usr/bin/env python3
"""
Copy polling stations from LOCAL -> PRODUCTION using codes (ward/const/county) for ID mapping.
- Pulls 2022 polling stations from local DB (voters > 0)
- Stages into TEMP table on production
- Single bulk upsert into production.polling_stations
"""
import psycopg2
from psycopg2.extras import execute_values

LOCAL_DB = {
    'host': 'localhost', 'port': 5433,
    'database': 'kenpolimarket', 'user': 'kenpolimarket', 'password': 'password'
}
PROD_DB = {
    'host': '35.227.164.209', 'port': 5432,
    'database': 'kenpolimarket', 'user': 'kenpolimarket', 'password': 'bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV',
    'sslmode': 'require', 'connect_timeout': 30
}

# Optional: limit copy to specific ward names within Nairobi
WARDS_TO_COPY = [
    'KILELESHWA',
    'MOUNTAIN',
    'WOODLEY/KENYATTA GOLF'
]

FETCH_ALL_SQL = """
SELECT ps.code, ps.name, ps.registered_voters_2022,
       w.code AS ward_code, c.code AS const_code, co.code AS county_code
FROM polling_stations ps
JOIN wards w ON ps.ward_id = w.id
JOIN constituencies c ON w.constituency_id = c.id
JOIN counties co ON c.county_id = co.id
WHERE ps.registered_voters_2022 IS NOT NULL AND ps.registered_voters_2022 > 0
ORDER BY ps.code
"""

FETCH_BY_WARD_IDS_SQL = """
SELECT ps.code, ps.name, ps.registered_voters_2022,
       w.code AS ward_code, c.code AS const_code, co.code AS county_code
FROM polling_stations ps
JOIN wards w ON ps.ward_id = w.id
JOIN constituencies c ON w.constituency_id = c.id
JOIN counties co ON c.county_id = co.id
WHERE ps.registered_voters_2022 IS NOT NULL AND ps.registered_voters_2022 > 0
  AND ps.ward_id = ANY(%s)
ORDER BY ps.code
"""

UPsert_SQL = """
WITH norm AS (
  SELECT
    ps_code,
    ps_name,
    voters,
    lpad(county_code, 3, '0') AS county_code3,
    lpad(const_code, 3, '0')   AS const_code3,
    CASE WHEN ward_code LIKE '%-%' THEN ward_code
         ELSE lpad(const_code, 3, '0') || '-' || lpad(ward_code, 4, '0')
    END AS ward_code_norm
  FROM staging_ps_local
),
joined AS (
  SELECT n.ps_code, n.ps_name, n.voters,
         co.id AS county_id, c.id AS constituency_id, w.id AS ward_id
  FROM norm n
  JOIN counties co ON (co.code = n.county_code3 OR lpad(co.code, 3, '0') = n.county_code3)
  JOIN constituencies c ON (c.code = n.const_code3 OR lpad(c.code, 3, '0') = n.const_code3)
  JOIN wards w ON w.code = n.ward_code_norm
)
INSERT INTO polling_stations (code, name, ward_id, constituency_id, county_id, registered_voters_2022)
SELECT ps_code, ps_name, ward_id, constituency_id, county_id, voters FROM joined
ON CONFLICT (code) DO UPDATE SET
  registered_voters_2022 = EXCLUDED.registered_voters_2022,
  ward_id = EXCLUDED.ward_id,
  constituency_id = EXCLUDED.constituency_id,
  county_id = EXCLUDED.county_id,
  name = EXCLUDED.name,
  updated_at = CURRENT_TIMESTAMP;
"""

def main():
    print("🚀 Copy LOCAL → PRODUCTION (polling_stations)")

    # Fetch from local
    try:
        lconn = psycopg2.connect(**LOCAL_DB)
        lcur = lconn.cursor()
        if WARDS_TO_COPY:
            # Find ward ids for given names in Nairobi
            lcur.execute(
                """
                SELECT w.id, w.name
                FROM wards w
                JOIN constituencies c ON w.constituency_id=c.id
                WHERE c.county_id = 188 AND UPPER(w.name) = ANY(%s)
                """,
                (list(map(str.upper, WARDS_TO_COPY)),)
            )
            ward_rows = lcur.fetchall()
            ward_ids = [r[0] for r in ward_rows]
            print(f"🎯 Local target wards: {[r[1] for r in ward_rows]} (ids: {ward_ids})")
            if not ward_ids:
                print("⚠️  No matching wards found locally. Aborting targeted copy.")
                return
            lcur.execute(FETCH_BY_WARD_IDS_SQL, (ward_ids,))
        else:
            lcur.execute(FETCH_ALL_SQL)
        rows = lcur.fetchall()
        print(f"📥 Local rows fetched: {len(rows):,}")
    except Exception as e:
        print(f"❌ Local fetch failed: {e}")
        return
    finally:
        try:
            lcur.close(); lconn.close()
        except Exception:
            pass

    # Connect to production
    try:
        pconn = psycopg2.connect(**PROD_DB)
        pconn.autocommit = False
        pcur = pconn.cursor()
        pcur.execute("SET LOCAL synchronous_commit TO OFF;")
        print("✅ Connected to production")
    except Exception as e:
        print(f"❌ Production connect failed: {e}")
        return

    # Initial count
    pcur.execute("SELECT COUNT(*) FROM polling_stations")
    initial = pcur.fetchone()[0]
    print(f"📊 Production polling_stations before: {initial:,}")

    # Create staging
    pcur.execute("DROP TABLE IF EXISTS staging_ps_local;")
    pcur.execute(
        """
        CREATE TEMP TABLE staging_ps_local (
          ps_code text,
          ps_name text,
          voters integer,
          ward_code text,
          const_code text,
          county_code text
        );
        """
    )

    # Bulk stage
    import re
    filtered = []
    for (code, name, voters, ward_code, const_code, county_code) in rows:
        if code and len(code) <= 20 and re.fullmatch(r"\d{15}", code):
            filtered.append((code, name, voters, ward_code, const_code, county_code))
    print(f"Filtered valid codes (15-digit): {len(filtered):,}")
    execute_values(pcur,
        "INSERT INTO staging_ps_local (ps_code, ps_name, voters, ward_code, const_code, county_code) VALUES %s",
        filtered, page_size=10000
    )

    # Upsert
    print("🗳️  Upserting to production...")
    pcur.execute(UPsert_SQL)
    pconn.commit()

    # Final count
    pcur.execute("SELECT COUNT(*) FROM polling_stations")
    final = pcur.fetchone()[0]
    print(f"✅ Done. After: {final:,} (Δ {final-initial:,})")

    pcur.close(); pconn.close()

if __name__ == "__main__":
    main()

