'use client';

import { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Home, Map as MapIcon } from 'lucide-react';
import ExportButton from '../common/ExportButton';
import InteractiveMap from './InteractiveMap';
import YearSelector from '../common/YearSelector';
import { exportTableToPDF, exportObjectsToCSV } from '@/utils/exportUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface County {
  id: number;
  code: string;
  name: string;
  population_2019?: number;
  registered_voters?: number;
}

interface Constituency {
  id: number;
  code: string;
  name: string;
  county_id: number;
  registered_voters?: number;
}

interface Ward {
  id: number;
  code: string;
  name: string;
  constituency_id: number;
  population_2019?: number;
}

interface Breadcrumb {
  level: 'national' | 'county' | 'constituency' | 'ward';
  id?: number;
  name: string;
}

export default function CountyExplorerEnhanced() {
  const [counties, setCounties] = useState<County[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation state
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([
    { level: 'national', name: 'Kenya' }
  ]);
  const [currentLevel, setCurrentLevel] = useState<'national' | 'county' | 'constituency' | 'ward'>('national');
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [selectedConstituency, setSelectedConstituency] = useState<Constituency | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');

  // Map view toggle
  const [showMap, setShowMap] = useState(true);

  // Year selection
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(2022);

  useEffect(() => {
    fetchCounties();
  }, []);

  const fetchCounties = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/counties/`);
      const data = await response.json();
      setCounties(data);
    } catch (error) {
      console.error('Failed to fetch counties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConstituencies = async (countyId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/constituencies/?county_id=${countyId}`);
      const data = await response.json();
      setConstituencies(data);
    } catch (error) {
      console.error('Failed to fetch constituencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWards = async (constituencyId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/wards/?constituency_id=${constituencyId}`);
      const data = await response.json();
      setWards(data);
    } catch (error) {
      console.error('Failed to fetch wards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCountyClick = (county: County) => {
    setSelectedCounty(county);
    setSelectedConstituency(null);
    setSelectedWard(null);
    setCurrentLevel('county');
    setBreadcrumbs([
      { level: 'national', name: 'Kenya' },
      { level: 'county', id: county.id, name: county.name }
    ]);
    fetchConstituencies(county.id);
    setSearchTerm('');
  };

  const handleConstituencyClick = (constituency: Constituency) => {
    setSelectedConstituency(constituency);
    setSelectedWard(null);
    setCurrentLevel('constituency');
    setBreadcrumbs([
      { level: 'national', name: 'Kenya' },
      { level: 'county', id: selectedCounty!.id, name: selectedCounty!.name },
      { level: 'constituency', id: constituency.id, name: constituency.name }
    ]);
    fetchWards(constituency.id);
    setSearchTerm('');
  };

  const handleWardClick = (ward: Ward) => {
    setSelectedWard(ward);
    setCurrentLevel('ward');
    setBreadcrumbs([
      { level: 'national', name: 'Kenya' },
      { level: 'county', id: selectedCounty!.id, name: selectedCounty!.name },
      { level: 'constituency', id: selectedConstituency!.id, name: selectedConstituency!.name },
      { level: 'ward', id: ward.id, name: ward.name }
    ]);
    setSearchTerm('');
  };

  const handleBreadcrumbClick = (index: number) => {
    const breadcrumb = breadcrumbs[index];
    
    if (breadcrumb.level === 'national') {
      setCurrentLevel('national');
      setSelectedCounty(null);
      setSelectedConstituency(null);
      setSelectedWard(null);
      setBreadcrumbs([{ level: 'national', name: 'Kenya' }]);
      setConstituencies([]);
      setWards([]);
    } else if (breadcrumb.level === 'county') {
      setCurrentLevel('county');
      setSelectedConstituency(null);
      setSelectedWard(null);
      setBreadcrumbs(breadcrumbs.slice(0, 2));
      setWards([]);
    } else if (breadcrumb.level === 'constituency') {
      setCurrentLevel('constituency');
      setSelectedWard(null);
      setBreadcrumbs(breadcrumbs.slice(0, 3));
    }
    
    setSearchTerm('');
  };

  // Filter items based on search
  const filteredCounties = counties.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.includes(searchTerm)
  );

  const filteredConstituencies = constituencies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.includes(searchTerm)
  );

  const filteredWards = wards.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.code.includes(searchTerm)
  );

  // Export Functions
  const handleExportPDF = () => {
    if (currentLevel === 'national' && counties.length > 0) {
      exportTableToPDF(
        'Kenya Counties',
        ['Code', 'County Name', 'Population (2019)', 'Registered Voters'],
        counties.map(c => [
          c.code,
          c.name,
          c.population_2019?.toLocaleString() || 'N/A',
          c.registered_voters?.toLocaleString() || 'N/A'
        ])
      );
    } else if (currentLevel === 'county' && constituencies.length > 0) {
      exportTableToPDF(
        `${selectedCounty?.name} Constituencies`,
        ['Code', 'Constituency Name', 'Registered Voters'],
        constituencies.map(c => [
          c.code,
          c.name,
          c.registered_voters?.toLocaleString() || 'N/A'
        ])
      );
    } else if (currentLevel === 'constituency' && wards.length > 0) {
      exportTableToPDF(
        `${selectedConstituency?.name} Wards`,
        ['Code', 'Ward Name', 'Population (2019)'],
        wards.map(w => [
          w.code,
          w.name,
          w.population_2019?.toLocaleString() || 'N/A'
        ])
      );
    }
  };

  const handleExportCSV = () => {
    if (currentLevel === 'national' && counties.length > 0) {
      const csvData = counties.map(c => ({
        Code: c.code,
        'County Name': c.name,
        'Population 2019': c.population_2019 || 0,
        'Registered Voters': c.registered_voters || 0
      }));
      exportObjectsToCSV(csvData, 'KenPoliMarket_Counties.csv');
    } else if (currentLevel === 'county' && constituencies.length > 0) {
      const csvData = constituencies.map(c => ({
        Code: c.code,
        'Constituency Name': c.name,
        County: selectedCounty?.name || '',
        'Registered Voters': c.registered_voters || 0
      }));
      exportObjectsToCSV(csvData, `KenPoliMarket_${selectedCounty?.name}_Constituencies.csv`);
    } else if (currentLevel === 'constituency' && wards.length > 0) {
      const csvData = wards.map(w => ({
        Code: w.code,
        'Ward Name': w.name,
        Constituency: selectedConstituency?.name || '',
        County: selectedCounty?.name || '',
        'Population 2019': w.population_2019 || 0
      }));
      exportObjectsToCSV(csvData, `KenPoliMarket_${selectedConstituency?.name}_Wards.csv`);
    }
  };

  if (loading && currentLevel === 'national') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading counties...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Geographic Explorer</h2>
        <p className="text-blue-100">
          Navigate through Kenya's administrative divisions: Counties → Constituencies → Wards
        </p>
      </div>

      {/* Year Selector */}
      <YearSelector
        selectedYear={selectedYear}
        onYearChange={(year) => {
          setSelectedYear(year);
          // Refresh data when year changes
          if (currentLevel === 'national') {
            fetchCounties();
          } else if (currentLevel === 'county' && selectedCounty) {
            fetchConstituencies(selectedCounty.id);
          } else if (currentLevel === 'constituency' && selectedConstituency) {
            fetchWards(selectedConstituency.id);
          }
        }}
        availableYears={[2013, 2017, 2022, 2027]}
        showAllOption={true}
      />

      {/* Breadcrumb Navigation */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors ${
                  index === breadcrumbs.length - 1
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {index === 0 && <Home className="w-4 h-4 mr-1" />}
                {crumb.name}
              </button>
            </div>
          ))}
        </nav>
      </div>

      {/* Search Bar, Map Toggle, and Export */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder={`Search ${currentLevel === 'national' ? 'counties' : currentLevel === 'county' ? 'constituencies' : 'wards'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => setShowMap(!showMap)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showMap
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
          <ExportButton
            variant="compact"
            onExportPDF={handleExportPDF}
            onExportCSV={handleExportCSV}
          />
        </div>
      </div>

      {/* Interactive Map */}
      {showMap && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-blue-600" />
            Interactive Map
          </h3>
          <InteractiveMap
            level={currentLevel}
            countyId={selectedCounty?.id}
            constituencyId={selectedConstituency?.id}
            wardId={selectedWard?.id}
            selectedYear={selectedYear}
            onMarkerClick={(marker) => {
              if (marker.type === 'county') {
                handleCountyClick(marker.data);
              } else if (marker.type === 'constituency') {
                handleConstituencyClick(marker.data);
              } else if (marker.type === 'ward') {
                handleWardClick(marker.data);
              }
            }}
          />
        </div>
      )}

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* National Level - Counties */}
        {currentLevel === 'national' && (
          <div>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Counties ({filteredCounties.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredCounties.map((county) => (
                <button
                  key={county.id}
                  onClick={() => handleCountyClick(county)}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {county.name}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-500">Code: {county.code}</p>
                      {county.population_2019 && (
                        <p className="text-sm text-gray-500">
                          Pop: {(county.population_2019 / 1000000).toFixed(2)}M
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* County Level - Constituencies */}
        {currentLevel === 'county' && (
          <div>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Constituencies in {selectedCounty?.name} ({filteredConstituencies.length})
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading constituencies...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {filteredConstituencies.map((constituency) => (
                  <button
                    key={constituency.id}
                    onClick={() => handleConstituencyClick(constituency)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                          {constituency.name}
                        </h4>
                        <p className="text-sm text-gray-500">Code: {constituency.code}</p>
                        {constituency.registered_voters && (
                          <p className="text-sm text-gray-500">
                            Voters: {constituency.registered_voters.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Constituency Level - Wards */}
        {currentLevel === 'constituency' && (
          <div>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Wards in {selectedConstituency?.name} ({filteredWards.length})
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading wards...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {filteredWards.map((ward) => (
                  <button
                    key={ward.id}
                    onClick={() => handleWardClick(ward)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                        {ward.name}
                      </h4>
                      <p className="text-sm text-gray-500">Code: {ward.code}</p>
                      {ward.population_2019 && (
                        <p className="text-sm text-gray-500">
                          Pop: {ward.population_2019.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ward Level - Details */}
        {currentLevel === 'ward' && selectedWard && (
          <div>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedWard.name} Ward Details
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Basic Information</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-blue-700">Ward Code</dt>
                      <dd className="text-lg font-semibold text-blue-900">{selectedWard.code}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-blue-700">Constituency</dt>
                      <dd className="text-lg font-semibold text-blue-900">{selectedConstituency?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-blue-700">County</dt>
                      <dd className="text-lg font-semibold text-blue-900">{selectedCounty?.name}</dd>
                    </div>
                  </dl>
                </div>
                {selectedWard.population_2019 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Demographics</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-green-700">Population (2019)</dt>
                        <dd className="text-lg font-semibold text-green-900">
                          {selectedWard.population_2019.toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

