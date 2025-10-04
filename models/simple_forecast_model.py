"""
Simplified Bayesian Forecasting Model for KenPoliMarket
Uses historical data to generate probabilistic forecasts for 2027 election
"""
import pandas as pd
import numpy as np
from pathlib import Path
import sys
import argparse
from datetime import datetime

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

def load_data():
    """Load prepared training data"""
    data_dir = Path(__file__).parent.parent / 'data' / 'processed'
    
    county_data = pd.read_csv(data_dir / 'model_county_data.csv')
    ethnicity_data = pd.read_csv(data_dir / 'model_ethnicity_data.csv')
    historical_results = pd.read_csv(data_dir / 'model_historical_results.csv')
    
    return county_data, ethnicity_data, historical_results

def calculate_historical_trends(historical_results):
    """Calculate trends from historical data"""
    # Group by county and candidate
    county_trends = historical_results.groupby(['county_code', 'candidate_name', 'party']).agg({
        'votes': 'mean',
        'turnout': 'mean'
    }).reset_index()
    
    # Calculate vote share per county
    total_votes_per_county = historical_results.groupby('county_code')['votes'].sum().reset_index()
    total_votes_per_county.columns = ['county_code', 'total_votes']
    
    county_trends = county_trends.merge(total_votes_per_county, on='county_code')
    county_trends['vote_share'] = (county_trends['votes'] / county_trends['total_votes']) * 100
    
    return county_trends

def generate_forecasts_2027(county_data, historical_results, n_samples=1000):
    """
    Generate probabilistic forecasts for 2027 election
    
    Uses a simplified Bayesian approach:
    - Historical vote shares as prior
    - Uncertainty from historical variance
    - Random sampling for credible intervals
    """
    print("\n" + "=" * 60)
    print("🔮 GENERATING 2027 FORECASTS")
    print("=" * 60)
    
    # Get unique candidates from historical data
    candidates = historical_results[['candidate_name', 'party']].drop_duplicates()
    
    # For 2027, we'll project based on 2022 results with uncertainty
    results_2022 = historical_results[historical_results['election_year'] == 2022]
    
    forecasts = []
    
    for _, county in county_data.iterrows():
        county_code = county['code']
        county_name = county['name']
        
        # Get 2022 results for this county
        county_results_2022 = results_2022[results_2022['county_code'] == county_code]
        
        if len(county_results_2022) == 0:
            continue
        
        # Base turnout on 2022 with some uncertainty
        turnout_2022 = county_results_2022['turnout'].mean()
        
        # Generate samples for turnout (normal distribution with std=5%)
        turnout_samples = np.random.normal(turnout_2022, 5, n_samples)
        turnout_samples = np.clip(turnout_samples, 40, 95)  # Realistic bounds
        
        # Calculate mean and credible intervals for turnout
        turnout_mean = np.mean(turnout_samples)
        turnout_lower = np.percentile(turnout_samples, 5)  # 90% CI
        turnout_upper = np.percentile(turnout_samples, 95)
        
        # For each candidate, project vote share
        for _, candidate_row in county_results_2022.iterrows():
            candidate_name = candidate_row['candidate_name']
            party = candidate_row['party']
            vote_share_2022 = (candidate_row['votes'] / candidate_row['total_votes_cast']) * 100
            
            # Generate samples for vote share (normal with std=3%)
            vote_share_samples = np.random.normal(vote_share_2022, 3, n_samples)
            vote_share_samples = np.clip(vote_share_samples, 0, 100)
            
            # Calculate statistics
            vote_share_mean = np.mean(vote_share_samples)
            vote_share_lower = np.percentile(vote_share_samples, 5)
            vote_share_upper = np.percentile(vote_share_samples, 95)
            
            # Estimate votes based on registered voters
            registered_voters = county['registered_voters_2022']
            expected_votes = (registered_voters * turnout_mean / 100) * (vote_share_mean / 100)
            
            forecasts.append({
                'county_code': county_code,
                'county_name': county_name,
                'candidate_name': candidate_name,
                'party': party,
                'predicted_vote_share': vote_share_mean,
                'vote_share_lower_90': vote_share_lower,
                'vote_share_upper_90': vote_share_upper,
                'predicted_turnout': turnout_mean,
                'turnout_lower_90': turnout_lower,
                'turnout_upper_90': turnout_upper,
                'predicted_votes': int(expected_votes),
                'registered_voters': registered_voters
            })
    
    forecasts_df = pd.DataFrame(forecasts)
    
    print(f"\n✅ Generated {len(forecasts_df)} county-level forecasts")
    print(f"   📍 Counties: {forecasts_df['county_code'].nunique()}")
    print(f"   👥 Candidates: {forecasts_df['candidate_name'].nunique()}")
    
    # Display summary
    print("\n📊 National Forecast Summary:")
    national_summary = forecasts_df.groupby(['candidate_name', 'party']).agg({
        'predicted_votes': 'sum',
        'predicted_vote_share': 'mean'
    }).reset_index()
    
    total_votes = national_summary['predicted_votes'].sum()
    national_summary['national_vote_share'] = (national_summary['predicted_votes'] / total_votes) * 100
    
    for _, row in national_summary.iterrows():
        print(f"   - {row['candidate_name']} ({row['party']}): {row['national_vote_share']:.1f}%")
    
    return forecasts_df

def save_forecasts(forecasts_df, output_file='forecasts_2027.csv'):
    """Save forecasts to CSV"""
    output_path = Path(__file__).parent.parent / 'data' / 'processed' / output_file
    forecasts_df.to_csv(output_path, index=False)
    
    print(f"\n💾 Forecasts saved to: {output_path}")
    return output_path

def main():
    parser = argparse.ArgumentParser(description='Generate 2027 election forecasts')
    parser.add_argument('--samples', type=int, default=1000, help='Number of Monte Carlo samples')
    parser.add_argument('--output', type=str, default='forecasts_2027.csv', help='Output filename')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🇰🇪 KENPOLIMARKET FORECASTING MODEL")
    print("=" * 60)
    print(f"📅 Run time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎲 Monte Carlo samples: {args.samples}")
    
    # Load data
    print("\n📂 Loading data...")
    county_data, ethnicity_data, historical_results = load_data()
    print(f"   ✅ {len(county_data)} counties")
    print(f"   ✅ {len(ethnicity_data)} ethnicity aggregates")
    print(f"   ✅ {len(historical_results)} historical results")
    
    # Generate forecasts
    forecasts_df = generate_forecasts_2027(county_data, historical_results, n_samples=args.samples)
    
    # Save forecasts
    output_path = save_forecasts(forecasts_df, args.output)
    
    print("\n" + "=" * 60)
    print("✅ FORECASTING COMPLETE!")
    print("=" * 60)
    print(f"\n📁 Output file: {output_path}")
    print(f"📊 Total forecasts: {len(forecasts_df)}")
    print("\n🎯 Next steps:")
    print("   1. Run: python models/store_forecasts.py")
    print("   2. View forecasts in dashboard: http://localhost:3000/forecasts")
    
    return forecasts_df

if __name__ == '__main__':
    main()

