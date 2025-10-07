"""
SQLAlchemy ORM Models for KenPoliMarket
Maps to the PostgreSQL database schema
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, Numeric, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from geoalchemy2 import Geometry
import uuid

Base = declarative_base()


class County(Base):
    """County model - Kenya's 47 counties"""
    __tablename__ = "counties"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(3), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326))
    population_2019 = Column(Integer)
    registered_voters_2022 = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    demographics = relationship("CountyDemographics", back_populates="county", cascade="all, delete-orphan")
    voter_demographics = relationship("CountyVoterDemographics", back_populates="county", cascade="all, delete-orphan")
    election_results = relationship("ElectionResultCounty", back_populates="county", cascade="all, delete-orphan")
    ethnicity_aggregates = relationship("CountyEthnicityAggregate", back_populates="county", cascade="all, delete-orphan")
    forecast_county = relationship("ForecastCounty", back_populates="county", cascade="all, delete-orphan")
    constituencies = relationship("Constituency", back_populates="county", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<County(code='{self.code}', name='{self.name}')>"


class CountyDemographics(Base):
    """County demographics from census data"""
    __tablename__ = "county_demographics"
    
    id = Column(Integer, primary_key=True, index=True)
    county_id = Column(Integer, ForeignKey('counties.id', ondelete='CASCADE'))
    census_year = Column(Integer, nullable=False)
    total_population = Column(Integer)
    urban_population = Column(Integer)
    rural_population = Column(Integer)
    median_age = Column(Numeric(4, 1))
    literacy_rate = Column(Numeric(5, 2))
    employment_rate = Column(Numeric(5, 2))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    county = relationship("County", back_populates="demographics")
    
    def __repr__(self):
        return f"<CountyDemographics(county_id={self.county_id}, year={self.census_year})>"


class Constituency(Base):
    """Constituency model - electoral constituencies"""
    __tablename__ = "constituencies"

    id = Column(Integer, primary_key=True, index=True)
    county_id = Column(Integer, ForeignKey('counties.id', ondelete='CASCADE'))
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326))
    population_2019 = Column(Integer)
    registered_voters_2022 = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    county = relationship("County", back_populates="constituencies")
    voter_demographics = relationship("ConstituencyVoterDemographics", back_populates="constituency", cascade="all, delete-orphan")
    wards = relationship("Ward", back_populates="constituency", cascade="all, delete-orphan")
    election_results = relationship("ElectionResultConstituency", back_populates="constituency")
    forecasts = relationship("ForecastConstituency", back_populates="constituency")
    candidates = relationship("Candidate", back_populates="constituency")

    def __repr__(self):
        return f"<Constituency(code='{self.code}', name='{self.name}')>"


class Ward(Base):
    """Ward model - electoral wards (smallest administrative unit)"""
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    constituency_id = Column(Integer, ForeignKey('constituencies.id', ondelete='CASCADE'))
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326))
    population_2019 = Column(Integer)
    registered_voters_2022 = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    constituency = relationship("Constituency", back_populates="wards")
    voter_demographics = relationship("WardVoterDemographics", back_populates="ward", cascade="all, delete-orphan")
    candidates = relationship("Candidate", back_populates="ward")
    polling_stations = relationship("PollingStation", back_populates="ward", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Ward(code='{self.code}', name='{self.name}')>"


class PollingStation(Base):
    """Polling station model - lowest level electoral unit"""
    __tablename__ = "polling_stations"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey('wards.id', ondelete='CASCADE'))
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    registration_center_code = Column(String(50))
    registration_center_name = Column(String(200))
    registered_voters_2022 = Column(Integer, default=0)
    geometry = Column(Geometry('POINT', srid=4326))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    ward = relationship("Ward", back_populates="polling_stations")
    demographics = relationship("PollingStationVoterDemographics", back_populates="polling_station", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PollingStation(code='{self.code}', name='{self.name}')>"


class CountyVoterDemographics(Base):
    """County voter demographics including gender and disability statistics"""
    __tablename__ = "county_voter_demographics"

    id = Column(Integer, primary_key=True, index=True)
    county_id = Column(Integer, ForeignKey('counties.id', ondelete='CASCADE'))
    election_year = Column(Integer, nullable=False)
    total_registered_voters = Column(Integer, nullable=False, default=0)
    male_voters = Column(Integer, default=0)
    female_voters = Column(Integer, default=0)
    pwd_voters = Column(Integer, default=0)
    data_source = Column(String(255))
    verified = Column(Integer, default=0)  # SQLite uses 0/1 for boolean
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    county = relationship("County", back_populates="voter_demographics")

    def __repr__(self):
        return f"<CountyVoterDemographics(county_id={self.county_id}, year={self.election_year})>"


class ConstituencyVoterDemographics(Base):
    """Constituency voter demographics including gender and disability statistics"""
    __tablename__ = "constituency_voter_demographics"

    id = Column(Integer, primary_key=True, index=True)
    constituency_id = Column(Integer, ForeignKey('constituencies.id', ondelete='CASCADE'))
    election_year = Column(Integer, nullable=False)
    total_registered_voters = Column(Integer, nullable=False, default=0)
    male_voters = Column(Integer, default=0)
    female_voters = Column(Integer, default=0)
    pwd_voters = Column(Integer, default=0)
    data_source = Column(String(255))
    verified = Column(Integer, default=0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    constituency = relationship("Constituency", back_populates="voter_demographics")

    def __repr__(self):
        return f"<ConstituencyVoterDemographics(constituency_id={self.constituency_id}, year={self.election_year})>"


class WardVoterDemographics(Base):
    """Ward voter demographics including gender and disability statistics"""
    __tablename__ = "ward_voter_demographics"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey('wards.id', ondelete='CASCADE'))
    election_year = Column(Integer, nullable=False)
    total_registered_voters = Column(Integer, nullable=False, default=0)
    male_voters = Column(Integer, default=0)
    female_voters = Column(Integer, default=0)
    pwd_voters = Column(Integer, default=0)
    data_source = Column(String(255))
    verified = Column(Integer, default=0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    ward = relationship("Ward", back_populates="voter_demographics")

    def __repr__(self):
        return f"<WardVoterDemographics(ward_id={self.ward_id}, year={self.election_year})>"


class PollingStationVoterDemographics(Base):
    """Polling station voter demographics including gender and disability statistics"""
    __tablename__ = "polling_station_voter_demographics"

    id = Column(Integer, primary_key=True, index=True)
    polling_station_id = Column(Integer, ForeignKey('polling_stations.id', ondelete='CASCADE'))
    election_year = Column(Integer, nullable=False)
    total_registered_voters = Column(Integer, nullable=False, default=0)
    male_voters = Column(Integer, default=0)
    female_voters = Column(Integer, default=0)
    pwd_voters = Column(Integer, default=0)
    data_source = Column(String(255))
    verified = Column(Integer, default=0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    polling_station = relationship("PollingStation", back_populates="demographics")

    def __repr__(self):
        return f"<PollingStationVoterDemographics(polling_station_id={self.polling_station_id}, year={self.election_year})>"


class Election(Base):
    """Election model - presidential, parliamentary, etc."""
    __tablename__ = "elections"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False, index=True)
    election_type = Column(String(50), nullable=False)
    election_date = Column(DateTime)
    description = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    candidates = relationship("Candidate", back_populates="election", cascade="all, delete-orphan")
    results_county = relationship("ElectionResultCounty", back_populates="election", cascade="all, delete-orphan")
    results_constituency = relationship("ElectionResultConstituency", back_populates="election", cascade="all, delete-orphan")
    forecast_runs = relationship("ForecastRun", back_populates="election")

    def __repr__(self):
        return f"<Election(year={self.year}, type='{self.election_type}')>"


class Candidate(Base):
    """Candidate model - election candidates"""
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey('elections.id', ondelete='CASCADE'))
    name = Column(String(200), nullable=False)
    party = Column(String(200))
    position = Column(String(100))  # 'president', 'governor', 'mp', 'mca', 'senator'

    # Position-specific geographic fields
    county_id = Column(Integer, ForeignKey('counties.id', ondelete='SET NULL'), nullable=True)  # For Governor
    constituency_id = Column(Integer, ForeignKey('constituencies.id', ondelete='SET NULL'), nullable=True)  # For MP
    ward_id = Column(Integer, ForeignKey('wards.id', ondelete='SET NULL'), nullable=True)  # For MCA

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    election = relationship("Election", back_populates="candidates")
    county = relationship("County", foreign_keys=[county_id])
    constituency = relationship("Constituency", foreign_keys=[constituency_id], back_populates="candidates")
    ward = relationship("Ward", foreign_keys=[ward_id], back_populates="candidates")
    results_county = relationship("ElectionResultCounty", back_populates="candidate")
    results_constituency = relationship("ElectionResultConstituency", back_populates="candidate")

    def __repr__(self):
        return f"<Candidate(name='{self.name}', party='{self.party}', position='{self.position}')>"


class ElectionResultCounty(Base):
    """County-level election results"""
    __tablename__ = "election_results_county"
    
    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey('elections.id', ondelete='CASCADE'), index=True)
    county_id = Column(Integer, ForeignKey('counties.id', ondelete='CASCADE'), index=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id', ondelete='CASCADE'))
    votes = Column(Integer, nullable=False)
    rejected_votes = Column(Integer, default=0)
    total_votes_cast = Column(Integer)
    registered_voters = Column(Integer)
    turnout_percentage = Column(Numeric(5, 2))
    source_document = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    election = relationship("Election", back_populates="results_county")
    county = relationship("County", back_populates="election_results")
    candidate = relationship("Candidate", back_populates="results_county")
    
    __table_args__ = (
        CheckConstraint('votes >= 0', name='election_results_county_votes_check'),
    )
    
    def __repr__(self):
        return f"<ElectionResultCounty(election_id={self.election_id}, county_id={self.county_id})>"


class ElectionResultConstituency(Base):
    """Constituency-level election results"""
    __tablename__ = "election_results_constituency"
    
    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey('elections.id', ondelete='CASCADE'))
    constituency_id = Column(Integer, ForeignKey('constituencies.id', ondelete='CASCADE'))
    candidate_id = Column(Integer, ForeignKey('candidates.id', ondelete='CASCADE'))
    votes = Column(Integer, nullable=False)
    rejected_votes = Column(Integer, default=0)
    total_votes_cast = Column(Integer)
    registered_voters = Column(Integer)
    turnout_percentage = Column(Numeric(5, 2))
    source_document = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    election = relationship("Election", back_populates="results_constituency")
    constituency = relationship("Constituency", back_populates="election_results")
    candidate = relationship("Candidate", back_populates="results_constituency")
    
    __table_args__ = (
        CheckConstraint('votes >= 0', name='election_results_constituency_votes_check'),
    )
    
    def __repr__(self):
        return f"<ElectionResultConstituency(election_id={self.election_id}, constituency_id={self.constituency_id})>"


class CountyEthnicityAggregate(Base):
    """
    County-level ethnicity aggregates (PRIVACY-PRESERVING)
    Minimum 10 individuals per group, county-level only
    """
    __tablename__ = "county_ethnicity_aggregate"
    
    id = Column(Integer, primary_key=True, index=True)
    county_id = Column(Integer, ForeignKey('counties.id', ondelete='CASCADE'))
    census_year = Column(Integer, nullable=False)
    ethnicity_group = Column(String(100), nullable=False)
    population_count = Column(Integer, nullable=False)
    percentage = Column(Numeric(5, 2))
    source = Column(String(200), default='KNBS 2019 Census')
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    county = relationship("County", back_populates="ethnicity_aggregates")
    
    __table_args__ = (
        CheckConstraint('population_count >= 10', name='county_ethnicity_aggregate_population_count_check'),
    )
    
    def __repr__(self):
        return f"<CountyEthnicityAggregate(county_id={self.county_id}, group='{self.ethnicity_group}')>"


class ForecastRun(Base):
    """Forecast run metadata"""
    __tablename__ = "forecast_runs"

    id = Column(PGUUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    election_id = Column(Integer, ForeignKey('elections.id', ondelete='CASCADE'))
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)
    run_timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    parameters = Column(Text)  # JSONB in PostgreSQL
    data_cutoff_date = Column(Date)
    status = Column(String(50), default='running')
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    election = relationship("Election", back_populates="forecast_runs")
    county_forecasts = relationship("ForecastCounty", back_populates="forecast_run")

    def __repr__(self):
        return f"<ForecastRun(id='{self.id}', model='{self.model_name}')>"


class ForecastCounty(Base):
    """County-level forecasts with uncertainty"""
    __tablename__ = "forecast_county"

    id = Column(Integer, primary_key=True, index=True)
    forecast_run_id = Column(PGUUID(as_uuid=True), ForeignKey('forecast_runs.id', ondelete='CASCADE'))
    county_id = Column(Integer, ForeignKey('counties.id', ondelete='CASCADE'))
    candidate_id = Column(Integer, ForeignKey('candidates.id', ondelete='CASCADE'))
    predicted_vote_share = Column(Numeric(5, 2))
    lower_bound_90 = Column(Numeric(5, 2))
    upper_bound_90 = Column(Numeric(5, 2))
    predicted_votes = Column(Integer)
    predicted_turnout = Column(Numeric(5, 2))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    forecast_run = relationship("ForecastRun", back_populates="county_forecasts")
    county = relationship("County")
    candidate = relationship("Candidate")

    def __repr__(self):
        return f"<ForecastCounty(run_id={self.forecast_run_id}, county_id={self.county_id})>"


class ForecastConstituency(Base):
    """Constituency-level forecasts with uncertainty"""
    __tablename__ = "forecast_constituency"

    id = Column(Integer, primary_key=True, index=True)
    forecast_run_id = Column(String(36), ForeignKey('forecast_runs.id', ondelete='CASCADE'))
    constituency_id = Column(Integer, ForeignKey('constituencies.id', ondelete='CASCADE'))
    candidate_id = Column(Integer, ForeignKey('candidates.id', ondelete='CASCADE'))
    predicted_vote_share = Column(Numeric(5, 2))
    lower_bound_90 = Column(Numeric(5, 2))
    upper_bound_90 = Column(Numeric(5, 2))
    predicted_votes = Column(Integer)
    predicted_turnout = Column(Numeric(5, 2))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    forecast_run = relationship("ForecastRun")
    constituency = relationship("Constituency")
    candidate = relationship("Candidate")

    def __repr__(self):
        return f"<ForecastConstituency(run_id={self.forecast_run_id}, constituency_id={self.constituency_id})>"

