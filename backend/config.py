"""
Backend Configuration
"""
from pydantic_settings import BaseSettings
from pydantic import Field, PostgresDsn
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # API
    api_title: str = "KenPoliMarket API"
    api_version: str = "0.1.0"
    api_secret_key: str = Field(..., description="Secret key for JWT")
    
    # Database
    database_url: PostgresDsn = Field(
        default="postgresql://kenpolimarket:password@localhost:5432/kenpolimarket"
    )
    
    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0")
    
    # CORS
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"]
    )
    
    # Privacy
    min_aggregate_size: int = Field(default=10, description="Minimum count for aggregates")
    enable_differential_privacy: bool = Field(default=True)
    privacy_epsilon: float = Field(default=1.0, description="Differential privacy epsilon")
    
    # Rate limiting
    rate_limit_per_minute: int = Field(default=60)
    rate_limit_per_hour: int = Field(default=1000)
    
    # Features
    enable_play_money_market: bool = Field(default=True)
    enable_survey_plugin: bool = Field(default=True)
    enable_api_access: bool = Field(default=True)
    
    # Model
    model_update_interval_hours: int = Field(default=24)
    forecast_confidence_level: float = Field(default=0.90)
    
    # Monitoring
    sentry_dsn: str = Field(default="")
    sentry_environment: str = Field(default="development")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields in .env file


settings = Settings()

