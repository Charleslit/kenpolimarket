"""
Hierarchical Bayesian Forecasting Model
Tribe-wise turnout and vote share prediction with uncertainty quantification

PRIVACY: Only processes aggregate county-level data
"""
import pymc as pm
import numpy as np
import pandas as pd
from typing import Dict, Tuple
import arviz as az


class HierarchicalBayesianModel:
    """
    Hierarchical Bayesian model for election forecasting
    
    Structure:
    - National-level parameters (hyperpriors)
    - County-level parameters (partial pooling)
    - Constituency-level parameters (partial pooling)
    - Tribe-wise turnout multipliers (aggregate only)
    
    Privacy: All ethnicity data is county-level aggregates only
    """
    
    def __init__(self, confidence_level: float = 0.90):
        self.confidence_level = confidence_level
        self.model = None
        self.trace = None
        
    def build_model(
        self,
        county_data: pd.DataFrame,
        ethnicity_data: pd.DataFrame,
        historical_results: pd.DataFrame
    ) -> pm.Model:
        """
        Build hierarchical Bayesian model
        
        Args:
            county_data: County-level features (population, urban %, etc.)
            ethnicity_data: County-level ethnicity aggregates (PRIVACY: min 10 per group)
            historical_results: Past election results for calibration
        
        Returns:
            PyMC model
        """
        n_counties = len(county_data)
        n_candidates = len(historical_results['candidate_id'].unique())
        
        with pm.Model() as model:
            # ============================================================
            # HYPERPRIORS (National level)
            # ============================================================
            
            # National baseline turnout
            mu_turnout_national = pm.Normal('mu_turnout_national', mu=0.70, sigma=0.05)
            sigma_turnout_national = pm.HalfNormal('sigma_turnout_national', sigma=0.1)
            
            # National baseline vote shares (Dirichlet for sum-to-one constraint)
            alpha_national = pm.Dirichlet('alpha_national', a=np.ones(n_candidates))
            
            # ============================================================
            # COUNTY-LEVEL PARAMETERS (Partial pooling)
            # ============================================================
            
            # County-specific turnout (hierarchical)
            turnout_county_raw = pm.Normal('turnout_county_raw', mu=0, sigma=1, shape=n_counties)
            turnout_county = pm.Deterministic(
                'turnout_county',
                pm.math.invlogit(
                    pm.math.logit(mu_turnout_national) + 
                    sigma_turnout_national * turnout_county_raw
                )
            )
            
            # County-specific vote shares (hierarchical Dirichlet)
            # Using centered parameterization for stability
            vote_share_county = pm.Dirichlet(
                'vote_share_county',
                a=alpha_national * 100,  # Concentration parameter
                shape=(n_counties, n_candidates)
            )
            
            # ============================================================
            # FEATURE EFFECTS (Regression components)
            # ============================================================
            
            # Urban population effect on turnout
            beta_urban = pm.Normal('beta_urban', mu=0, sigma=0.1)
            
            # Youth population effect on turnout
            beta_youth = pm.Normal('beta_youth', mu=0, sigma=0.1)
            
            # Historical turnout effect (persistence)
            beta_historical = pm.Normal('beta_historical', mu=0.5, sigma=0.2)
            
            # Combine feature effects
            urban_pct = county_data['urban_percentage'].values
            youth_pct = county_data['youth_percentage'].values
            hist_turnout = historical_results.groupby('county_id')['turnout'].mean().values
            
            feature_effect = (
                beta_urban * urban_pct +
                beta_youth * youth_pct +
                beta_historical * hist_turnout
            )
            
            # Adjusted turnout with features
            turnout_adjusted = pm.Deterministic(
                'turnout_adjusted',
                pm.math.invlogit(pm.math.logit(turnout_county) + feature_effect)
            )
            
            # ============================================================
            # ETHNICITY-LEVEL AGGREGATES (PRIVACY-PRESERVING)
            # ============================================================
            
            # Tribe-wise turnout multipliers (aggregate county-level only)
            # This models differential turnout by ethnicity group
            # PRIVACY: Only applied to county aggregates, never individuals
            
            n_ethnicities = len(ethnicity_data['ethnicity_group'].unique())
            
            ethnicity_turnout_multiplier = pm.Normal(
                'ethnicity_turnout_multiplier',
                mu=1.0,
                sigma=0.15,
                shape=n_ethnicities
            )
            
            # Map ethnicity multipliers to counties (weighted by population share)
            # This is aggregate-only: county_ethnicity_share is from KNBS census aggregates
            ethnicity_effect = pm.math.dot(
                ethnicity_data.pivot_table(
                    index='county_id',
                    columns='ethnicity_group',
                    values='population_share'
                ).fillna(0).values,
                ethnicity_turnout_multiplier
            )
            
            # Final turnout prediction
            turnout_final = pm.Deterministic(
                'turnout_final',
                pm.math.invlogit(
                    pm.math.logit(turnout_adjusted) + 0.1 * (ethnicity_effect - 1.0)
                )
            )
            
            # ============================================================
            # LIKELIHOOD (Observed data)
            # ============================================================
            
            # Observed turnout (from historical data)
            observed_turnout = historical_results.groupby('county_id')['turnout'].mean().values
            
            pm.Normal(
                'obs_turnout',
                mu=turnout_final,
                sigma=0.05,  # Observation noise
                observed=observed_turnout
            )
            
            # Observed vote shares (multinomial)
            observed_votes = historical_results.pivot_table(
                index='county_id',
                columns='candidate_id',
                values='votes'
            ).fillna(0).values
            
            total_votes = observed_votes.sum(axis=1, keepdims=True)
            
            pm.Multinomial(
                'obs_votes',
                n=total_votes.flatten().astype(int),
                p=vote_share_county,
                observed=observed_votes.astype(int)
            )
        
        self.model = model
        return model
    
    def fit(self, draws: int = 2000, tune: int = 1000, chains: int = 4):
        """
        Fit model using MCMC sampling
        
        Args:
            draws: Number of posterior samples
            tune: Number of tuning steps
            chains: Number of MCMC chains
        """
        with self.model:
            self.trace = pm.sample(
                draws=draws,
                tune=tune,
                chains=chains,
                return_inferencedata=True,
                target_accept=0.95
            )
        
        return self.trace
    
    def predict(
        self,
        county_data_future: pd.DataFrame,
        ethnicity_data_future: pd.DataFrame
    ) -> Dict[str, np.ndarray]:
        """
        Generate predictions for future election
        
        Returns:
            Dictionary with:
            - turnout_mean: Point estimates
            - turnout_lower: Lower bound of credible interval
            - turnout_upper: Upper bound of credible interval
            - vote_share_mean: Point estimates per candidate
            - vote_share_lower/upper: Credible intervals
        """
        with self.model:
            # Posterior predictive sampling
            ppc = pm.sample_posterior_predictive(
                self.trace,
                var_names=['turnout_final', 'vote_share_county']
            )
        
        # Extract credible intervals
        alpha = 1 - self.confidence_level
        
        turnout_samples = ppc.posterior_predictive['turnout_final'].values
        vote_share_samples = ppc.posterior_predictive['vote_share_county'].values
        
        return {
            'turnout_mean': turnout_samples.mean(axis=(0, 1)),
            'turnout_lower': np.percentile(turnout_samples, alpha/2 * 100, axis=(0, 1)),
            'turnout_upper': np.percentile(turnout_samples, (1 - alpha/2) * 100, axis=(0, 1)),
            'vote_share_mean': vote_share_samples.mean(axis=(0, 1)),
            'vote_share_lower': np.percentile(vote_share_samples, alpha/2 * 100, axis=(0, 1)),
            'vote_share_upper': np.percentile(vote_share_samples, (1 - alpha/2) * 100, axis=(0, 1))
        }
    
    def diagnostics(self) -> Dict:
        """
        Model diagnostics and convergence checks
        
        Returns:
            Dictionary with R-hat, ESS, and other diagnostics
        """
        summary = az.summary(self.trace)
        
        return {
            'rhat_max': summary['r_hat'].max(),
            'ess_bulk_min': summary['ess_bulk'].min(),
            'ess_tail_min': summary['ess_tail'].min(),
            'divergences': self.trace.sample_stats['diverging'].sum().item(),
            'summary': summary
        }


# Example usage
if __name__ == "__main__":
    # This is a template - actual data would come from ETL pipeline
    
    # Simulated data (replace with real IEBC/KNBS data)
    county_data = pd.DataFrame({
        'county_id': range(47),
        'urban_percentage': np.random.uniform(0.2, 0.8, 47),
        'youth_percentage': np.random.uniform(0.3, 0.5, 47)
    })
    
    # PRIVACY: Only aggregate county-level ethnicity data
    ethnicity_data = pd.DataFrame({
        'county_id': np.repeat(range(47), 5),
        'ethnicity_group': np.tile(['Kikuyu', 'Luhya', 'Kalenjin', 'Kamba', 'Kisii'], 47),
        'population_share': np.random.dirichlet(np.ones(5), 47).flatten()
    })
    
    historical_results = pd.DataFrame({
        'county_id': np.repeat(range(47), 2),
        'candidate_id': np.tile([0, 1], 47),
        'votes': np.random.randint(10000, 100000, 94),
        'turnout': np.random.uniform(0.6, 0.8, 94)
    })
    
    # Build and fit model
    model = HierarchicalBayesianModel(confidence_level=0.90)
    model.build_model(county_data, ethnicity_data, historical_results)
    
    print("Model built successfully!")
    print("To fit: model.fit(draws=2000, tune=1000, chains=4)")
    print("To predict: predictions = model.predict(county_data_future, ethnicity_data_future)")

