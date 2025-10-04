'use client';

import { useEffect, useState } from 'react';
import GeographicMap from '@/components/maps/GeographicMap';
import CountyMap from '@/components/maps/CountyMap';
import ForecastWithUncertainty from '@/components/charts/ForecastWithUncertainty';
import HistoricalTrends from '@/components/charts/HistoricalTrends';
import AdvancedSearch from '@/components/search/AdvancedSearch';
import ComprehensiveExport from '@/components/export/ComprehensiveExport';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useSwipeGesture, usePullToRefresh } from '@/hooks/useSwipeGesture';
import { useOfflineStorage, useNetworkStatus } from '@/utils/offlineStorage';
import { useToast } from '@/components/ui/Toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface County {
  code: string;
  name: string;
  region?: string;
  population_2019: number;
  registered_voters_2022: number;
}

interface HistoricalData {
  year: number;
  candidate: string;
  party: string;
  votes: number;
  vote_percentage: number;
  turnout_percentage?: number;
}

export default function EnhancedForecastsPage() {
  const [counties, setCounties] = useState<County[]>([]);
  const [filteredCounties, setFilteredCounties] = useState<County[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid' | 'historical'>('map');
  const [mapType, setMapType] = useState<'geographic' | 'cartogram'>('geographic');

  const { saveOffline, getOffline } = useOfflineStorage();
  const isOnline = useNetworkStatus();
  const { showToast } = useToast();

  // Mock historical data (in production, fetch from API)
  const [historicalData] = useState<HistoricalData[]>([
    { year: 2013, candidate: 'Uhuru Kenyatta', party: 'TNA', votes: 6173433, vote_percentage: 50.07, turnout_percentage: 85.9 },
    { year: 2013, candidate: 'Raila Odinga', party: 'ODM', votes: 5340546, vote_percentage: 43.31, turnout_percentage: 85.9 },
    { year: 2017, candidate: 'Uhuru Kenyatta', party: 'Jubilee', votes: 8203290, vote_percentage: 54.27, turnout_percentage: 78.9 },
    { year: 2017, candidate: 'Raila Odinga', party: 'NASA', votes: 6762224, vote_percentage: 44.74, turnout_percentage: 78.9 },
    { year: 2022, candidate: 'William Ruto', party: 'UDA', votes: 7176141, vote_percentage: 50.49, turnout_percentage: 65.4 },
    { year: 2022, candidate: 'Raila Odinga', party: 'Azimio', votes: 6942930, vote_percentage: 48.85, turnout_percentage: 65.4 },
  ]);

  // Fetch counties
  useEffect(() => {
    fetchCounties();
  }, []);

  const fetchCounties = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get from offline cache first
      const cachedData = await getOffline('counties');
      if (cachedData && !isOnline) {
        setCounties(cachedData);
        setFilteredCounties(cachedData);
        showToast('📱 Loaded from offline cache', 'info');
        setLoading(false);
        return;
      }

      // Fetch from API
      const response = await fetch(`${API_BASE_URL}/counties`);
      if (!response.ok) throw new Error('Failed to fetch counties');

      const data = await response.json();
      setCounties(data);
      setFilteredCounties(data);

      // Save to offline cache
      await saveOffline('counties', data);
    } catch (err) {
      console.error('Error fetching counties:', err);
      
      // Try offline cache on error
      const cachedData = await getOffline('counties');
      if (cachedData) {
        setCounties(cachedData);
        setFilteredCounties(cachedData);
        showToast('📱 Loaded from offline cache', 'info');
      } else {
        setError('Failed to load counties. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const { isPulling, pullDistance } = usePullToRefresh(async () => {
    showToast('🔄 Refreshing...', 'info');
    await fetchCounties();
    showToast('✅ Refreshed!', 'success');
  });

  // Swipe gestures for mobile
  useSwipeGesture({
    onSwipeLeft: () => {
      if (viewMode === 'map') setViewMode('grid');
      else if (viewMode === 'grid') setViewMode('historical');
    },
    onSwipeRight: () => {
      if (viewMode === 'historical') setViewMode('grid');
      else if (viewMode === 'grid') setViewMode('map');
    },
  });

  const handleCountyClick = (countyCode: string) => {
    const county = counties.find(c => c.code === countyCode);
    if (county) {
      setSelectedCounty(county);
      showToast(`Selected: ${county.name}`, 'success');
    }
  };

  const handleFilterChange = (filtered: County[]) => {
    setFilteredCounties(filtered);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} onRetry={fetchCounties} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div
          className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 z-50 transition-transform"
          style={{ transform: `translateY(${Math.min(pullDistance - 80, 0)}px)` }}
        >
          🔄 Release to refresh
        </div>
      )}

      {/* Offline indicator */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-sm">
          📡 You're offline. Showing cached data.
        </div>
      )}

      <Breadcrumbs items={[{ label: 'Enhanced Forecasts', href: '/forecasts-enhanced' }]} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🗳️ Enhanced Election Forecasts
        </h1>
        <p className="text-gray-600">
          Interactive maps, advanced search, historical trends, and comprehensive export
        </p>
      </div>

      {/* View Mode Selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setViewMode('map')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'map'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🗺️ Geographic Map
        </button>
        <button
          onClick={() => setViewMode('grid')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'grid'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📊 Grid View
        </button>
        <button
          onClick={() => setViewMode('historical')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'historical'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📈 Historical Trends
        </button>

        <div className="ml-auto">
          <ComprehensiveExport
            data={filteredCounties}
            filename="kenpolimarket-forecasts"
            availableCounties={counties.map(c => c.code)}
          />
        </div>
      </div>

      {/* Advanced Search */}
      <div className="mb-6">
        <AdvancedSearch
          counties={counties}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Content based on view mode */}
      {viewMode === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Geographic Map</h2>
            <GeographicMap
              counties={filteredCounties}
              selectedCounty={selectedCounty}
              onCountyClick={handleCountyClick}
              colorBy="population"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Grid Map</h2>
            <CountyMap
              counties={filteredCounties}
              selectedCounty={selectedCounty}
              onCountyClick={handleCountyClick}
              electionResults={[]}
            />
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCounties.map(county => (
            <div
              key={county.code}
              onClick={() => handleCountyClick(county.code)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedCounty?.code === county.code
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-400 bg-white'
              }`}
            >
              <h3 className="font-semibold text-lg">{county.name}</h3>
              <p className="text-sm text-gray-600">Code: {county.code}</p>
              <p className="text-sm text-gray-600">
                Population: {county.population_2019.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                Voters: {county.registered_voters_2022.toLocaleString()}
              </p>
              {county.region && (
                <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  {county.region}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'historical' && (
        <HistoricalTrends
          data={historicalData}
          title="Kenya Presidential Elections (2013-2022)"
        />
      )}

      {/* Selected County Details */}
      {selectedCounty && (
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <h2 className="text-2xl font-bold mb-4">{selectedCounty.name} County</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Code</p>
              <p className="text-lg font-semibold">{selectedCounty.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Population (2019)</p>
              <p className="text-lg font-semibold">{selectedCounty.population_2019.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Registered Voters (2022)</p>
              <p className="text-lg font-semibold">{selectedCounty.registered_voters_2022.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Region</p>
              <p className="text-lg font-semibold">{selectedCounty.region || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Total Counties</p>
          <p className="text-2xl font-bold text-blue-600">{counties.length}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Filtered Counties</p>
          <p className="text-2xl font-bold text-green-600">{filteredCounties.length}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Selected</p>
          <p className="text-2xl font-bold text-purple-600">{selectedCounty ? selectedCounty.name : 'None'}</p>
        </div>
      </div>
    </div>
  );
}

