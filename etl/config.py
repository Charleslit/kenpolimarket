"""
ETL Configuration
Loads settings from environment variables with validation
"""
from pydantic_settings import BaseSettings
from pydantic import Field, PostgresDsn
from typing import Optional
import os
from pathlib import Path


class ETLConfig(BaseSettings):
    """ETL Pipeline Configuration"""
    
    # Database
    database_url: PostgresDsn = Field(
        default="postgresql://kenpolimarket:password@localhost:5432/kenpolimarket",
        description="PostgreSQL connection string"
    )
    
    # Data directories
    data_root: Path = Field(default=Path("../data"), description="Root data directory")
    raw_data_dir: Path = Field(default=Path("../data/raw"), description="Raw data storage")
    processed_data_dir: Path = Field(default=Path("../data/processed"), description="Processed data storage")
    cache_dir: Path = Field(default=Path("../data/cache"), description="Cache directory")
    
    # IEBC Data Sources
    iebc_base_url: str = Field(
        default="https://www.iebc.or.ke",
        description="IEBC base URL"
    )
    iebc_2022_results_url: str = Field(
        default="https://www.iebc.or.ke/uploads/resources/QLTlLJx0Vr.pdf",
        description="IEBC 2022 presidential results PDF"
    )
    
    # KNBS Data Sources
    knbs_base_url: str = Field(
        default="https://www.knbs.or.ke",
        description="KNBS base URL"
    )
    knbs_2019_census_volume1_url: str = Field(
        default="https://www.knbs.or.ke/wp-content/uploads/2023/09/2019-Kenya-population-and-Housing-Census-Volume-1-Population-By-County-And-Sub-County.pdf",
        description="KNBS 2019 Census Volume I"
    )
    knbs_2019_census_volume4_url: str = Field(
        default="https://www.knbs.or.ke/wp-content/uploads/2023/09/2019-Kenya-population-and-Housing-Census-Volume-4-Distribution-of-Population-by-Socio-Economic-Characteristics.pdf",
        description="KNBS 2019 Census Volume IV (ethnicity data)"
    )
    
    # Privacy settings
    min_aggregate_size: int = Field(
        default=10,
        description="Minimum count for aggregate data (privacy threshold)"
    )
    
    # Processing settings
    chunk_size: int = Field(default=1000, description="Batch size for DB inserts")
    max_retries: int = Field(default=3, description="Max retries for HTTP requests")
    request_timeout: int = Field(default=30, description="HTTP request timeout (seconds)")
    
    # Logging
    log_level: str = Field(default="INFO", description="Logging level")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create directories if they don't exist
        self.raw_data_dir.mkdir(parents=True, exist_ok=True)
        self.processed_data_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir.mkdir(parents=True, exist_ok=True)


# Global config instance
config = ETLConfig()

