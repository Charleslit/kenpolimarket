--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4 (Debian 15.4-1.pgdg110+1)
-- Dumped by pg_dump version 15.4 (Debian 15.4-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: candidates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidates (
    id integer NOT NULL,
    election_id integer,
    name character varying(200) NOT NULL,
    party character varying(100),
    "position" character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.candidates_id_seq OWNED BY public.candidates.id;


--
-- Name: constituencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.constituencies (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    county_id integer,
    geometry public.geometry(MultiPolygon,4326),
    population_2019 integer,
    registered_voters_2022 integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: constituencies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.constituencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: constituencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.constituencies_id_seq OWNED BY public.constituencies.id;


--
-- Name: counties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.counties (
    id integer NOT NULL,
    code character varying(3) NOT NULL,
    name character varying(100) NOT NULL,
    geometry public.geometry(MultiPolygon,4326),
    population_2019 integer,
    registered_voters_2022 integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: counties_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.counties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: counties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.counties_id_seq OWNED BY public.counties.id;


--
-- Name: county_demographics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.county_demographics (
    id integer NOT NULL,
    county_id integer,
    census_year integer NOT NULL,
    total_population integer,
    urban_population integer,
    rural_population integer,
    median_age numeric(4,1),
    literacy_rate numeric(5,2),
    employment_rate numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: county_demographics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.county_demographics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: county_demographics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.county_demographics_id_seq OWNED BY public.county_demographics.id;


--
-- Name: county_ethnicity_aggregate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.county_ethnicity_aggregate (
    id integer NOT NULL,
    county_id integer,
    census_year integer NOT NULL,
    ethnicity_group character varying(100) NOT NULL,
    population_count integer NOT NULL,
    percentage numeric(5,2),
    source character varying(200) DEFAULT 'KNBS 2019 Census'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT county_ethnicity_aggregate_population_count_check CHECK ((population_count >= 10))
);


--
-- Name: county_ethnicity_aggregate_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.county_ethnicity_aggregate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: county_ethnicity_aggregate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.county_ethnicity_aggregate_id_seq OWNED BY public.county_ethnicity_aggregate.id;


--
-- Name: data_ingestion_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_ingestion_log (
    id integer NOT NULL,
    source_name character varying(100) NOT NULL,
    source_url character varying(500),
    file_hash character varying(64),
    ingestion_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    records_processed integer,
    status character varying(50),
    error_log text
);


--
-- Name: data_ingestion_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.data_ingestion_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: data_ingestion_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.data_ingestion_log_id_seq OWNED BY public.data_ingestion_log.id;


--
-- Name: election_results_constituency; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.election_results_constituency (
    id integer NOT NULL,
    election_id integer,
    constituency_id integer,
    candidate_id integer,
    votes integer NOT NULL,
    rejected_votes integer DEFAULT 0,
    total_votes_cast integer,
    registered_voters integer,
    turnout_percentage numeric(5,2),
    source_document character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT election_results_constituency_votes_check CHECK ((votes >= 0))
);


--
-- Name: election_results_constituency_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.election_results_constituency_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: election_results_constituency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.election_results_constituency_id_seq OWNED BY public.election_results_constituency.id;


--
-- Name: election_results_county; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.election_results_county (
    id integer NOT NULL,
    election_id integer,
    county_id integer,
    candidate_id integer,
    votes integer NOT NULL,
    rejected_votes integer DEFAULT 0,
    total_votes_cast integer,
    registered_voters integer,
    turnout_percentage numeric(5,2),
    source_document character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT election_results_county_votes_check CHECK ((votes >= 0))
);


--
-- Name: election_results_county_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.election_results_county_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: election_results_county_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.election_results_county_id_seq OWNED BY public.election_results_county.id;


--
-- Name: elections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.elections (
    id integer NOT NULL,
    year integer NOT NULL,
    election_type character varying(50) NOT NULL,
    election_date date NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: elections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.elections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: elections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.elections_id_seq OWNED BY public.elections.id;


--
-- Name: forecast_constituency; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forecast_constituency (
    id integer NOT NULL,
    forecast_run_id uuid,
    constituency_id integer,
    candidate_id integer,
    predicted_vote_share numeric(5,2),
    lower_bound_90 numeric(5,2),
    upper_bound_90 numeric(5,2),
    predicted_votes integer,
    predicted_turnout numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: forecast_constituency_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.forecast_constituency_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: forecast_constituency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.forecast_constituency_id_seq OWNED BY public.forecast_constituency.id;


--
-- Name: forecast_county; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forecast_county (
    id integer NOT NULL,
    forecast_run_id uuid,
    county_id integer,
    candidate_id integer,
    predicted_vote_share numeric(5,2),
    lower_bound_90 numeric(5,2),
    upper_bound_90 numeric(5,2),
    predicted_votes integer,
    predicted_turnout numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: forecast_county_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.forecast_county_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: forecast_county_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.forecast_county_id_seq OWNED BY public.forecast_county.id;


--
-- Name: forecast_ethnicity_aggregate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forecast_ethnicity_aggregate (
    id integer NOT NULL,
    forecast_run_id uuid,
    county_id integer,
    ethnicity_group character varying(100) NOT NULL,
    projected_registered_voters integer,
    projected_turnout_percentage numeric(5,2),
    projected_votes_cast integer,
    lower_bound_90 integer,
    upper_bound_90 integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT forecast_ethnicity_aggregate_projected_registered_voters_check CHECK ((projected_registered_voters >= 10))
);


--
-- Name: forecast_ethnicity_aggregate_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.forecast_ethnicity_aggregate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: forecast_ethnicity_aggregate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.forecast_ethnicity_aggregate_id_seq OWNED BY public.forecast_ethnicity_aggregate.id;


--
-- Name: forecast_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forecast_runs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    election_id integer,
    model_name character varying(100) NOT NULL,
    model_version character varying(50) NOT NULL,
    run_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    parameters jsonb,
    data_cutoff_date date,
    status character varying(50) DEFAULT 'running'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: market_outcomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_outcomes (
    id integer NOT NULL,
    question_id uuid,
    outcome_text character varying(200) NOT NULL,
    current_probability numeric(5,4),
    total_shares_yes integer DEFAULT 0,
    total_shares_no integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: market_outcomes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_outcomes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_outcomes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_outcomes_id_seq OWNED BY public.market_outcomes.id;


--
-- Name: market_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_questions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    election_id integer,
    question_text text NOT NULL,
    resolution_criteria text NOT NULL,
    resolution_date timestamp without time zone,
    status character varying(50) DEFAULT 'open'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: survey_responses_aggregate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.survey_responses_aggregate (
    id integer NOT NULL,
    survey_id uuid,
    county_id integer,
    question_id character varying(100) NOT NULL,
    response_option character varying(200) NOT NULL,
    response_count integer NOT NULL,
    weighted_percentage numeric(5,2),
    aggregation_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT survey_responses_aggregate_response_count_check CHECK ((response_count >= 5))
);


--
-- Name: survey_responses_aggregate_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.survey_responses_aggregate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: survey_responses_aggregate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.survey_responses_aggregate_id_seq OWNED BY public.survey_responses_aggregate.id;


--
-- Name: surveys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.surveys (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    status character varying(50) DEFAULT 'active'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: wards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wards (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    constituency_id integer,
    geometry public.geometry(MultiPolygon,4326),
    population_2019 integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: wards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wards_id_seq OWNED BY public.wards.id;


--
-- Name: candidates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates ALTER COLUMN id SET DEFAULT nextval('public.candidates_id_seq'::regclass);


--
-- Name: constituencies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constituencies ALTER COLUMN id SET DEFAULT nextval('public.constituencies_id_seq'::regclass);


--
-- Name: counties id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.counties ALTER COLUMN id SET DEFAULT nextval('public.counties_id_seq'::regclass);


--
-- Name: county_demographics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.county_demographics ALTER COLUMN id SET DEFAULT nextval('public.county_demographics_id_seq'::regclass);


--
-- Name: county_ethnicity_aggregate id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.county_ethnicity_aggregate ALTER COLUMN id SET DEFAULT nextval('public.county_ethnicity_aggregate_id_seq'::regclass);


--
-- Name: data_ingestion_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_ingestion_log ALTER COLUMN id SET DEFAULT nextval('public.data_ingestion_log_id_seq'::regclass);


--
-- Name: election_results_constituency id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.election_results_constituency ALTER COLUMN id SET DEFAULT nextval('public.election_results_constituency_id_seq'::regclass);


--
-- Name: election_results_county id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.election_results_county ALTER COLUMN id SET DEFAULT nextval('public.election_results_county_id_seq'::regclass);


--
-- Name: elections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.elections ALTER COLUMN id SET DEFAULT nextval('public.elections_id_seq'::regclass);


--
-- Name: forecast_constituency id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_constituency ALTER COLUMN id SET DEFAULT nextval('public.forecast_constituency_id_seq'::regclass);


--
-- Name: forecast_county id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_county ALTER COLUMN id SET DEFAULT nextval('public.forecast_county_id_seq'::regclass);


--
-- Name: forecast_ethnicity_aggregate id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_ethnicity_aggregate ALTER COLUMN id SET DEFAULT nextval('public.forecast_ethnicity_aggregate_id_seq'::regclass);


--
-- Name: market_outcomes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_outcomes ALTER COLUMN id SET DEFAULT nextval('public.market_outcomes_id_seq'::regclass);


--
-- Name: survey_responses_aggregate id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses_aggregate ALTER COLUMN id SET DEFAULT nextval('public.survey_responses_aggregate_id_seq'::regclass);


--
-- Name: wards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wards ALTER COLUMN id SET DEFAULT nextval('public.wards_id_seq'::regclass);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: constituencies constituencies_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constituencies
    ADD CONSTRAINT constituencies_code_key UNIQUE (code);


--
-- Name: constituencies constituencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constituencies
    ADD CONSTRAINT constituencies_pkey PRIMARY KEY (id);


--
-- Name: counties counties_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.counties
    ADD CONSTRAINT counties_code_key UNIQUE (code);


--
-- Name: counties counties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.counties
    ADD CONSTRAINT counties_pkey PRIMARY KEY (id);


--
-- Name: county_demographics county_demographics_county_id_census_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.county_demographics
    ADD CONSTRAINT county_demographics_county_id_census_year_key UNIQUE (county_id, census_year);


--
-- Name: county_demographics county_demographics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.county_demographics
    ADD CONSTRAINT county_demographics_pkey PRIMARY KEY (id);


--
-- Name: county_ethnicity_aggregate county_ethnicity_aggregate_county_id_census_year_ethnicity__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.county_ethnicity_aggregate
    ADD CONSTRAINT county_ethnicity_aggregate_county_id_census_year_ethnicity__key UNIQUE (county_id, census_year, ethnicity_group);


--
-- Name: county_ethnicity_aggregate county_ethnicity_aggregate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.county_ethnicity_aggregate
    ADD CONSTRAINT county_ethnicity_aggregate_pkey PRIMARY KEY (id);


--
-- Name: data_ingestion_log data_ingestion_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_ingestion_log
    ADD CONSTRAINT data_ingestion_log_pkey PRIMARY KEY (id);


--
-- Name: election_results_constituency election_results_constituency_election_id_constituency_id_c_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.election_results_constituency
    ADD CONSTRAINT election_results_constituency_election_id_constituency_id_c_key UNIQUE (election_id, constituency_id, candidate_id);


--
-- Name: election_results_constituency election_results_constituency_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.election_results_constituency
    ADD CONSTRAINT election_results_constituency_pkey PRIMARY KEY (id);


--
-- Name: election_results_county election_results_county_election_id_county_id_candidate_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.election_results_county
    ADD CONSTRAINT election_results_county_election_id_county_id_candidate_id_key UNIQUE (election_id, county_id, candidate_id);


--
-- Name: election_results_county election_results_county_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.election_results_county
    ADD CONSTRAINT election_results_county_pkey PRIMARY KEY (id);


--
-- Name: elections elections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.elections
    ADD CONSTRAINT elections_pkey PRIMARY KEY (id);


--
-- Name: forecast_constituency forecast_constituency_forecast_run_id_constituency_id_candi_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_constituency
    ADD CONSTRAINT forecast_constituency_forecast_run_id_constituency_id_candi_key UNIQUE (forecast_run_id, constituency_id, candidate_id);


--
-- Name: forecast_constituency forecast_constituency_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_constituency
    ADD CONSTRAINT forecast_constituency_pkey PRIMARY KEY (id);


--
-- Name: forecast_county forecast_county_forecast_run_id_county_id_candidate_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_county
    ADD CONSTRAINT forecast_county_forecast_run_id_county_id_candidate_id_key UNIQUE (forecast_run_id, county_id, candidate_id);


--
-- Name: forecast_county forecast_county_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_county
    ADD CONSTRAINT forecast_county_pkey PRIMARY KEY (id);


--
-- Name: forecast_ethnicity_aggregate forecast_ethnicity_aggregate_forecast_run_id_county_id_ethn_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_ethnicity_aggregate
    ADD CONSTRAINT forecast_ethnicity_aggregate_forecast_run_id_county_id_ethn_key UNIQUE (forecast_run_id, county_id, ethnicity_group);


--
-- Name: forecast_ethnicity_aggregate forecast_ethnicity_aggregate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_ethnicity_aggregate
    ADD CONSTRAINT forecast_ethnicity_aggregate_pkey PRIMARY KEY (id);


--
-- Name: forecast_runs forecast_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_runs
    ADD CONSTRAINT forecast_runs_pkey PRIMARY KEY (id);


--
-- Name: market_outcomes market_outcomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_outcomes
    ADD CONSTRAINT market_outcomes_pkey PRIMARY KEY (id);


--
-- Name: market_questions market_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_questions
    ADD CONSTRAINT market_questions_pkey PRIMARY KEY (id);


--
-- Name: survey_responses_aggregate survey_responses_aggregate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses_aggregate
    ADD CONSTRAINT survey_responses_aggregate_pkey PRIMARY KEY (id);


--
-- Name: survey_responses_aggregate survey_responses_aggregate_survey_id_county_id_question_id__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses_aggregate
    ADD CONSTRAINT survey_responses_aggregate_survey_id_county_id_question_id__key UNIQUE (survey_id, county_id, question_id, response_option);


--
-- Name: surveys surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_pkey PRIMARY KEY (id);


--
-- Name: wards wards_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wards
    ADD CONSTRAINT wards_code_key UNIQUE (code);


--
-- Name: wards wards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wards
    ADD CONSTRAINT wards_pkey PRIMARY KEY (id);


--
-- Name: idx_constituencies_county; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_constituencies_county ON public.constituencies USING btree (county_id);


--
-- Name: idx_constituencies_geom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_constituencies_geom ON public.constituencies USING gist (geometry);


--
-- Name: idx_counties_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_counties_code ON public.counties USING btree (code);


--
-- Name: idx_counties_geom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_counties_geom ON public.counties USING gist (geometry);


--
-- Name: idx_county_ethnicity_county; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_county_ethnicity_county ON public.county_ethnicity_aggregate USING btree (county_id);


--
-- Name: idx_election_results_constituency_election; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_election_results_constituency_election ON public.election_results_constituency USING btree (election_id, constituency_id);


--
-- Name: idx_election_results_county_election; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_election_results_county_election ON public.election_results_county USING btree (election_id, county_id);


--
-- Name: idx_forecast_constituency_run; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forecast_constituency_run ON public.forecast_constituency USING btree (forecast_run_id);


--
-- Name: idx_forecast_county_run; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forecast_county_run ON public.forecast_county USING btree (forecast_run_id);


--
-- Name: idx_wards_constituency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wards_constituency ON public.wards USING btree (constituency_id);


--
-- Name: idx_wards_geom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wards_geom ON public.wards USING gist (geometry);


--
-- Name: candidates candidates_election_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_election_id_fkey FOREIGN KEY (election_id) REFERENCES public.elections(id) ON DELETE CASCADE;


--
-- Name: constituencies constituencies_county_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constituencies
    ADD CONSTRAINT constituencies_county_id_fkey FOREIGN KEY (county_id) REFERENCES public.counties(id) ON DELETE CASCADE;


--
-- Name: county_demographics county_demographics_county_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.county_demographics
    ADD CONSTRAINT county_demographics_county_id_fkey FOREIGN KEY (county_id) REFERENCES public.counties(id) ON DELETE CASCADE;


--
-- Name: county_ethnicity_aggregate county_ethnicity_aggregate_county_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.county_ethnicity_aggregate
    ADD CONSTRAINT county_ethnicity_aggregate_county_id_fkey FOREIGN KEY (county_id) REFERENCES public.counties(id) ON DELETE CASCADE;


--
-- Name: election_results_constituency election_results_constituency_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.election_results_constituency
    ADD CONSTRAINT election_results_constituency_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: election_results_constituency election_results_constituency_constituency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.election_results_constituency
    ADD CONSTRAINT election_results_constituency_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.constituencies(id) ON DELETE CASCADE;


--
-- Name: election_results_constituency election_results_constituency_election_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.election_results_constituency
    ADD CONSTRAINT election_results_constituency_election_id_fkey FOREIGN KEY (election_id) REFERENCES public.elections(id) ON DELETE CASCADE;


--
-- Name: election_results_county election_results_county_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.election_results_county
    ADD CONSTRAINT election_results_county_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: election_results_county election_results_county_county_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.election_results_county
    ADD CONSTRAINT election_results_county_county_id_fkey FOREIGN KEY (county_id) REFERENCES public.counties(id) ON DELETE CASCADE;


--
-- Name: election_results_county election_results_county_election_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.election_results_county
    ADD CONSTRAINT election_results_county_election_id_fkey FOREIGN KEY (election_id) REFERENCES public.elections(id) ON DELETE CASCADE;


--
-- Name: forecast_constituency forecast_constituency_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_constituency
    ADD CONSTRAINT forecast_constituency_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: forecast_constituency forecast_constituency_constituency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_constituency
    ADD CONSTRAINT forecast_constituency_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.constituencies(id) ON DELETE CASCADE;


--
-- Name: forecast_constituency forecast_constituency_forecast_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_constituency
    ADD CONSTRAINT forecast_constituency_forecast_run_id_fkey FOREIGN KEY (forecast_run_id) REFERENCES public.forecast_runs(id) ON DELETE CASCADE;


--
-- Name: forecast_county forecast_county_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_county
    ADD CONSTRAINT forecast_county_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: forecast_county forecast_county_county_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_county
    ADD CONSTRAINT forecast_county_county_id_fkey FOREIGN KEY (county_id) REFERENCES public.counties(id) ON DELETE CASCADE;


--
-- Name: forecast_county forecast_county_forecast_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_county
    ADD CONSTRAINT forecast_county_forecast_run_id_fkey FOREIGN KEY (forecast_run_id) REFERENCES public.forecast_runs(id) ON DELETE CASCADE;


--
-- Name: forecast_ethnicity_aggregate forecast_ethnicity_aggregate_county_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_ethnicity_aggregate
    ADD CONSTRAINT forecast_ethnicity_aggregate_county_id_fkey FOREIGN KEY (county_id) REFERENCES public.counties(id) ON DELETE CASCADE;


--
-- Name: forecast_ethnicity_aggregate forecast_ethnicity_aggregate_forecast_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_ethnicity_aggregate
    ADD CONSTRAINT forecast_ethnicity_aggregate_forecast_run_id_fkey FOREIGN KEY (forecast_run_id) REFERENCES public.forecast_runs(id) ON DELETE CASCADE;


--
-- Name: forecast_runs forecast_runs_election_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_runs
    ADD CONSTRAINT forecast_runs_election_id_fkey FOREIGN KEY (election_id) REFERENCES public.elections(id) ON DELETE CASCADE;


--
-- Name: market_outcomes market_outcomes_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_outcomes
    ADD CONSTRAINT market_outcomes_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.market_questions(id) ON DELETE CASCADE;


--
-- Name: market_questions market_questions_election_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_questions
    ADD CONSTRAINT market_questions_election_id_fkey FOREIGN KEY (election_id) REFERENCES public.elections(id);


--
-- Name: survey_responses_aggregate survey_responses_aggregate_county_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses_aggregate
    ADD CONSTRAINT survey_responses_aggregate_county_id_fkey FOREIGN KEY (county_id) REFERENCES public.counties(id);


--
-- Name: survey_responses_aggregate survey_responses_aggregate_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses_aggregate
    ADD CONSTRAINT survey_responses_aggregate_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE CASCADE;


--
-- Name: wards wards_constituency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wards
    ADD CONSTRAINT wards_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.constituencies(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

