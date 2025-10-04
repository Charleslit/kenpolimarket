"""
Multi-Candidate Forecasting Model for 2027 Election

This model handles any number of presidential candidates and uses:
- Dirichlet distribution for vote share allocation (ensures shares sum to 100%)
- Historical data as priors
- County-level heterogeneity
- Uncertainty quantification with credible intervals
"""

import numpy as np
import pandas as pd
import argparse
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

def load_historical_data():
    """Load historical election results"""
    try:
        historical = pd.read_csv('../data/processed/model_historical_results.csv')
        return historical
    except FileNotFoundError:
        print("❌ Historical data not found. Run prepare_data.py first.")
        return None


def estimate_candidate_support(historical_data, candidate_name, party):
    """
    Estimate baseline support for a candidate based on historical data

    For new candidates, we use party historical performance or regional patterns
    """

    # Calculate vote percentage if not present
    if 'vote_percentage' not in historical_data.columns:
        historical_data = historical_data.copy()
        historical_data['vote_percentage'] = (
            historical_data['votes'] / historical_data['total_votes_cast'] * 100
        )

    # Try to find historical data for this candidate
    candidate_data = historical_data[
        (historical_data['candidate_name'] == candidate_name) |
        (historical_data['party'] == party)
    ]

    if len(candidate_data) > 0:
        # Use historical performance
        avg_support = candidate_data.groupby('county_code')['vote_percentage'].mean()
        return avg_support
    else:
        # New candidate - use uniform prior or party affiliation
        print(f"   ℹ️  No historical data for {candidate_name} ({party})")
        print(f"      Using uniform prior distribution")
        return None


def generate_multi_candidate_forecast(
    county_data,
    historical_results,
    candidates,
    n_samples=2000,
    election_year=2027
):
    """
    Generate forecasts for multiple candidates using Dirichlet distribution
    
    Parameters:
    -----------
    county_data : DataFrame
        County-level demographic data
    historical_results : DataFrame
        Historical election results
    candidates : list of dict
        List of candidates: [{'name': 'X', 'party': 'Y'}, ...]
    n_samples : int
        Number of Monte Carlo samples
    election_year : int
        Year of election to forecast
    
    Returns:
    --------
    DataFrame with forecasts for all candidates in all counties
    """
    
    forecasts = []
    n_candidates = len(candidates)
    
    print(f"\n🔮 Generating forecasts for {n_candidates} candidates...")
    print(f"   Candidates: {', '.join([c['name'] for c in candidates])}")
    print(f"   Counties: {len(county_data)}")
    print(f"   Samples: {n_samples:,}")
    
    for idx, county in county_data.iterrows():
        county_code = county['code']
        county_name = county['name']
        registered_voters = county['registered_voters_2022']
        
        # Get historical data for this county
        county_historical = historical_results[
            historical_results['county_code'] == county_code
        ]
        
        # Estimate turnout based on 2022
        turnout_2022 = county_historical[
            county_historical['election_year'] == 2022
        ]['turnout'].values

        if len(turnout_2022) > 0:
            base_turnout = turnout_2022[0]
        else:
            base_turnout = 65.0  # National average
        
        # Generate turnout samples
        turnout_samples = np.random.normal(base_turnout, 5, n_samples)
        turnout_samples = np.clip(turnout_samples, 40, 95)
        predicted_turnout = np.mean(turnout_samples)
        
        # Estimate support for each candidate
        # Use Dirichlet distribution to ensure vote shares sum to 100%
        
        # Build concentration parameters (alpha) for Dirichlet
        alphas = []
        
        for candidate in candidates:
            # Get historical support for this candidate/party
            support = estimate_candidate_support(
                county_historical,
                candidate['name'],
                candidate['party']
            )
            
            if support is not None and county_code in support.index:
                # Use historical support as prior
                base_support = support[county_code]
            else:
                # New candidate - use uniform prior
                base_support = 100.0 / n_candidates
            
            # Convert to Dirichlet concentration parameter
            # Higher alpha = more concentrated around this value
            alpha = max(base_support / 10.0, 1.0)  # Scale and ensure > 0
            alphas.append(alpha)
        
        # Generate vote share samples using Dirichlet distribution
        # This ensures all vote shares sum to 100%
        vote_share_samples = np.random.dirichlet(alphas, n_samples) * 100
        
        # Calculate statistics for each candidate
        for i, candidate in enumerate(candidates):
            candidate_samples = vote_share_samples[:, i]
            
            # Calculate statistics
            predicted_share = np.mean(candidate_samples)
            lower_90 = np.percentile(candidate_samples, 5)
            upper_90 = np.percentile(candidate_samples, 95)
            
            # Calculate predicted votes
            predicted_votes = int(
                (predicted_share / 100.0) * 
                (predicted_turnout / 100.0) * 
                registered_voters
            )
            
            forecasts.append({
                'county_code': county_code,
                'county_name': county_name,
                'candidate_name': candidate['name'],
                'party': candidate['party'],
                'predicted_vote_share': round(predicted_share, 2),
                'lower_bound_90': round(lower_90, 2),
                'upper_bound_90': round(upper_90, 2),
                'predicted_votes': predicted_votes,
                'predicted_turnout': round(predicted_turnout, 2),
                'registered_voters': registered_voters,
                'election_year': election_year
            })
        
        if (idx + 1) % 10 == 0:
            print(f"   Processed {idx + 1}/{len(county_data)} counties...")
    
    forecasts_df = pd.DataFrame(forecasts)
    
    # Print summary
    print(f"\n✅ Generated {len(forecasts_df)} forecasts")
    print(f"   ({len(county_data)} counties × {n_candidates} candidates)")
    
    return forecasts_df


def print_forecast_summary(forecasts_df):
    """Print summary of forecasts"""
    
    print("\n" + "=" * 80)
    print("📊 NATIONAL FORECAST SUMMARY")
    print("=" * 80)
    
    # Calculate national totals
    national = forecasts_df.groupby('candidate_name').agg({
        'predicted_votes': 'sum',
        'predicted_vote_share': 'mean'
    }).sort_values('predicted_votes', ascending=False)
    
    total_votes = national['predicted_votes'].sum()
    
    print(f"\nTotal Predicted Votes: {total_votes:,}\n")
    
    for idx, (candidate, row) in enumerate(national.iterrows(), 1):
        votes = row['predicted_votes']
        share = (votes / total_votes) * 100
        print(f"{idx}. {candidate:25s} {share:6.2f}%  ({votes:,} votes)")
    
    print("\n" + "=" * 80)
    
    # Show sample county forecasts
    print("\n📍 SAMPLE COUNTY FORECASTS (Nairobi)\n")
    
    nairobi = forecasts_df[forecasts_df['county_name'] == 'Nairobi'].sort_values(
        'predicted_vote_share', ascending=False
    )
    
    for _, row in nairobi.iterrows():
        print(f"   {row['candidate_name']:25s} {row['predicted_vote_share']:6.2f}%  "
              f"[{row['lower_bound_90']:5.2f}% - {row['upper_bound_90']:5.2f}%]")
    
    print("\n" + "=" * 80)


def main():
    """Main execution"""
    
    parser = argparse.ArgumentParser(description='Generate multi-candidate forecasts')
    parser.add_argument('--samples', type=int, default=2000,
                       help='Number of Monte Carlo samples (default: 2000)')
    parser.add_argument('--year', type=int, default=2027,
                       help='Election year (default: 2027)')
    
    args = parser.parse_args()
    
    print("\n" + "=" * 80)
    print("🗳️  MULTI-CANDIDATE FORECASTING MODEL")
    print("=" * 80)
    print(f"\nElection Year: {args.year}")
    print(f"Monte Carlo Samples: {args.samples:,}")
    print(f"Model: Dirichlet Distribution with Historical Priors")
    
    # Load data
    print("\n📂 Loading data...")
    county_data = pd.read_csv('../data/processed/model_county_data.csv')
    historical_results = load_historical_data()
    
    if historical_results is None:
        return
    
    print(f"   ✓ Loaded {len(county_data)} counties")
    print(f"   ✓ Loaded {len(historical_results)} historical results")
    
    # Define candidates for 2027
    # You can modify this list to add/remove candidates
    candidates = [
        {'name': 'William Ruto', 'party': 'UDA'},
        {'name': 'Raila Odinga', 'party': 'Azimio'},
        {'name': 'Kalonzo Musyoka', 'party': 'Wiper'},
        {'name': 'Musalia Mudavadi', 'party': 'ANC'},
        {'name': 'fred matiangi', 'party': 'Independent'},
        # Add more candidates here as needed
    ]
    
    print(f"\n👥 Candidates ({len(candidates)}):")
    for i, c in enumerate(candidates, 1):
        print(f"   {i}. {c['name']} ({c['party']})")
    
    # Generate forecasts
    forecasts_df = generate_multi_candidate_forecast(
        county_data,
        historical_results,
        candidates,
        n_samples=args.samples,
        election_year=args.year
    )
    
    # Save forecasts
    output_file = f'../data/processed/forecasts_{args.year}_multi_candidate.csv'
    forecasts_df.to_csv(output_file, index=False)
    print(f"\n💾 Saved forecasts to: {output_file}")
    
    # Print summary
    print_forecast_summary(forecasts_df)
    
    print("\n🎯 Next Steps:")
    print("   1. Review the forecasts in the CSV file")
    print("   2. Run store_forecasts_multi.py to save to database")
    print("   3. Frontend will automatically display all candidates")
    print("\n")


if __name__ == "__main__":
    main()

