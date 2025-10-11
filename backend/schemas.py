"""
Pydantic schemas for API request/response validation
"""

from pydantic import BaseModel, Field, ConfigDict, field_serializer
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from uuid import UUID


# ============================================================================
# County Schemas
# ============================================================================

class CountyDemographicsSchema(BaseModel):
    """County demographics response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    census_year: int
    total_population: Optional[int] = None
    urban_population: Optional[int] = None
    rural_population: Optional[int] = None
    median_age: Optional[Decimal] = None
    literacy_rate: Optional[Decimal] = None
    employment_rate: Optional[Decimal] = None


class CountyEthnicityAggregateSchema(BaseModel):
    """County ethnicity aggregate response (PRIVACY-PRESERVING)"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    census_year: int
    ethnicity_group: str
    population_count: int = Field(..., ge=10, description="Minimum 10 for privacy")
    percentage: Optional[Decimal] = None
    source: Optional[str] = None


class CountyBaseSchema(BaseModel):
    """Base county information"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    code: str
    name: str
    population_2019: Optional[int] = None
    registered_voters_2022: Optional[int] = None


class CountyDetailSchema(CountyBaseSchema):
    """Detailed county information with relationships"""
    demographics: List[CountyDemographicsSchema] = []
    ethnicity_aggregates: List[CountyEthnicityAggregateSchema] = []


class CountyListSchema(CountyBaseSchema):
    """County list item (lightweight)"""
    pass


# ============================================================================
# Constituency & Ward Schemas
# ============================================================================

class ConstituencyBaseSchema(BaseModel):
    """Base constituency information"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    county_id: int
    registered_voters_2022: Optional[int] = None


class ConstituencyDetailSchema(ConstituencyBaseSchema):
    """Detailed constituency with county info"""
    county: Optional[CountyBaseSchema] = None


class WardBaseSchema(BaseModel):
    """Base ward information"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    constituency_id: int
    population_2019: Optional[int] = None
    registered_voters_2022: Optional[int] = None


class WardDetailSchema(WardBaseSchema):
    """Detailed ward with constituency info"""
    constituency: Optional[ConstituencyBaseSchema] = None


class PollingStationBaseSchema(BaseModel):
    """Base polling station information"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    ward_id: int
    # Production schema uses registration_center_id; legacy code/name kept optional for compatibility
    registration_center_id: Optional[int] = None
    registration_center_code: Optional[str] = None
    registration_center_name: Optional[str] = None
    registered_voters_2022: Optional[int] = None


class PollingStationDetailSchema(PollingStationBaseSchema):
    """Detailed polling station with ward info"""
    ward: Optional[WardBaseSchema] = None


# ============================================================================
# VOTER DEMOGRAPHICS SCHEMAS
# ============================================================================

class VoterDemographicsBase(BaseModel):
    """Base voter demographics schema"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    election_year: int
    total_registered_voters: int
    male_voters: Optional[int] = 0
    female_voters: Optional[int] = 0
    pwd_voters: Optional[int] = 0
    data_source: Optional[str] = None
    verified: Optional[bool] = False

    # Computed fields
    @property
    def male_percentage(self) -> float:
        if self.total_registered_voters > 0:
            return round((self.male_voters or 0) / self.total_registered_voters * 100, 2)
        return 0.0

    @property
    def female_percentage(self) -> float:
        if self.total_registered_voters > 0:
            return round((self.female_voters or 0) / self.total_registered_voters * 100, 2)
        return 0.0

    @property
    def pwd_percentage(self) -> float:
        if self.total_registered_voters > 0:
            return round((self.pwd_voters or 0) / self.total_registered_voters * 100, 2)
        return 0.0


class CountyVoterDemographicsSchema(VoterDemographicsBase):
    """County voter demographics"""
    county_id: int


class ConstituencyVoterDemographicsSchema(VoterDemographicsBase):
    """Constituency voter demographics"""
    constituency_id: int


class WardVoterDemographicsSchema(VoterDemographicsBase):
    """Ward voter demographics"""
    ward_id: int


class PollingStationVoterDemographicsSchema(VoterDemographicsBase):
    """Polling station voter demographics"""
    polling_station_id: int


class VoterStatisticsSummary(BaseModel):
    """Summary statistics for voter demographics"""
    model_config = ConfigDict(from_attributes=True)

    level: str  # 'county', 'constituency', 'ward', 'polling_station'
    id: int
    name: str
    code: Optional[str] = None

    # Voter counts
    total_registered_voters: int
    male_voters: int
    female_voters: int
    pwd_voters: int

    # Percentages
    male_percentage: float
    female_percentage: float
    pwd_percentage: float

    # Additional context
    election_year: int
    parent_name: Optional[str] = None  # e.g., county name for constituency


# ============================================================================
# Election Schemas
# ============================================================================

class CandidateSchema(BaseModel):
    """Candidate response"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    party: Optional[str] = None
    position: Optional[str] = None
    county_id: Optional[int] = None
    constituency_id: Optional[int] = None
    ward_id: Optional[int] = None

    # Nested relationships (optional)
    county: Optional[CountyBaseSchema] = None
    constituency: Optional[ConstituencyBaseSchema] = None
    ward: Optional[WardBaseSchema] = None


class CandidateCreateSchema(BaseModel):
    """Schema for creating a candidate"""
    name: str = Field(..., min_length=1, max_length=200)
    party: str = Field(..., min_length=1, max_length=200)
    position: str = Field(..., description="Position: President, Governor, MP, MCA, Senator")
    election_id: Optional[int] = None
    county_id: Optional[int] = Field(None, description="Required for Governor candidates")
    constituency_id: Optional[int] = Field(None, description="Required for MP candidates")
    ward_id: Optional[int] = Field(None, description="Required for MCA candidates")


class CandidateUpdateSchema(BaseModel):
    """Schema for updating a candidate"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    party: Optional[str] = Field(None, min_length=1, max_length=200)
    position: Optional[str] = None
    county_id: Optional[int] = None
    constituency_id: Optional[int] = None
    ward_id: Optional[int] = None


class ElectionBaseSchema(BaseModel):
    """Base election information"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    year: int
    election_type: str
    election_date: Optional[datetime] = None
    description: Optional[str] = None


class ElectionDetailSchema(ElectionBaseSchema):
    """Detailed election with candidates"""
    candidates: List[CandidateSchema] = []


class ElectionResultCountySchema(BaseModel):
    """County-level election result"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    election_id: int
    county_id: int
    candidate_id: int
    votes: int
    rejected_votes: Optional[int] = 0
    total_votes_cast: Optional[int] = None
    registered_voters: Optional[int] = None
    turnout_percentage: Optional[Decimal] = None
    
    # Nested relationships
    county: Optional[CountyBaseSchema] = None
    candidate: Optional[CandidateSchema] = None


class ElectionResultsResponseSchema(BaseModel):
    """Election results response with aggregated data"""
    election: ElectionBaseSchema
    results: List[ElectionResultCountySchema]
    summary: dict


# ============================================================================
# Forecast Schemas
# ============================================================================

class ElectionBaseSchema(BaseModel):
    """Base election information"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    year: int
    election_type: str
    description: Optional[str] = None


class ForecastRunSchema(BaseModel):
    """Forecast run metadata"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID  # Pydantic will automatically serialize UUID to string
    election_id: int
    model_name: str
    model_version: str
    run_timestamp: datetime
    data_cutoff_date: Optional[datetime] = None
    status: Optional[str] = None
    visibility: str = 'draft'
    is_official: bool = False
    published_at: Optional[datetime] = None
    parameters: Optional[dict] = None

    # Nested relationships
    election: Optional[ElectionBaseSchema] = None


class CandidateBaseSchema(BaseModel):
    """Base candidate information"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    party: str
    position: Optional[str] = None


class ForecastCountySchema(BaseModel):
    """County-level forecast with uncertainty"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    forecast_run_id: UUID  # Pydantic will automatically serialize UUID to string
    county_id: int
    candidate_id: int
    predicted_vote_share: Optional[Decimal] = None
    lower_bound_90: Optional[Decimal] = None
    upper_bound_90: Optional[Decimal] = None
    predicted_votes: Optional[int] = None
    predicted_turnout: Optional[Decimal] = None

    # Nested relationships
    county: Optional[CountyBaseSchema] = None
    candidate: Optional[CandidateBaseSchema] = None


class ForecastRunDetailSchema(BaseModel):
    """Detailed forecast run with county forecasts"""
    model_config = ConfigDict(from_attributes=True)

    id: str  # UUID
    election_id: int
    model_name: str
    model_version: str
    run_timestamp: datetime
    data_cutoff_date: Optional[datetime] = None
    status: Optional[str] = None
    visibility: str = 'draft'
    is_official: bool = False
    published_at: Optional[datetime] = None
    parameters: Optional[dict] = None

    # Nested relationships
    election: Optional[ElectionBaseSchema] = None
    county_forecasts: Optional[List[ForecastCountySchema]] = None


class ForecastListResponseSchema(BaseModel):
    """List of forecasts response"""
    forecast_run: ForecastRunSchema
    forecasts: List[ForecastCountySchema]


# ============================================================================
# API Response Schemas
# ============================================================================

class HealthCheckSchema(BaseModel):
    """Health check response"""
    status: str
    database: str
    redis: Optional[str] = None
    timestamp: datetime


class ErrorResponseSchema(BaseModel):
    """Error response"""
    detail: str
    error_code: Optional[str] = None


class PaginationSchema(BaseModel):
    """Pagination metadata"""
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginatedResponseSchema(BaseModel):
    """Generic paginated response"""
    data: List[dict]
    pagination: PaginationSchema

