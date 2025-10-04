'use client';

import { useEffect, useState } from 'react';
import LeafletCountyMap from '@/components/maps/LeafletCountyMap';
import ForecastChart from '@/components/charts/ForecastChart';
import ForecastWithUncertainty from '@/components/charts/ForecastWithUncertainty';
import NationalDashboard from '@/components/dashboard/NationalDashboard';
import RegionalBreakdown from '@/components/dashboard/RegionalBreakdown';
import CandidateComparison from '@/components/dashboard/CandidateComparison';
import LiveTicker from '@/components/dashboard/LiveTicker';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import CountySearch from '@/components/ui/CountySearch';
import ShareButton from '@/components/ui/ShareButton';
import ErrorMessage, { EmptyState } from '@/components/ui/ErrorMessage';
import { DashboardSkeleton, ChartSkeleton } from '@/components/ui/LoadingSkeleton';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumbs items={[{ label: 'Forecasts' }]} />
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumbs items={[{ label: 'Forecasts' }]} />
          <ErrorMessage
            title="Failed to Load Forecasts"
            message={`${error}. Make sure the backend API is running on ${API_BASE_URL}`}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs
          items={[
            { label: 'Forecasts', href: '/forecasts' },
            ...(selectedCounty ? [{ label: selectedCounty.name }] : [])
          ]}
        />
      </div>

      {/* Modern Header with Gradient */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-xl mt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white flex items-center flex-wrap">
                <span className="mr-2 sm:mr-3">🇰🇪</span>
                KenPoliMarket
                <span className="ml-2 sm:ml-3 px-2 sm:px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs sm:text-sm font-medium">
                  2027
                </span>
              </h1>
              <p className="mt-2 text-blue-100 text-xs sm:text-sm">
                Forecast by Ongoro • Powered by Bayesian AI • Based on official IEBC data from 2022
              </p>
              <p className="mt-1 text-blue-200 text-xs">
                {counties.length} Counties • {elections.length} Elections • Privacy-first & Data Protection Act 2019 Compliant
              </p>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <ShareButton
                title={`KenPoliMarket - ${selectedCounty ? selectedCounty.name : 'National'} Forecast`}
                text={`Check out the ${selectedCounty ? selectedCounty.name : 'national'} election forecast on KenPoliMarket`}
              />
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
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Search Counties
              </label>
              <CountySearch
                counties={counties}
                onSelect={(county) => setSelectedCounty(county)}
                selectedCounty={selectedCounty}
                placeholder="Search by county name, code, or region..."
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* County Map */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🗺️</span>
                  Interactive County Map
                </h2>
                <LeafletCountyMap
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

