'use client';

import { useState, useEffect } from 'react';

interface County {
  code: string;
  name: string;
  region?: string;
  population_2019: number;
  registered_voters_2022: number;
}

interface SearchFilters {
  query: string;
  regions: string[];
  populationRange: [number, number];
  votersRange: [number, number];
  competitiveness?: ('safe' | 'lean' | 'tossup')[];
}

interface AdvancedSearchProps {
  counties: County[];
  onFilterChange: (filtered: County[]) => void;
  onSaveSearch?: (name: string, filters: SearchFilters) => void;
  savedSearches?: { name: string; filters: SearchFilters }[];
}

export default function AdvancedSearch({
  counties,
  onFilterChange,
  onSaveSearch,
  savedSearches = [],
}: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    regions: [],
    populationRange: [0, 10000000],
    votersRange: [0, 5000000],
    competitiveness: [],
  });

  const [searchName, setSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Extract unique regions
  const regions = Array.from(new Set(counties.map(c => c.region).filter(Boolean))) as string[];

  // Apply filters
  useEffect(() => {
    let filtered = counties;

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        c.region?.toLowerCase().includes(query)
      );
    }

    // Region filter
    if (filters.regions.length > 0) {
      filtered = filtered.filter(c => c.region && filters.regions.includes(c.region));
    }

    // Population range
    filtered = filtered.filter(c =>
      c.population_2019 >= filters.populationRange[0] &&
      c.population_2019 <= filters.populationRange[1]
    );

    // Voters range
    filtered = filtered.filter(c =>
      c.registered_voters_2022 >= filters.votersRange[0] &&
      c.registered_voters_2022 <= filters.votersRange[1]
    );

    onFilterChange(filtered);
  }, [filters, counties, onFilterChange]);

  const handleRegionToggle = (region: string) => {
    setFilters(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region],
    }));
  };

  const handleSaveSearch = () => {
    if (searchName && onSaveSearch) {
      onSaveSearch(searchName, filters);
      setSearchName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoadSearch = (savedFilters: SearchFilters) => {
    setFilters(savedFilters);
    setIsExpanded(true);
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      regions: [],
      populationRange: [0, 10000000],
      votersRange: [0, 5000000],
      competitiveness: [],
    });
  };

  const activeFiltersCount = 
    (filters.query ? 1 : 0) +
    filters.regions.length +
    (filters.populationRange[0] > 0 || filters.populationRange[1] < 10000000 ? 1 : 0) +
    (filters.votersRange[0] > 0 || filters.votersRange[1] < 5000000 ? 1 : 0);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">🔍 Advanced Search</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
              {activeFiltersCount} active
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Basic Search */}
      <div className="mb-4">
        <input
          type="text"
          value={filters.query}
          onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
          placeholder="Search by name, code, or region..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-6 border-t border-gray-200 pt-4">
          {/* Regions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regions
            </label>
            <div className="flex flex-wrap gap-2">
              {regions.map(region => (
                <button
                  key={region}
                  onClick={() => handleRegionToggle(region)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.regions.includes(region)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Population Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Population Range: {filters.populationRange[0].toLocaleString()} - {filters.populationRange[1].toLocaleString()}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="10000000"
                step="100000"
                value={filters.populationRange[0]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  populationRange: [parseInt(e.target.value), prev.populationRange[1]],
                }))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="10000000"
                step="100000"
                value={filters.populationRange[1]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  populationRange: [prev.populationRange[0], parseInt(e.target.value)],
                }))}
                className="flex-1"
              />
            </div>
          </div>

          {/* Voters Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registered Voters: {filters.votersRange[0].toLocaleString()} - {filters.votersRange[1].toLocaleString()}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="5000000"
                step="50000"
                value={filters.votersRange[0]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  votersRange: [parseInt(e.target.value), prev.votersRange[1]],
                }))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="5000000"
                step="50000"
                value={filters.votersRange[1]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  votersRange: [prev.votersRange[0], parseInt(e.target.value)],
                }))}
                className="flex-1"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              💾 Save Search
            </button>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Saved Searches</h4>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((saved, index) => (
              <button
                key={index}
                onClick={() => handleLoadSearch(saved.filters)}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
              >
                📌 {saved.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Search</h3>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Enter search name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!searchName}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

