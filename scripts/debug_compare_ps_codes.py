import psycopg2

lcfg={'host':'localhost','port':5433,'database':'kenpolimarket','user':'kenpolimarket','password':'password'}
pcfg={'host':'35.227.164.209','port':5432,'database':'kenpolimarket','user':'kenpolimarket','password':'bC41dQ7drjIr5Fa7iWfxNoPjHLmyEUzV','sslmode':'require'}

lc=psycopg2.connect(**lcfg)
pc=psycopg2.connect(**pcfg)

lcur=lc.cursor(); pcur=pc.cursor()
lcur.execute("""
SELECT ps.code, ps.name
FROM polling_stations ps
JOIN wards w ON ps.ward_id=w.id
JOIN constituencies c ON w.constituency_id=c.id
WHERE c.county_id=188
ORDER BY ps.code
LIMIT 25
""")
rows=lcur.fetchall()
print('Sample local Nairobi codes:', len(rows))
missing=[]; present=[]
for code,name in rows:
    pcur.execute('SELECT 1 FROM polling_stations WHERE code=%s', (code,))
    if pcur.fetchone():
        present.append(code)
    else:
        missing.append((code,name))
print('Present in prod:', len(present))
print('Missing in prod sample:', len(missing))
for m in missing[:5]:
    print('  missing:', m)

# Inspect first missing to see codes mapping
if missing:
    code0, _ = missing[0]
    lcur=lc.cursor(); pcur=pc.cursor()
    lcur.execute("""
    SELECT ps.code, w.code AS ward_code, c.code AS const_code, co.code AS county_code
    FROM polling_stations ps
    JOIN wards w ON ps.ward_id=w.id
    JOIN constituencies c ON w.constituency_id=c.id
    JOIN counties co ON c.county_id=co.id
    WHERE ps.code=%s
    """, (code0,))
    row = lcur.fetchone()
    if row:
        _, ward_code, const_code, county_code = row
        print('Local mapping -> ward:', ward_code, 'const:', const_code, 'county:', county_code)
        pcur.execute('SELECT 1 FROM wards WHERE code=%s', (ward_code,))
        print('Prod has ward?', bool(pcur.fetchone()))
        pcur.execute('SELECT 1 FROM constituencies WHERE code=%s', (const_code,))
        print('Prod has constituency?', bool(pcur.fetchone()))
        pcur.execute('SELECT 1 FROM counties WHERE code=%s', (county_code,))
        print('Prod has county?', bool(pcur.fetchone()))
    lcur.close(); pcur.close()

lcur.close(); pcur.close(); lc.close(); pc.close()

