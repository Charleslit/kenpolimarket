#!/usr/bin/env python3
"""
Generate Sample Data for KenPoliMarket
Creates realistic sample data based on actual Kenya election patterns
This allows development and testing without requiring actual IEBC/KNBS PDFs
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json

# Kenya's 47 counties with realistic data
COUNTIES = [
    {"code": "001", "name": "Mombasa", "population": 1208333, "urban_pct": 95.0, "youth_pct": 35.2},
    {"code": "002", "name": "Kwale", "population": 866820, "urban_pct": 15.3, "youth_pct": 38.5},
    {"code": "003", "name": "Kilifi", "population": 1453787, "urban_pct": 18.7, "youth_pct": 39.1},
    {"code": "004", "name": "Tana River", "population": 315943, "urban_pct": 12.1, "youth_pct": 40.2},
    {"code": "005", "name": "Lamu", "population": 143920, "urban_pct": 25.4, "youth_pct": 37.8},
    {"code": "006", "name": "Taita Taveta", "population": 340671, "urban_pct": 22.6, "youth_pct": 36.4},
    {"code": "007", "name": "Garissa", "population": 841353, "urban_pct": 35.2, "youth_pct": 42.1},
    {"code": "008", "name": "Wajir", "population": 781263, "urban_pct": 18.9, "youth_pct": 43.5},
    {"code": "009", "name": "Mandera", "population": 1200890, "urban_pct": 20.3, "youth_pct": 44.2},
    {"code": "010", "name": "Marsabit", "population": 459785, "urban_pct": 16.7, "youth_pct": 41.3},
    {"code": "011", "name": "Isiolo", "population": 268002, "urban_pct": 42.1, "youth_pct": 39.7},
    {"code": "012", "name": "Meru", "population": 1545714, "urban_pct": 18.4, "youth_pct": 36.8},
    {"code": "013", "name": "Tharaka Nithi", "population": 393177, "urban_pct": 14.2, "youth_pct": 35.9},
    {"code": "014", "name": "Embu", "population": 608599, "urban_pct": 19.8, "youth_pct": 34.7},
    {"code": "015", "name": "Kitui", "population": 1136187, "urban_pct": 12.5, "youth_pct": 37.2},
    {"code": "016", "name": "Machakos", "population": 1421932, "urban_pct": 23.6, "youth_pct": 36.1},
    {"code": "017", "name": "Makueni", "population": 987653, "urban_pct": 11.8, "youth_pct": 37.5},
    {"code": "018", "name": "Nyandarua", "population": 638289, "urban_pct": 13.7, "youth_pct": 33.2},
    {"code": "019", "name": "Nyeri", "population": 759164, "urban_pct": 24.5, "youth_pct": 32.8},
    {"code": "020", "name": "Kirinyaga", "population": 610411, "urban_pct": 16.9, "youth_pct": 33.5},
    {"code": "021", "name": "Murang'a", "population": 1056640, "urban_pct": 15.2, "youth_pct": 33.9},
    {"code": "022", "name": "Kiambu", "population": 2417735, "urban_pct": 52.3, "youth_pct": 34.6},
    {"code": "023", "name": "Turkana", "population": 926976, "urban_pct": 17.8, "youth_pct": 42.8},
    {"code": "024", "name": "West Pokot", "population": 621241, "urban_pct": 11.4, "youth_pct": 41.5},
    {"code": "025", "name": "Samburu", "population": 310327, "urban_pct": 13.6, "youth_pct": 40.9},
    {"code": "026", "name": "Trans Nzoia", "population": 990341, "urban_pct": 19.7, "youth_pct": 38.3},
    {"code": "027", "name": "Uasin Gishu", "population": 1163186, "urban_pct": 32.4, "youth_pct": 37.1},
    {"code": "028", "name": "Elgeyo Marakwet", "population": 454480, "urban_pct": 12.9, "youth_pct": 38.7},
    {"code": "029", "name": "Nandi", "population": 885711, "urban_pct": 14.3, "youth_pct": 39.2},
    {"code": "030", "name": "Baringo", "population": 666763, "urban_pct": 15.8, "youth_pct": 40.1},
    {"code": "031", "name": "Laikipia", "population": 518560, "urban_pct": 28.7, "youth_pct": 36.5},
    {"code": "032", "name": "Nakuru", "population": 2162202, "urban_pct": 35.8, "youth_pct": 35.9},
    {"code": "033", "name": "Narok", "population": 1157873, "urban_pct": 16.2, "youth_pct": 39.8},
    {"code": "034", "name": "Kajiado", "population": 1117840, "urban_pct": 27.3, "youth_pct": 38.4},
    {"code": "035", "name": "Kericho", "population": 901777, "urban_pct": 17.5, "youth_pct": 37.6},
    {"code": "036", "name": "Bomet", "population": 875689, "urban_pct": 13.1, "youth_pct": 38.9},
    {"code": "037", "name": "Kakamega", "population": 1867579, "urban_pct": 16.4, "youth_pct": 37.8},
    {"code": "038", "name": "Vihiga", "population": 590013, "urban_pct": 11.7, "youth_pct": 36.2},
    {"code": "039", "name": "Bungoma", "population": 1670570, "urban_pct": 14.8, "youth_pct": 38.6},
    {"code": "040", "name": "Busia", "population": 893681, "urban_pct": 13.5, "youth_pct": 39.4},
    {"code": "041", "name": "Siaya", "population": 993183, "urban_pct": 12.3, "youth_pct": 37.3},
    {"code": "042", "name": "Kisumu", "population": 1155574, "urban_pct": 56.7, "youth_pct": 36.7},
    {"code": "043", "name": "Homa Bay", "population": 1131950, "urban_pct": 14.6, "youth_pct": 38.1},
    {"code": "044", "name": "Migori", "population": 1116436, "urban_pct": 15.9, "youth_pct": 39.3},
    {"code": "045", "name": "Kisii", "population": 1266860, "urban_pct": 17.2, "youth_pct": 37.4},
    {"code": "046", "name": "Nyamira", "population": 605576, "urban_pct": 12.8, "youth_pct": 36.9},
    {"code": "047", "name": "Nairobi", "population": 4397073, "urban_pct": 100.0, "youth_pct": 38.2},
]

# Major ethnic groups in Kenya (for aggregate county-level data only)
ETHNIC_GROUPS = [
    "Kikuyu", "Luhya", "Kalenjin", "Luo", "Kamba",
    "Somali", "Kisii", "Mijikenda", "Meru", "Turkana",
    "Maasai", "Embu", "Taita", "Other"
]


def generate_county_data():
    """Generate county-level data"""
    print("📊 Generating county data...")
    
    df = pd.DataFrame(COUNTIES)
    
    # Add additional calculated fields
    df['registered_voters_2022'] = (df['population'] * 0.65 * np.random.uniform(0.95, 1.05, len(df))).astype(int)
    df['registered_voters_2017'] = (df['registered_voters_2022'] * 0.92).astype(int)
    
    # Save to CSV
    output_path = Path("data/processed/counties.csv")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    
    print(f"✅ Generated {len(df)} counties → {output_path}")
    return df


def generate_election_results_2022(counties_df):
    """Generate 2022 presidential election results"""
    print("📊 Generating 2022 election results...")
    
    results = []
    
    for _, county in counties_df.iterrows():
        registered = county['registered_voters_2022']
        
        # Turnout varies by county (higher in urban areas)
        base_turnout = 0.65
        urban_effect = (county['urban_pct'] / 100) * 0.05
        turnout_pct = base_turnout + urban_effect + np.random.normal(0, 0.05)
        turnout_pct = np.clip(turnout_pct, 0.45, 0.85)
        
        votes_cast = int(registered * turnout_pct)
        
        # Simulate candidate vote shares (based on 2022 actual patterns)
        # Ruto vs Raila with regional variations
        if county['name'] in ['Nairobi', 'Kiambu', 'Nakuru', 'Uasin Gishu', 'Nandi', 'Elgeyo Marakwet']:
            # Ruto strongholds
            ruto_share = np.random.uniform(0.55, 0.75)
        elif county['name'] in ['Kisumu', 'Siaya', 'Homa Bay', 'Migori', 'Busia']:
            # Raila strongholds
            ruto_share = np.random.uniform(0.15, 0.35)
        else:
            # Competitive counties
            ruto_share = np.random.uniform(0.45, 0.60)
        
        raila_share = 1 - ruto_share - np.random.uniform(0.01, 0.03)  # Small margin for others
        
        results.append({
            'county_code': county['code'],
            'county_name': county['name'],
            'election_year': 2022,
            'registered_voters': registered,
            'votes_cast': votes_cast,
            'turnout_percentage': round(turnout_pct * 100, 2),
            'ruto_votes': int(votes_cast * ruto_share),
            'raila_votes': int(votes_cast * raila_share),
            'other_votes': votes_cast - int(votes_cast * ruto_share) - int(votes_cast * raila_share),
        })
    
    df = pd.DataFrame(results)
    
    # Save to CSV
    output_path = Path("data/processed/election_results_2022.csv")
    df.to_csv(output_path, index=False)
    
    # Print summary
    total_registered = df['registered_voters'].sum()
    total_cast = df['votes_cast'].sum()
    national_turnout = (total_cast / total_registered) * 100
    total_ruto = df['ruto_votes'].sum()
    total_raila = df['raila_votes'].sum()
    
    print(f"✅ Generated 2022 results → {output_path}")
    print(f"   National turnout: {national_turnout:.2f}%")
    print(f"   Ruto: {total_ruto:,} ({total_ruto/total_cast*100:.2f}%)")
    print(f"   Raila: {total_raila:,} ({total_raila/total_cast*100:.2f}%)")
    
    return df


def generate_ethnicity_aggregates(counties_df):
    """
    Generate county-level ethnicity aggregates (PRIVACY-PRESERVING)
    Minimum 10 individuals per group, county-level only
    """
    print("📊 Generating ethnicity aggregates (privacy-preserving)...")
    
    aggregates = []
    suppressed_count = 0
    
    for _, county in counties_df.iterrows():
        population = county['population']
        
        # Simulate ethnic distribution (varies by county)
        # This is highly simplified - real data would come from KNBS
        num_groups = np.random.randint(5, 10)
        selected_groups = np.random.choice(ETHNIC_GROUPS, size=num_groups, replace=False)
        
        # Generate random shares that sum to 1
        shares = np.random.dirichlet(np.ones(num_groups))
        
        for group, share in zip(selected_groups, shares):
            count = int(population * share)
            
            # PRIVACY: Suppress counts below threshold
            if count < 10:
                suppressed_count += 1
                continue
            
            aggregates.append({
                'county_code': county['code'],
                'county_name': county['name'],
                'census_year': 2019,
                'ethnicity_group': group,
                'population_count': count,
                'percentage': round(share * 100, 2),
                'source': 'KNBS 2019 Census (Simulated)'
            })
    
    df = pd.DataFrame(aggregates)
    
    # Verify privacy threshold
    min_count = df['population_count'].min()
    assert min_count >= 10, f"Privacy violation: minimum count is {min_count}"
    
    # Save to CSV
    output_path = Path("data/processed/ethnicity_aggregates.csv")
    df.to_csv(output_path, index=False)
    
    print(f"✅ Generated ethnicity aggregates → {output_path}")
    print(f"   Total aggregates: {len(df)}")
    print(f"   Suppressed (< 10): {suppressed_count}")
    print(f"   Minimum count: {min_count} (✓ Privacy threshold met)")
    
    return df


def generate_2017_results(counties_df):
    """Generate 2017 election results for model validation"""
    print("📊 Generating 2017 election results (for validation)...")
    
    results = []
    
    for _, county in counties_df.iterrows():
        registered = county['registered_voters_2017']
        
        # 2017 had slightly lower turnout
        base_turnout = 0.78
        urban_effect = (county['urban_pct'] / 100) * 0.03
        turnout_pct = base_turnout + urban_effect + np.random.normal(0, 0.04)
        turnout_pct = np.clip(turnout_pct, 0.60, 0.90)
        
        votes_cast = int(registered * turnout_pct)
        
        # 2017 patterns (Uhuru vs Raila)
        if county['name'] in ['Nairobi', 'Kiambu', 'Nakuru', 'Nyeri', 'Murang\'a']:
            uhuru_share = np.random.uniform(0.60, 0.80)
        elif county['name'] in ['Kisumu', 'Siaya', 'Homa Bay', 'Migori']:
            uhuru_share = np.random.uniform(0.10, 0.25)
        else:
            uhuru_share = np.random.uniform(0.45, 0.65)
        
        raila_share = 1 - uhuru_share - np.random.uniform(0.01, 0.02)
        
        results.append({
            'county_code': county['code'],
            'county_name': county['name'],
            'election_year': 2017,
            'registered_voters': registered,
            'votes_cast': votes_cast,
            'turnout_percentage': round(turnout_pct * 100, 2),
            'uhuru_votes': int(votes_cast * uhuru_share),
            'raila_votes': int(votes_cast * raila_share),
            'other_votes': votes_cast - int(votes_cast * uhuru_share) - int(votes_cast * raila_share),
        })
    
    df = pd.DataFrame(results)
    
    output_path = Path("data/processed/election_results_2017.csv")
    df.to_csv(output_path, index=False)
    
    print(f"✅ Generated 2017 results → {output_path}")
    
    return df


def main():
    """Generate all sample data"""
    print("🇰🇪 KenPoliMarket Sample Data Generator")
    print("=" * 60)
    print()
    print("This generates realistic sample data for development/testing")
    print("Based on actual Kenya election patterns and census structure")
    print()
    
    # Generate data
    counties_df = generate_county_data()
    print()
    
    results_2022 = generate_election_results_2022(counties_df)
    print()
    
    results_2017 = generate_2017_results(counties_df)
    print()
    
    ethnicity_df = generate_ethnicity_aggregates(counties_df)
    print()
    
    # Summary
    print("=" * 60)
    print("📋 Summary")
    print("=" * 60)
    print(f"✅ Counties: {len(counties_df)}")
    print(f"✅ 2022 Results: {len(results_2022)} counties")
    print(f"✅ 2017 Results: {len(results_2017)} counties")
    print(f"✅ Ethnicity Aggregates: {len(ethnicity_df)} (privacy-preserving)")
    print()
    print("📁 Output files in: data/processed/")
    print()
    print("📝 Next Steps:")
    print("1. Review generated data: ls -lh data/processed/")
    print("2. Load into database: python etl/scripts/load_sample_data.py")
    print("3. Verify in database: PGPASSWORD=password psql -h localhost -U kenpolimarket -d kenpolimarket")
    print()


if __name__ == "__main__":
    main()

