#!/usr/bin/env python3
"""
IEBC Data Ingestion Script
Downloads and processes official IEBC election results

Usage:
    python ingest_iebc.py --year 2022 --election-type presidential
"""
import argparse
import hashlib
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import requests
import pandas as pd
import pdfplumber
from loguru import logger
from sqlalchemy import create_engine, text
from tenacity import retry, stop_after_attempt, wait_exponential

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))
from config import config


class IEBCIngester:
    """Ingest IEBC election results data"""
    
    def __init__(self, year: int, election_type: str = "presidential"):
        self.year = year
        self.election_type = election_type
        self.engine = create_engine(str(config.database_url))
        self.raw_dir = config.raw_data_dir / "iebc" / str(year)
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Initialized IEBC ingester for {year} {election_type} election")
    
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
    
    def compute_file_hash(self, filepath: Path) -> str:
        """Compute SHA256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def parse_2022_presidential_pdf(self, pdf_path: Path) -> pd.DataFrame:
        """
        Parse IEBC 2022 presidential results PDF
        
        Expected format: County-level results with columns:
        - County Name
        - Registered Voters
        - Candidate votes (multiple columns)
        - Total votes cast
        - Rejected votes
        """
        logger.info(f"Parsing PDF: {pdf_path}")
        
        results = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                logger.debug(f"Processing page {page_num}/{len(pdf.pages)}")
                
                # Extract tables from page
                tables = page.extract_tables()
                
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    
                    # First row is usually header
                    header = table[0]
                    
                    # Process data rows
                    for row in table[1:]:
                        if len(row) < 3:
                            continue
                        
                        # Basic parsing - adjust based on actual PDF structure
                        # This is a template; real implementation needs PDF inspection
                        county_name = row[0] if row[0] else None
                        
                        if county_name and county_name.strip():
                            results.append({
                                'county_name': county_name.strip(),
                                'raw_row': row,
                                'page': page_num
                            })
        
        df = pd.DataFrame(results)
        logger.info(f"Extracted {len(df)} rows from PDF")
        
        return df
    
    def normalize_county_results(self, raw_df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize raw PDF data to standard schema
        
        This is a template - actual implementation depends on PDF structure
        """
        logger.info("Normalizing county results")
        
        # Example normalization (adjust based on actual data)
        normalized = []
        
        for _, row in raw_df.iterrows():
            # Parse raw row data
            # This is where you'd extract candidate votes, totals, etc.
            normalized.append({
                'county_name': row['county_name'],
                'registered_voters': None,  # Extract from raw_row
                'total_votes_cast': None,
                'rejected_votes': None,
                # Add candidate-specific columns
            })
        
        return pd.DataFrame(normalized)
    
    def load_to_database(self, df: pd.DataFrame, source_file: str, file_hash: str):
        """Load processed data to database"""
        logger.info(f"Loading {len(df)} records to database")
        
        with self.engine.begin() as conn:
            # Log ingestion
            ingestion_log = {
                'source_name': 'IEBC',
                'source_url': config.iebc_2022_results_url,
                'file_hash': file_hash,
                'records_processed': len(df),
                'status': 'success'
            }
            
            conn.execute(
                text("""
                    INSERT INTO data_ingestion_log 
                    (source_name, source_url, file_hash, records_processed, status)
                    VALUES (:source_name, :source_url, :file_hash, :records_processed, :status)
                """),
                ingestion_log
            )
            
            # Create or get election record
            election_result = conn.execute(
                text("""
                    INSERT INTO elections (year, election_type, election_date, description)
                    VALUES (:year, :type, :date, :desc)
                    ON CONFLICT DO NOTHING
                    RETURNING id
                """),
                {
                    'year': self.year,
                    'type': self.election_type,
                    'date': f'{self.year}-08-09',  # 2022 election date
                    'desc': f'{self.year} {self.election_type.title()} Election'
                }
            ).fetchone()
            
            logger.success("Data loaded successfully")
    
    def run(self):
        """Execute full ingestion pipeline"""
        logger.info("Starting IEBC data ingestion")
        
        try:
            # Download PDF
            if self.year == 2022:
                pdf_path = self.download_file(
                    config.iebc_2022_results_url,
                    "2022_presidential_results.pdf"
                )
            else:
                logger.error(f"No data source configured for year {self.year}")
                return
            
            # Compute hash
            file_hash = self.compute_file_hash(pdf_path)
            logger.info(f"File hash: {file_hash}")
            
            # Parse PDF
            raw_df = self.parse_2022_presidential_pdf(pdf_path)
            
            # Save raw data
            raw_csv = self.raw_dir / "raw_parsed.csv"
            raw_df.to_csv(raw_csv, index=False)
            logger.info(f"Saved raw parsed data to {raw_csv}")
            
            # Normalize
            normalized_df = self.normalize_county_results(raw_df)
            
            # Save processed data
            processed_csv = config.processed_data_dir / f"iebc_{self.year}_county_results.csv"
            normalized_df.to_csv(processed_csv, index=False)
            logger.info(f"Saved processed data to {processed_csv}")
            
            # Load to database
            self.load_to_database(normalized_df, str(pdf_path), file_hash)
            
            logger.success("IEBC ingestion completed successfully")
            
        except Exception as e:
            logger.error(f"Ingestion failed: {e}")
            raise


def main():
    parser = argparse.ArgumentParser(description="Ingest IEBC election results")
    parser.add_argument("--year", type=int, default=2022, help="Election year")
    parser.add_argument("--election-type", default="presidential", help="Election type")
    parser.add_argument("--verbose", action="store_true", help="Verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    
    ingester = IEBCIngester(year=args.year, election_type=args.election_type)
    ingester.run()


if __name__ == "__main__":
    main()

