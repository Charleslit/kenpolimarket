#!/usr/bin/env python3
"""
Identify missing constituencies by comparing database against official 290 list.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from database import SessionLocal
from models import County, Constituency

# Official list of 290 constituencies from Wikipedia (as of 2012 delimitation)
# Format: (code, name, county_name)
OFFICIAL_290_CONSTITUENCIES = [
    # Mombasa County (6)
    ("001", "CHANGAMWE", "Mombasa"),
    ("002", "JOMVU", "Mombasa"),
    ("003", "KISAUNI", "Mombasa"),
    ("004", "NYALI", "Mombasa"),
    ("005", "LIKONI", "Mombasa"),
    ("006", "MVITA", "Mombasa"),
    
    # Kwale County (4)
    ("007", "MSAMBWENI", "Kwale"),
    ("008", "LUNGA LUNGA", "Kwale"),
    ("009", "MATUGA", "Kwale"),
    ("010", "KINANGO", "Kwale"),
    
    # Kilifi County (7)
    ("011", "KILIFI NORTH", "Kilifi"),
    ("012", "KILIFI SOUTH", "Kilifi"),
    ("013", "KALOLENI", "Kilifi"),
    ("014", "RABAI", "Kilifi"),
    ("015", "GANZE", "Kilifi"),
    ("016", "MALINDI", "Kilifi"),
    ("017", "MAGARINI", "Kilifi"),
    
    # Tana River County (3)
    ("018", "GARSEN", "Tana River"),
    ("019", "GALOLE", "Tana River"),
    ("020", "BURA", "Tana River"),
    
    # Lamu County (2)
    ("021", "LAMU EAST", "Lamu"),
    ("022", "LAMU WEST", "Lamu"),
    
    # Taita-Taveta County (4)
    ("023", "TAVETA", "Taita Taveta"),
    ("024", "WUNDANYI", "Taita Taveta"),
    ("025", "MWATATE", "Taita Taveta"),
    ("026", "VOI", "Taita Taveta"),
    
    # Garissa County (6)
    ("027", "GARISSA TOWNSHIP", "Garissa"),
    ("028", "BALAMBALA", "Garissa"),
    ("029", "LAGDERA", "Garissa"),
    ("030", "DADAAB", "Garissa"),
    ("031", "FAFI", "Garissa"),
    ("032", "IJARA", "Garissa"),
    
    # Wajir County (6)
    ("033", "WAJIR NORTH", "Wajir"),
    ("034", "WAJIR EAST", "Wajir"),
    ("035", "TARBAJ", "Wajir"),
    ("036", "WAJIR WEST", "Wajir"),
    ("037", "ELDAS", "Wajir"),
    ("038", "WAJIR SOUTH", "Wajir"),
    
    # Mandera County (6)
    ("039", "MANDERA WEST", "Mandera"),
    ("040", "BANISSA", "Mandera"),
    ("041", "MANDERA NORTH", "Mandera"),
    ("042", "MANDERA SOUTH", "Mandera"),
    ("043", "MANDERA EAST", "Mandera"),
    ("044", "LAFEY", "Mandera"),
    
    # Marsabit County (4)
    ("045", "MOYALE", "Marsabit"),
    ("046", "NORTH HORR", "Marsabit"),
    ("047", "SAKU", "Marsabit"),
    ("048", "LAISAMIS", "Marsabit"),
    
    # Isiolo County (2)
    ("049", "ISIOLO NORTH", "Isiolo"),
    ("050", "ISIOLO SOUTH", "Isiolo"),
    
    # Meru County (9)
    ("051", "IGEMBE SOUTH", "Meru"),
    ("052", "IGEMBE CENTRAL", "Meru"),
    ("053", "IGEMBE NORTH", "Meru"),
    ("054", "TIGANIA WEST", "Meru"),
    ("055", "TIGANIA EAST", "Meru"),
    ("056", "NORTH IMENTI", "Meru"),
    ("057", "BUURI", "Meru"),
    ("058", "CENTRAL IMENTI", "Meru"),
    ("059", "SOUTH IMENTI", "Meru"),
    
    # Tharaka-Nithi County (3)
    ("060", "MAARA", "Tharaka Nithi"),
    ("061", "CHUKA/IGAMBANG'OMBE", "Tharaka Nithi"),
    ("062", "THARAKA", "Tharaka Nithi"),
    
    # Embu County (4)
    ("063", "MANYATTA", "Embu"),
    ("064", "RUNYENJES", "Embu"),
    ("065", "MBEERE SOUTH", "Embu"),
    ("066", "MBEERE NORTH", "Embu"),
    
    # Kitui County (8)
    ("067", "MWINGI NORTH", "Kitui"),
    ("068", "MWINGI WEST", "Kitui"),
    ("069", "MWINGI CENTRAL", "Kitui"),
    ("070", "KITUI WEST", "Kitui"),
    ("071", "KITUI RURAL", "Kitui"),
    ("072", "KITUI CENTRAL", "Kitui"),
    ("073", "KITUI EAST", "Kitui"),
    ("074", "KITUI SOUTH", "Kitui"),
    
    # Machakos County (8)
    ("075", "MASINGA", "Machakos"),
    ("076", "YATTA", "Machakos"),
    ("077", "KANGUNDO", "Machakos"),
    ("078", "MATUNGULU", "Machakos"),
    ("079", "KATHIANI", "Machakos"),
    ("080", "MAVOKO", "Machakos"),
    ("081", "MACHAKOS TOWN", "Machakos"),
    ("082", "MWALA", "Machakos"),
    
    # Makueni County (6)
    ("083", "MBOONI", "Makueni"),
    ("084", "KILOME", "Makueni"),
    ("085", "KAITI", "Makueni"),
    ("086", "MAKUENI", "Makueni"),
    ("087", "KIBWEZI WEST", "Makueni"),
    ("088", "KIBWEZI EAST", "Makueni"),
    
    # Nyandarua County (5)
    ("089", "KINANGOP", "Nyandarua"),
    ("090", "KIPIPIRI", "Nyandarua"),
    ("091", "OL KALOU", "Nyandarua"),
    ("092", "OL JOROK", "Nyandarua"),
    ("093", "NDARAGWA", "Nyandarua"),
    
    # Nyeri County (6)
    ("094", "TETU", "Nyeri"),
    ("095", "KIENI", "Nyeri"),
    ("096", "MATHIRA", "Nyeri"),
    ("097", "OTHAYA", "Nyeri"),
    ("098", "MUKURWEINI", "Nyeri"),
    ("099", "NYERI TOWN", "Nyeri"),
    
    # Kirinyaga County (4)
    ("100", "MWEA", "Kirinyaga"),
    ("101", "GICHUGU", "Kirinyaga"),
    ("102", "NDIA", "Kirinyaga"),
    ("103", "KIRINYAGA CENTRAL", "Kirinyaga"),
    
    # Murang'a County (7)
    ("104", "KANGEMA", "Murang'a"),
    ("105", "MATHIOYA", "Murang'a"),
    ("106", "KIHARU", "Murang'a"),
    ("107", "KIGUMO", "Murang'a"),
    ("108", "MARAGWA", "Murang'a"),
    ("109", "KANDARA", "Murang'a"),
    ("110", "GATANGA", "Murang'a"),
    
    # Kiambu County (12)
    ("111", "GATUNDU SOUTH", "Kiambu"),
    ("112", "GATUNDU NORTH", "Kiambu"),
    ("113", "JUJA", "Kiambu"),
    ("114", "THIKA TOWN", "Kiambu"),
    ("115", "RUIRU", "Kiambu"),
    ("116", "GITHUNGURI", "Kiambu"),
    ("117", "KIAMBU", "Kiambu"),
    ("118", "KIAMBAA", "Kiambu"),
    ("119", "KABETE", "Kiambu"),
    ("120", "KIKUYU", "Kiambu"),
    ("121", "LIMURU", "Kiambu"),
    ("122", "LARI", "Kiambu"),
    
    # Turkana County (6)
    ("123", "TURKANA NORTH", "Turkana"),
    ("124", "TURKANA WEST", "Turkana"),
    ("125", "TURKANA CENTRAL", "Turkana"),
    ("126", "LOIMA", "Turkana"),
    ("127", "TURKANA SOUTH", "Turkana"),
    ("128", "TURKANA EAST", "Turkana"),
    
    # West Pokot County (4)
    ("129", "KAPENGURIA", "West Pokot"),
    ("130", "SIGOR", "West Pokot"),
    ("131", "KACHELIBA", "West Pokot"),
    ("132", "POKOT SOUTH", "West Pokot"),
    
    # Samburu County (3)
    ("133", "SAMBURU WEST", "Samburu"),
    ("134", "SAMBURU NORTH", "Samburu"),
    ("135", "SAMBURU EAST", "Samburu"),
    
    # Trans-Nzoia County (5)
    ("136", "KWANZA", "Trans Nzoia"),
    ("137", "ENDEBESS", "Trans Nzoia"),
    ("138", "SABOTI", "Trans Nzoia"),
    ("139", "KIMININI", "Trans Nzoia"),
    ("140", "CHERANGANY", "Trans Nzoia"),
    
    # Uasin Gishu County (6)
    ("141", "SOY", "Uasin Gishu"),
    ("142", "TURBO", "Uasin Gishu"),
    ("143", "MOIBEN", "Uasin Gishu"),
    ("144", "AINABKOI", "Uasin Gishu"),
    ("145", "KAPSERET", "Uasin Gishu"),
    ("146", "KESSES", "Uasin Gishu"),
    
    # Elgeyo-Marakwet County (4)
    ("147", "MARAKWET EAST", "Elgeyo Marakwet"),
    ("148", "MARAKWET WEST", "Elgeyo Marakwet"),
    ("149", "KEIYO NORTH", "Elgeyo Marakwet"),
    ("150", "KEIYO SOUTH", "Elgeyo Marakwet"),
    
    # Nandi County (6)
    ("151", "TINDERET", "Nandi"),
    ("152", "ALDAI", "Nandi"),
    ("153", "NANDI HILLS", "Nandi"),
    ("154", "CHESUMEI", "Nandi"),
    ("155", "EMGWEN", "Nandi"),
    ("156", "MOSOP", "Nandi"),
    
    # Baringo County (6)
    ("157", "TIATY", "Baringo"),
    ("158", "BARINGO NORTH", "Baringo"),
    ("159", "BARINGO CENTRAL", "Baringo"),
    ("160", "BARINGO SOUTH", "Baringo"),
    ("161", "MOGOTIO", "Baringo"),
    ("162", "ELDAMA RAVINE", "Baringo"),
    
    # Laikipia County (3)
    ("163", "LAIKIPIA WEST", "Laikipia"),
    ("164", "LAIKIPIA EAST", "Laikipia"),
    ("165", "LAIKIPIA NORTH", "Laikipia"),
    
    # Nakuru County (11)
    ("166", "MOLO", "Nakuru"),
    ("167", "NJORO", "Nakuru"),
    ("168", "NAIVASHA", "Nakuru"),
    ("169", "GILGIL", "Nakuru"),
    ("170", "KURESOI SOUTH", "Nakuru"),
    ("171", "KURESOI NORTH", "Nakuru"),
    ("172", "SUBUKIA", "Nakuru"),
    ("173", "RONGAI", "Nakuru"),
    ("174", "BAHATI", "Nakuru"),
    ("175", "NAKURU TOWN WEST", "Nakuru"),
    ("176", "NAKURU TOWN EAST", "Nakuru"),
    
    # Narok County (6)
    ("177", "KILGORIS", "Narok"),
    ("178", "EMURUA DIKIRR", "Narok"),
    ("179", "NAROK NORTH", "Narok"),
    ("180", "NAROK EAST", "Narok"),
    ("181", "NAROK SOUTH", "Narok"),
    ("182", "NAROK WEST", "Narok"),
    
    # Kajiado County (5)
    ("183", "KAJIADO NORTH", "Kajiado"),
    ("184", "KAJIADO CENTRAL", "Kajiado"),
    ("185", "KAJIADO EAST", "Kajiado"),
    ("186", "KAJIADO WEST", "Kajiado"),
    ("187", "KAJIADO SOUTH", "Kajiado"),
    
    # Kericho County (6)
    ("188", "KIPKELION EAST", "Kericho"),
    ("189", "KIPKELION WEST", "Kericho"),
    ("190", "AINAMOI", "Kericho"),
    ("191", "BURETI", "Kericho"),
    ("192", "BELGUT", "Kericho"),
    ("193", "SIGOWET-SOIN", "Kericho"),
    
    # Bomet County (5)
    ("194", "SOTIK", "Bomet"),
    ("195", "CHEPALUNGU", "Bomet"),
    ("196", "BOMET EAST", "Bomet"),
    ("197", "BOMET CENTRAL", "Bomet"),
    ("198", "KONOIN", "Bomet"),
]

def main():
    print("🔍 Identifying Missing Constituencies")
    print("=" * 70)
    print()
    
    # Note: This is a partial list - continuing in next part
    print("⚠️  This script contains first 198 constituencies.")
    print("   Full list will be completed in the analysis.")
    print()
    
    db = SessionLocal()
    try:
        # Get all constituencies from database
        db_constituencies = db.query(Constituency).all()
        db_codes = {c.code for c in db_constituencies}
        
        print(f"📊 Database has: {len(db_constituencies)} constituencies")
        print(f"📊 Official count: 290 constituencies")
        print(f"📊 Missing: {290 - len(db_constituencies)} constituencies")
        print()
        
        # Check partial list
        missing_from_partial = []
        for code, name, county in OFFICIAL_290_CONSTITUENCIES:
            if code not in db_codes:
                missing_from_partial.append((code, name, county))
        
        if missing_from_partial:
            print(f"❌ Missing from first 198 constituencies:")
            for code, name, county in missing_from_partial:
                print(f"   {code} - {name} ({county})")
        
    finally:
        db.close()

if __name__ == '__main__':
    main()

