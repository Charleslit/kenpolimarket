'use client';

import { useEffect, useState } from 'react';
import CountyMap from '@/components/maps/CountyMap';
import ForecastChart from '@/components/charts/ForecastChart';
import ForecastWithUncertainty from '@/components/charts/ForecastWithUncertainty';
import NationalDashboard from '@/components/dashboard/NationalDashboard';
import RegionalBreakdown from '@/components/dashboard/RegionalBreakdown';
import CandidateComparison from '@/components/dashboard/CandidateComparison';
import LiveTicker from '@/components/dashboard/LiveTicker';

// API Base URL - update this to match your backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface County {
  code: string;
  name: string;
  population_2019: number;
  registered_voters_2022: number;
}

interface Election {
  id: number;
  year: number;
  election_type: string;
  election_date: string;
  description: string;
}

interface ElectionResult {
  county_code: string;
  county_name: string;
  candidate_name: string;
  party: string;
  votes: number;
  vote_percentage: number;
  turnout_percentage: number;
}

type ViewMode = 'national' | 'county' | 'comparison' | 'regional';
type ChartType = 'bar' | 'line' | 'pie' | 'map';

export default function ForecastsPage() {
  const [counties, setCounties] = useState<County[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [electionResults, setElectionResults] = useState<ElectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'historical' | 'forecast'>('forecast');
  const [viewMode, setViewMode] = useState<ViewMode>('national');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [countySearchQuery, setCountySearchQuery] = useState<string>('');

  // Fetch counties on mount
  useEffect(() => {
    const fetchCounties = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/counties/`);
        if (!response.ok) throw new Error('Failed to fetch counties');
        const data = await response.json();
        setCounties(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load counties');
      }
    };

    const fetchElections = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/elections/`);
        if (!response.ok) throw new Error('Failed to fetch elections');
        const data = await response.json();
        setElections(data);
        // Select the most recent election by default
        if (data.length > 0) {
          setSelectedElection(data[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load elections');
      } finally {
        setLoading(false);
      }
    };

    fetchCounties();
    fetchElections();
  }, []);

  // Fetch election results when election is selected
  useEffect(() => {
    if (!selectedElection) return;

    const fetchElectionResults = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/elections/${selectedElection.id}/results`);
        if (!response.ok) throw new Error('Failed to fetch election results');
        const data = await response.json();
        setElectionResults(data.results || []);
      } catch (err) {
        console.error('Failed to load election results:', err);
      }
    };

    fetchElectionResults();
  }, [selectedElection]);

  const handleCountyClick = (countyCode: string) => {
    const county = counties.find(c => c.code === countyCode);
    if (county) {
      setSelectedCounty(county);
    }
  };

  // Filter counties based on search query
  const filteredCounties = counties.filter(county =>
    county.name.toLowerCase().includes(countySearchQuery.toLowerCase()) ||
    county.code.toLowerCase().includes(countySearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading forecasts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-red-500 mt-2">
            Make sure the backend API is running on {API_BASE_URL}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Modern Header with Gradient */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-white flex items-center">
                <span className="mr-3">🇰🇪</span>
                KenPoliMarket
                <span className="ml-3 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                  2027
                </span>
              </h1>
              <p className="mt-2 text-blue-100 text-sm">
                Privacy-first political forecasting powered by Bayesian AI • {counties.length} Counties • {elections.length} Elections
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <a
                href="/admin"
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors font-medium border border-white border-opacity-30"
              >
                🧮 Admin Tools
              </a>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white border-opacity-20">
                <p className="text-xs text-blue-100 uppercase tracking-wide">Compliance</p>
                <p className="text-sm font-semibold text-white">Data Protection Act 2019</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white border-opacity-20">
                <p className="text-xs text-blue-100 uppercase tracking-wide">Last Update</p>
                <p className="text-sm font-semibold text-white">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setViewMode('national')}
              className={`${
                viewMode === 'national'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
            >
              <span className="mr-2">🏛️</span>
              National Overview
            </button>
            <button
              onClick={() => setViewMode('regional')}
              className={`${
                viewMode === 'regional'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
            >
              <span className="mr-2">🗺️</span>
              Regional Breakdown
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`${
                viewMode === 'comparison'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
            >
              <span className="mr-2">⚖️</span>
              Candidate Comparison
            </button>
            <button
              onClick={() => setViewMode('county')}
              className={`${
                viewMode === 'county'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
            >
              <span className="mr-2">📍</span>
              County Explorer
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* National Overview */}
        {viewMode === 'national' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <NationalDashboard />
              </div>
              <div>
                <LiveTicker />
              </div>
            </div>
          </div>
        )}

        {/* Regional Breakdown */}
        {viewMode === 'regional' && (
          <RegionalBreakdown />
        )}

        {/* Candidate Comparison */}
        {viewMode === 'comparison' && (
          <CandidateComparison />
        )}

        {/* County Explorer (Original View) */}
        {viewMode === 'county' && (
          <div className="space-y-6">
            {/* Election Selector */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <label htmlFor="election-select" className="block text-sm font-medium text-gray-700 mb-3">
                Select Election Year
              </label>
              <select
                id="election-select"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                value={selectedElection?.id || ''}
                onChange={(e) => {
                  const election = elections.find(el => el.id === parseInt(e.target.value));
                  setSelectedElection(election || null);
                }}
              >
                {elections.map((election) => (
                  <option key={election.id} value={election.id}>
                    {election.year} {election.election_type} - {election.description}
                  </option>
                ))}
              </select>
            </div>

            {/* County Search */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <label htmlFor="county-search" className="block text-sm font-medium text-gray-700 mb-3">
                Search Counties
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="county-search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by county name or code..."
                  value={countySearchQuery}
                  onChange={(e) => setCountySearchQuery(e.target.value)}
                />
                {countySearchQuery && (
                  <button
                    onClick={() => setCountySearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {countySearchQuery && (
                <p className="mt-2 text-sm text-gray-600">
                  Found {filteredCounties.length} {filteredCounties.length === 1 ? 'county' : 'counties'}
                </p>
              )}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* County Map */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🗺️</span>
                  Interactive County Map
                </h2>
                <CountyMap
                  counties={filteredCounties}
                  selectedCounty={selectedCounty}
                  onCountyClick={handleCountyClick}
                  electionResults={electionResults}
                />
              </div>

              {/* Forecast Chart with Tabs */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {selectedCounty ? `${selectedCounty.name} County` : 'Select a County'}
                </h2>

                {selectedCounty ? (
                  <div>
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                          onClick={() => setActiveTab('historical')}
                          className={`${
                            activeTab === 'historical'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                          📊 Historical Data
                        </button>
                        <button
                          onClick={() => setActiveTab('forecast')}
                          className={`${
                            activeTab === 'forecast'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                          🔮 2027 Forecast
                        </button>
                      </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="mt-4">
                      {activeTab === 'historical' ? (
                        <ForecastChart
                          countyCode={selectedCounty.code}
                          countyName={selectedCounty.name}
                        />
                      ) : (
                        <ForecastWithUncertainty
                          countyCode={selectedCounty.code}
                          electionYear={2027}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="mt-2">Click on a county to view forecast data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* County List */}
            {countySearchQuery && filteredCounties.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📋</span>
                  Search Results ({filteredCounties.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                  {filteredCounties.map((county) => (
                    <button
                      key={county.code}
                      onClick={() => handleCountyClick(county.code)}
                      className={`text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        selectedCounty?.code === county.code
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{county.name}</div>
                      <div className="text-sm text-gray-500 mt-1">Code: {county.code}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Pop: {county.population_2019.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* County Details */}
            {selectedCounty && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  County Details: {selectedCounty.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">County Code</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">{selectedCounty.code}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Population (2019)</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {selectedCounty.population_2019.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">Registered Voters (2022)</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">
                      {selectedCounty.registered_voters_2022.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

