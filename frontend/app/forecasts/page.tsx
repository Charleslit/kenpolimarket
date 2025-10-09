'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ForecastChart from '@/components/charts/ForecastChart';
import ForecastWithUncertainty from '@/components/charts/ForecastWithUncertainty';
import NationalDashboard from '@/components/dashboard/NationalDashboard';

import CandidateComparison from '@/components/dashboard/CandidateComparison';
import LiveTicker from '@/components/dashboard/LiveTicker';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import CountySearch from '@/components/ui/CountySearch';
import ShareButton from '@/components/ui/ShareButton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';

// API Base URL - update this to match your backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Dynamically import LeafletCountyMap to avoid SSR issues with Leaflet
const LeafletCountyMap = dynamic(
  () => import('@/components/maps/LeafletCountyMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
);

interface County {
  code: string;
  name: string;
  population_2019: number;
  registered_voters_2022: number;
  region?: string;
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

type ViewMode = 'national' | 'comparison' | 'regional';


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
  const [pinnedCounty, setPinnedCounty] = useState<County | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [colorBy, setColorBy] = useState<'turnout' | 'winner' | 'registered'>('turnout');

  const router = useRouter();
  const pathname = usePathname();


  // Initialize selectedRegion from URL or localStorage (once on mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const regionParam = sp.get('region');
      const saved = localStorage.getItem('selectedRegion');
      const initial = regionParam || saved;
      if (initial) setSelectedRegion(initial);
    } catch (e) {
      // ignore
    }
  }, []);

  // Persist selectedRegion to URL and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      if (selectedRegion) {
        sp.set('region', selectedRegion);
        const q = sp.toString();
        router.replace(`${pathname}?${q}`, { scroll: false });
        localStorage.setItem('selectedRegion', selectedRegion);
      } else {
        sp.delete('region');
        const q = sp.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
        localStorage.removeItem('selectedRegion');
      }
    } catch (e) {
      // ignore
    }
  }, [selectedRegion, router, pathname]);

  // Initialize selectedCounty from URL or localStorage when counties are loaded
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!counties.length) return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const countyParam = sp.get('county') || localStorage.getItem('selectedCountyCode');
      if (countyParam) {
        const c = counties.find(x => x.code === countyParam);
        if (c) setSelectedCounty(c);
      }
    } catch (e) {
      // ignore
    }
  }, [counties]);

  // Persist selectedCounty to URL and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      if (selectedCounty) {
        sp.set('county', selectedCounty.code);
        const q = sp.toString();
        router.replace(`${pathname}?${q}`, { scroll: false });
        localStorage.setItem('selectedCountyCode', selectedCounty.code);
      } else {
        sp.delete('county');
        const q = sp.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
        localStorage.removeItem('selectedCountyCode');
      }
    } catch (e) {
      // ignore
    }
  }, [selectedCounty, router, pathname]);

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

  // Regions list and filtered counties
  const regions = Array.from(new Set(counties.map(c => c.region).filter(Boolean))) as string[];

  const filteredCounties = counties
    .filter(county => !selectedRegion || county.region === selectedRegion);


  // Region summary (when a region is selected)
  const regionCounties = selectedRegion ? counties.filter(c => c.region === selectedRegion) : [];
  const totalVotersInRegion = regionCounties.reduce((sum, c) => sum + (c.registered_voters_2022 ?? 0), 0);
  const countyCodesInRegion = new Set(regionCounties.map(c => c.code));
  const turnoutsInRegion = electionResults
    .filter(r => countyCodesInRegion.has(r.county_code))
    .map(r => Number(r.turnout_percentage))
    .filter(n => !Number.isNaN(n));
  const avgTurnoutInRegion = turnoutsInRegion.length
    ? turnoutsInRegion.reduce((a, b) => a + b, 0) / turnoutsInRegion.length
    : null;

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
                Electoral Forecasting
                <span className="ml-2 sm:ml-3 px-2 sm:px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs sm:text-sm font-medium">
                  2027
                </span>
              </h1>
                                <p className="mt-2 text-blue-100 text-base">
                                  Electoral Forecasting & Political Analysis
                                </p>
                                <p className="mt-1 text-blue-200 text-sm">
                                  Kenya's most comprehensive political forecasting platform. Advanced Bayesian AI models, official IEBC data, and probabilistic predictions for the 2027 elections.
                                </p>            </div>
            <div className="hidden lg:flex items-center space-x-3">
              <ShareButton
                title={`BlockcertAfrica - ${selectedCounty ? selectedCounty.name : 'National'} Forecast`}
                text={`Check out the ${selectedCounty ? selectedCounty.name : 'national'} election forecast on BlockcertAfrica`}
              />
              <a
                href="/admin"
                className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-lg transition-all font-semibold shadow-md hover:shadow-lg"
              >
                 Admin Tools
              </a>
              <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg px-4 py-3 border-2 border-white border-opacity-40 shadow-lg">
                <p className="text-xs text-white uppercase tracking-wider font-semibold">Compliance</p>
                <p className="text-sm font-bold text-white mt-0.5">Data Protection Act 2019</p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg px-4 py-3 border-2 border-white border-opacity-40 shadow-lg">
                <p className="text-xs text-white uppercase tracking-wider font-semibold">Last Update</p>
                <p className="text-sm font-bold text-white mt-0.5">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
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
              Geographic Analysis
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

        {/* Geographic Analysis */}
        {viewMode === 'regional' && (
          <div className="space-y-8">

            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">County Forecasts</h2>
                <p className="text-blue-100">
                  Explore election predictions and historical data by county
                </p>
                <p className="text-sm text-blue-200 mt-2">
                  💡 Looking for voter registration data and polling stations? Visit the{' '}
                  <a href="/explorer" className="underline hover:text-white font-semibold">
                    Geographic Explorer →
                  </a>
                </p>
              </div>

              {/* Filters Toolbar */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                  <div className="flex-1">
                    <label htmlFor="election-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Election
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
                    <p className="mt-1 text-xs text-gray-500">Tip: Switch years to compare historical vs current forecasts.</p>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Find a county
                    </label>
                    <CountySearch
                      counties={counties}
                      onSelect={(county) => setSelectedCounty(county)}
                      selectedCounty={selectedCounty}
                      placeholder="Type county name or code..."
                    />
                  </div>

                  {selectedCounty && (
                    <button
                      onClick={() => setSelectedCounty(null)}
                      className="self-start lg:self-auto inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                    >
                      Reset selection
                    </button>
                  )}
                </div>

                  {/* Region Filter */}
                  <div className="mt-2 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Regions</label>
                    {regions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedRegion(null)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            !selectedRegion
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          All
                        </button>
                        {regions.map((region) => (
                          <button
                            key={region}
                            onClick={() => setSelectedRegion(region)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              selectedRegion === region
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {region}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No region metadata available.</p>
                    )}
                  </div>

              </div>

              {/* Region Summary Chips */}
              {selectedRegion && regionCounties.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
                    <p className="text-xs text-gray-500">Total registered voters</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-900">
                      {totalVotersInRegion.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
                    <p className="text-xs text-gray-500">Average turnout</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-900">
                      {avgTurnoutInRegion !== null ? `${avgTurnoutInRegion.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
                    <p className="text-xs text-gray-500">Counties in region</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-900">
                      {regionCounties.length}
                    </p>
                  </div>
                </div>
              )}


              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* County Map */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:col-span-7">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <span className="mr-2">🗺️</span>
                      Interactive County Map
                    </h2>
                    <div className="inline-flex bg-gray-100 rounded-md p-0.5 text-xs">
                      {(['turnout','winner','registered'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setColorBy(mode)}
                          className={`px-2.5 py-1 rounded ${colorBy === mode ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                          aria-pressed={colorBy === mode}
                        >
                          {mode === 'turnout' ? 'Turnout' : mode === 'winner' ? 'Winner' : 'Registered'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <LeafletCountyMap
                    counties={filteredCounties}
                    selectedCounty={selectedCounty}
                    onCountyClick={handleCountyClick}
                    electionResults={electionResults}
                    colorBy={colorBy}
                  />
                </div>

                {/* Forecast Chart with Tabs */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:col-span-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedCounty ? `${selectedCounty.name} County` : 'Select a County'}
                    </h2>
                    {selectedCounty && (
                      <div className="flex items-center gap-2">
                        {pinnedCounty?.code === selectedCounty.code ? (
                          <button
                            onClick={() => setPinnedCounty(null)}
                            className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm border-red-200 text-red-700 hover:bg-red-50"
                          >
                            Unpin
                          </button>
                        ) : (
                          <button
                            onClick={() => setPinnedCounty(selectedCounty)}
                            className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            Pin this county
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedCounty ? (
                    <div>
                      {/* Tab Navigation */}
                      <div className="mb-6">
                        <nav className="flex items-center gap-2" aria-label="Tabs">
                          <button
                            onClick={() => setActiveTab('historical')}
                            className={`${
                              activeTab === 'historical'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors`}
                          >
                            📊 Historical
                          </button>
                          <button
                            onClick={() => setActiveTab('forecast')}
                            className={`${
                              activeTab === 'forecast'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors`}
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

              {/* Pinned County (Comparison) */}
              {pinnedCounty && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      📌 Pinned: {pinnedCounty.name} County
                    </h3>
                    <button
                      onClick={() => setPinnedCounty(null)}
                      className="text-sm text-red-600 hover:text-red-700 underline"
                    >
                      Unpin
                    </button>
                  </div>
                  <ForecastWithUncertainty countyCode={pinnedCounty.code} electionYear={2027} />
                </div>
              )}


              {/* County List */}
              {( selectedRegion && filteredCounties.length > 0 ) && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📋</span>
                    Filtered Counties ({filteredCounties.length})
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
          </div>
        )}

        {/* Candidate Comparison */}
        {viewMode === 'comparison' && (
          <CandidateComparison />
        )}
      </main>
    </div>
  );
}

