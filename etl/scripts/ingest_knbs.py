#!/usr/bin/env python3
"""
KNBS Census Data Ingestion Script
Downloads and processes KNBS 2019 Census data (population, ethnicity)

PRIVACY CRITICAL: Only processes AGGREGATE county-level ethnicity data
NO individual-level data is stored or processed

Usage:
    python ingest_knbs.py --census-year 2019
"""
import argparse
import hashlib
import sys
from pathlib import Path
from typing import Dict, List
import requests
import pandas as pd
import pdfplumber
from loguru import logger
from sqlalchemy import create_engine, text
from tenacity import retry, stop_after_attempt, wait_exponential

sys.path.append(str(Path(__file__).parent.parent))
from config import config


class KNBSIngester:
    """Ingest KNBS Census data with privacy safeguards"""
    
    def __init__(self, census_year: int = 2019):
        self.census_year = census_year
        self.engine = create_engine(str(config.database_url))
        self.raw_dir = config.raw_data_dir / "knbs" / str(census_year)
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Initialized KNBS ingester for {census_year} census")
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def download_file(self, url: str, filename: str) -> Path:
        """Download file with retry logic"""
        filepath = self.raw_dir / filename
        
        if filepath.exists():
            logger.info(f"File already exists: {filepath}")
            return filepath
        
        logger.info(f"Downloading {url}")
        response = requests.get(url, timeout=config.request_timeout, stream=True)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        logger.success(f"Downloaded to {filepath}")
        return filepath
    
    def parse_volume1_population(self, pdf_path: Path) -> pd.DataFrame:
        """
        Parse KNBS Volume I: Population by County and Sub-County
        
        Extracts:
        - County populations
        - Sub-county populations
        - Urban/rural breakdown
        """
        logger.info(f"Parsing Volume I: {pdf_path}")
        
        # This is a template - actual implementation requires PDF inspection
        # KNBS PDFs have structured tables that can be extracted
        
        results = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                tables = page.extract_tables()
                
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    
                    # Extract county/sub-county population data
                    # Adjust based on actual table structure
                    for row in table[1:]:
                        if len(row) >= 3:
                            results.append({
                                'location_name': row[0],
                                'total_population': row[1],
                                'male': row[2] if len(row) > 2 else None,
                                'female': row[3] if len(row) > 3 else None,
                                'page': page_num
                            })
        
        df = pd.DataFrame(results)
        logger.info(f"Extracted {len(df)} population records")
        
        return df
    
    def parse_volume4_ethnicity(self, pdf_path: Path) -> pd.DataFrame:
        """
        Parse KNBS Volume IV: Distribution by Socio-Economic Characteristics
        
        PRIVACY CRITICAL:
        - Only extracts AGGREGATE county-level ethnicity distributions
        - Applies minimum count threshold (config.min_aggregate_size)
        - NO individual-level data
        
        Returns:
        - County-level ethnicity counts (aggregated)
        """
        logger.info(f"Parsing Volume IV (Ethnicity): {pdf_path}")
        logger.warning("PRIVACY MODE: Only aggregate county-level data will be extracted")
        
        results = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                tables = page.extract_tables()
                
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    
                    # Look for ethnicity tables
                    # KNBS Volume IV has tables like:
                    # County | Kikuyu | Luhya | Kalenjin | ... | Total
                    
                    header = table[0]
                    
                    # Check if this is an ethnicity table
                    if any('ethnic' in str(h).lower() or 'tribe' in str(h).lower() for h in header if h):
                        for row in table[1:]:
                            if len(row) >= 2:
                                county_name = row[0]
                                
                                # Extract ethnicity counts
                                # This is a template - adjust based on actual structure
                                results.append({
                                    'county_name': county_name,
                                    'raw_data': row,
                                    'page': page_num
                                })
        
        df = pd.DataFrame(results)
        logger.info(f"Extracted {len(df)} ethnicity records")
        
        return df
    
    def normalize_ethnicity_data(self, raw_df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize ethnicity data with PRIVACY SAFEGUARDS
        
        - Applies minimum count threshold
        - Suppresses small counts
        - Only county-level aggregates
        """
        logger.info("Normalizing ethnicity data with privacy safeguards")
        
        normalized = []
        suppressed_count = 0
        
        # Example normalization (adjust based on actual data structure)
        for _, row in raw_df.iterrows():
            county_name = row['county_name']
            
            # Parse ethnicity counts from raw_data
            # This is where you'd extract individual ethnicity group counts
            
            # Example: Kikuyu, Luhya, Kalenjin, etc.
            ethnicity_groups = {
                'Kikuyu': None,  # Extract from raw_data
                'Luhya': None,
                'Kalenjin': None,
                'Kamba': None,
                'Kisii': None,
                # ... other groups
            }
            
            for ethnicity, count in ethnicity_groups.items():
                if count is None:
                    continue
                
                # PRIVACY: Suppress counts below threshold
                if count < config.min_aggregate_size:
                    suppressed_count += 1
                    logger.debug(f"Suppressed {ethnicity} in {county_name}: count < {config.min_aggregate_size}")
                    continue
                
                normalized.append({
                    'county_name': county_name,
                    'ethnicity_group': ethnicity,
                    'population_count': count,
                    'census_year': self.census_year
                })
        
        logger.warning(f"Suppressed {suppressed_count} records below privacy threshold")
        
        return pd.DataFrame(normalized)
    
    def load_to_database(self, population_df: pd.DataFrame, ethnicity_df: pd.DataFrame):
        """Load processed data to database"""
        logger.info("Loading data to database")
        
        with self.engine.begin() as conn:
            # Log ingestion
            conn.execute(
                text("""
                    INSERT INTO data_ingestion_log 
                    (source_name, source_url, records_processed, status)
                    VALUES (:source, :url, :records, :status)
                """),
                {
                    'source': 'KNBS',
                    'url': config.knbs_2019_census_volume1_url,
                    'records': len(population_df) + len(ethnicity_df),
                    'status': 'success'
                }
            )
            
            # Load ethnicity data (with privacy safeguards already applied)
            for _, row in ethnicity_df.iterrows():
                # Get county_id
                county_result = conn.execute(
                    text("SELECT id FROM counties WHERE name = :name"),
                    {'name': row['county_name']}
                ).fetchone()
                
                if not county_result:
                    logger.warning(f"County not found: {row['county_name']}")
                    continue
                
                county_id = county_result[0]
                
                # Insert ethnicity aggregate
                conn.execute(
                    text("""
                        INSERT INTO county_ethnicity_aggregate 
                        (county_id, census_year, ethnicity_group, population_count)
                        VALUES (:county_id, :year, :ethnicity, :count)
                        ON CONFLICT (county_id, census_year, ethnicity_group) 
                        DO UPDATE SET population_count = :count
                    """),
                    {
                        'county_id': county_id,
                        'year': row['census_year'],
                        'ethnicity': row['ethnicity_group'],
                        'count': row['population_count']
                    }
                )
            
            logger.success("Data loaded successfully")
    
    def run(self):
        """Execute full ingestion pipeline"""
        logger.info("Starting KNBS data ingestion")
        
        try:
            # Download Volume I (Population)
            vol1_path = self.download_file(
                config.knbs_2019_census_volume1_url,
                "2019_census_volume1.pdf"
            )
            
            # Download Volume IV (Ethnicity)
            vol4_path = self.download_file(
                config.knbs_2019_census_volume4_url,
                "2019_census_volume4.pdf"
            )
            
            # Parse population data
            population_df = self.parse_volume1_population(vol1_path)
            
            # Parse ethnicity data
            ethnicity_raw_df = self.parse_volume4_ethnicity(vol4_path)
            
            # Normalize with privacy safeguards
            ethnicity_df = self.normalize_ethnicity_data(ethnicity_raw_df)
            
            # Save processed data
            ethnicity_csv = config.processed_data_dir / f"knbs_{self.census_year}_ethnicity_aggregate.csv"
            ethnicity_df.to_csv(ethnicity_csv, index=False)
            logger.info(f"Saved ethnicity data to {ethnicity_csv}")
            
            # Load to database
            self.load_to_database(population_df, ethnicity_df)
            
            logger.success("KNBS ingestion completed successfully")
            
        except Exception as e:
            logger.error(f"Ingestion failed: {e}")
            raise


def main():
    parser = argparse.ArgumentParser(description="Ingest KNBS census data")
    parser.add_argument("--census-year", type=int, default=2019, help="Census year")
    parser.add_argument("--verbose", action="store_true", help="Verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    
    ingester = KNBSIngester(census_year=args.census_year)
    ingester.run()


if __name__ == "__main__":
    main()

