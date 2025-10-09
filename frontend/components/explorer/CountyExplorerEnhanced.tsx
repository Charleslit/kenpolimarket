'use client';

import { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Home, Map as MapIcon } from 'lucide-react';
import ExportButton from '../common/ExportButton';
import dynamic from 'next/dynamic';
import YearSelector from '../common/YearSelector';
import { exportTableToPDF, exportObjectsToCSV } from '@/utils/exportUtils';
import VoterStatisticsPanel from './VoterStatisticsPanel';

// Dynamically import Leaflet map to avoid SSR issues
const LeafletInteractiveMap = dynamic(
  () => import('./LeafletInteractiveMap'),
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface County {
  id: number;
  code: string;
  name: string;
  population_2019?: number;
  registered_voters_2022?: number;
}

interface Constituency {
  id: number;
  code: string;
  name: string;
  county_id: number;
  registered_voters_2022?: number;
}

interface Ward {
  id: number;
  code: string;
  name: string;
  constituency_id: number;
  population_2019?: number;
  registered_voters_2022?: number;
}

interface PollingStation {
  id: number;
  code: string;
  name: string;
  ward_id: number;
  registration_center_code?: string;
  registration_center_name?: string;
  registered_voters_2022?: number;
}

interface Breadcrumb {
  level: 'national' | 'county' | 'constituency' | 'ward' | 'polling_station';
  id?: number;
  name: string;
  voters?: number;
}

interface VoterStatistics {
  level: string;
  id: number;
  name: string;
  code?: string;
  total_registered_voters: number;
  male_voters: number;
  female_voters: number;
  pwd_voters: number;
  male_percentage: number;
  female_percentage: number;
  pwd_percentage: number;
  election_year: number;
  parent_name?: string;
}

export default function CountyExplorerEnhanced() {
  const [counties, setCounties] = useState<County[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [pollingStations, setPollingStations] = useState<PollingStation[]>([]);
  const [loading, setLoading] = useState(true);

  // Voter demographics state
  const [voterStatistics, setVoterStatistics] = useState<VoterStatistics | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [compareId, setCompareId] = useState<number | null>(null);
  const [compareStats, setCompareStats] = useState<VoterStatistics | null>(null);

  // Navigation state
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([
    { level: 'national', name: 'Kenya' }
  ]);
  const [currentLevel, setCurrentLevel] = useState<'national' | 'county' | 'constituency' | 'ward' | 'polling_station'>('national');
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [selectedConstituency, setSelectedConstituency] = useState<Constituency | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [selectedPollingStation, setSelectedPollingStation] = useState<PollingStation | null>(null);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');

  // Map view toggle
  const [showMap, setShowMap] = useState(true);

  // Choropleth metric
  const [colorMetric, setColorMetric] = useState<'none'|'total'|'male_pct'|'female_pct'|'pwd_pct'>('none');
  const [choroplethData, setChoroplethData] = useState<Record<string, number> | undefined>(undefined);

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

  const fetchPollingStations = async (wardId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/polling_stations/?ward_id=${wardId}`);
      const data = await response.json();
      setPollingStations(data);
    } catch (error) {
      console.error('Failed to fetch polling stations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build choropleth data when metric or selection changes
  useEffect(() => {
    const build = async () => {
      if (colorMetric === 'none') { setChoroplethData(undefined); return; }
      try {
        if (currentLevel === 'national') {
          // Use county registered voters for total; percentages require API by county (optional later)
          if (colorMetric === 'total') {
            const map: Record<string, number> = {};
            counties.forEach(c => { if (c.registered_voters_2022) map[c.name.toLowerCase()] = c.registered_voters_2022; });
            setChoroplethData(map);
          } else {
            setChoroplethData(undefined);
          }
        } else if (currentLevel === 'county' && selectedCounty) {
          const map: Record<string, number> = {};
          await Promise.all(constituencies.map(async (c) => {
            const res = await fetch(`${API_BASE_URL}/voter-demographics/constituencies/${c.id}?year=${selectedYear === 'all' ? 2022 : selectedYear}`);
            if (res.ok) {
              const d = await res.json();
              const key = c.name.toLowerCase();
              if (colorMetric === 'total') map[key] = d.total_registered_voters;
              if (colorMetric === 'male_pct') map[key] = d.male_percentage;
              if (colorMetric === 'female_pct') map[key] = d.female_percentage;
              if (colorMetric === 'pwd_pct') map[key] = d.pwd_percentage;
            }
          }));
          setChoroplethData(map);
        } else if (currentLevel === 'constituency' && selectedConstituency) {
          const map: Record<string, number> = {};
          await Promise.all(wards.map(async (w) => {
            const res = await fetch(`${API_BASE_URL}/voter-demographics/wards/${w.id}?year=${selectedYear === 'all' ? 2022 : selectedYear}`);
            if (res.ok) {
              const d = await res.json();
              const key = w.name.toLowerCase();
              if (colorMetric === 'total') map[key] = d.total_registered_voters;
              if (colorMetric === 'male_pct') map[key] = d.male_percentage;
              if (colorMetric === 'female_pct') map[key] = d.female_percentage;
              if (colorMetric === 'pwd_pct') map[key] = d.pwd_percentage;
            }
          }));
          setChoroplethData(map);
        } else {
          setChoroplethData(undefined);
        }
      } catch (e) {
        console.error('Failed building choropleth data', e);
        setChoroplethData(undefined);
      }
    };
    build();
  }, [colorMetric, currentLevel, counties, constituencies, wards, selectedCounty, selectedConstituency, selectedYear]);

  // Fetch voter demographics
  const fetchVoterDemographics = async (level: string, id: number) => {
    setStatisticsLoading(true);
    try {
      const endpoint = level === 'county' ? 'counties' :
                      level === 'constituency' ? 'constituencies' :
                      level === 'ward' ? 'wards' :
                      level === 'polling_station' ? 'polling-stations' : null;

      if (!endpoint) {
        setVoterStatistics(null);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/voter-demographics/${endpoint}/${id}?year=${selectedYear === 'all' ? 2022 : selectedYear}`
      );

      if (response.ok) {
        const data = await response.json();
        setVoterStatistics(data);
      } else {
        console.log(`No demographics data available for ${level} ${id}`);
        setVoterStatistics(null);
      }
    } catch (error) {
      console.error('Error fetching voter demographics:', error);
      setVoterStatistics(null);
    } finally {
      setStatisticsLoading(false);
    }
  };

  const handleCountyClick = (county: County) => {
    setSelectedCounty(county);
    setSelectedConstituency(null);
    setSelectedWard(null);
    setSelectedPollingStation(null);
    setCurrentLevel('county');
    setBreadcrumbs([
      { level: 'national', name: 'Kenya' },
      { level: 'county', id: county.id, name: county.name, voters: county.registered_voters_2022 }
    ]);
    fetchConstituencies(county.id);
    fetchVoterDemographics('county', county.id);
    setSearchTerm('');
  };

  const handleConstituencyClick = (constituency: Constituency) => {
    setSelectedConstituency(constituency);
    setSelectedWard(null);
    setSelectedPollingStation(null);
    setCurrentLevel('constituency');
    setBreadcrumbs([
      { level: 'national', name: 'Kenya' },
      { level: 'county', id: selectedCounty!.id, name: selectedCounty!.name, voters: selectedCounty!.registered_voters_2022 },
      { level: 'constituency', id: constituency.id, name: constituency.name, voters: constituency.registered_voters_2022 }
    ]);
    fetchWards(constituency.id);
    fetchVoterDemographics('constituency', constituency.id);
    setSearchTerm('');
  };

  const handleWardClick = (ward: Ward) => {
    setSelectedWard(ward);
    setSelectedPollingStation(null);
    setCurrentLevel('ward');
    setBreadcrumbs([
      { level: 'national', name: 'Kenya' },
      { level: 'county', id: selectedCounty!.id, name: selectedCounty!.name, voters: selectedCounty!.registered_voters_2022 },
      { level: 'constituency', id: selectedConstituency!.id, name: selectedConstituency!.name, voters: selectedConstituency!.registered_voters_2022 },
      { level: 'ward', id: ward.id, name: ward.name, voters: ward.registered_voters_2022 }
    ]);
    fetchPollingStations(ward.id);
    fetchVoterDemographics('ward', ward.id);
    setSearchTerm('');
  };

  const handlePollingStationClick = (pollingStation: PollingStation) => {
    setSelectedPollingStation(pollingStation);
    setCurrentLevel('polling_station');
    setBreadcrumbs([
      { level: 'national', name: 'Kenya' },
      { level: 'county', id: selectedCounty!.id, name: selectedCounty!.name, voters: selectedCounty!.registered_voters_2022 },
      { level: 'constituency', id: selectedConstituency!.id, name: selectedConstituency!.name, voters: selectedConstituency!.registered_voters_2022 },
      { level: 'ward', id: selectedWard!.id, name: selectedWard!.name, voters: selectedWard!.registered_voters_2022 },
      { level: 'polling_station', id: pollingStation.id, name: pollingStation.name, voters: pollingStation.registered_voters_2022 }
    ]);
    fetchVoterDemographics('polling_station', pollingStation.id);
    setSearchTerm('');
  };

  const handleBreadcrumbClick = (index: number) => {
    const breadcrumb = breadcrumbs[index];

    if (breadcrumb.level === 'national') {
      setCurrentLevel('national');
      setSelectedCounty(null);
      setSelectedConstituency(null);
      setSelectedWard(null);
      setSelectedPollingStation(null);
      setBreadcrumbs([{ level: 'national', name: 'Kenya' }]);
      setConstituencies([]);
      setWards([]);
      setPollingStations([]);
    } else if (breadcrumb.level === 'county') {
      setCurrentLevel('county');
      setSelectedConstituency(null);
      setSelectedWard(null);
      setSelectedPollingStation(null);
      setBreadcrumbs(breadcrumbs.slice(0, 2));
      setWards([]);
      setPollingStations([]);
    } else if (breadcrumb.level === 'constituency') {
      setCurrentLevel('constituency');
      setSelectedWard(null);
      setSelectedPollingStation(null);
      setBreadcrumbs(breadcrumbs.slice(0, 3));
      setPollingStations([]);
    } else if (breadcrumb.level === 'ward') {
      setCurrentLevel('ward');
      setSelectedPollingStation(null);
      setBreadcrumbs(breadcrumbs.slice(0, 4));
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

  const filteredPollingStations = pollingStations.filter(ps =>
    ps.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ps.code.includes(searchTerm) ||
    (ps.registration_center_name && ps.registration_center_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Export Functions
  const handleExportPDF = () => {
    if (currentLevel === 'national' && counties.length > 0) {
      exportTableToPDF(
        'Kenya Counties',
        ['Code', 'County Name', 'Population (2019)', 'Registered Voters (2022)'],
        counties.map(c => [
          c.code,
          c.name,
          c.population_2019?.toLocaleString() || 'N/A',
          c.registered_voters_2022?.toLocaleString() || 'N/A'
        ])
      );
    } else if (currentLevel === 'county' && constituencies.length > 0) {
      exportTableToPDF(
        `${selectedCounty?.name} Constituencies`,
        ['Code', 'Constituency Name', 'Registered Voters (2022)'],
        constituencies.map(c => [
          c.code,
          c.name,
          c.registered_voters_2022?.toLocaleString() || 'N/A'
        ])
      );
    } else if (currentLevel === 'constituency' && wards.length > 0) {
      exportTableToPDF(
        `${selectedConstituency?.name} Wards`,
        ['Code', 'Ward Name', 'Registered Voters (2022)'],
        wards.map(w => [
          w.code,
          w.name,
          w.registered_voters_2022?.toLocaleString() || 'N/A'
        ])
      );
    } else if (currentLevel === 'ward' && pollingStations.length > 0) {
      exportTableToPDF(
        `${selectedWard?.name} Polling Stations`,
        ['Code', 'Polling Station Name', 'Registered Voters (2022)'],
        pollingStations.map(ps => [
          ps.code,
          ps.name,
          ps.registered_voters_2022?.toLocaleString() || 'N/A'
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
        'Registered Voters 2022': c.registered_voters_2022 || 0
      }));
      exportObjectsToCSV(csvData, 'KenPoliMarket_Counties.csv');
    } else if (currentLevel === 'county' && constituencies.length > 0) {
      const csvData = constituencies.map(c => ({
        Code: c.code,
        'Constituency Name': c.name,
        County: selectedCounty?.name || '',
        'Registered Voters 2022': c.registered_voters_2022 || 0
      }));
      exportObjectsToCSV(csvData, `KenPoliMarket_${selectedCounty?.name}_Constituencies.csv`);
    } else if (currentLevel === 'constituency' && wards.length > 0) {
      const csvData = wards.map(w => ({
        Code: w.code,
        'Ward Name': w.name,
        Constituency: selectedConstituency?.name || '',
        County: selectedCounty?.name || '',
        'Registered Voters 2022': w.registered_voters_2022 || 0
      }));
      exportObjectsToCSV(csvData, `KenPoliMarket_${selectedConstituency?.name}_Wards.csv`);
    } else if (currentLevel === 'ward' && pollingStations.length > 0) {
      const csvData = pollingStations.map(ps => ({
        Code: ps.code,
        'Polling Station Name': ps.name,
        Ward: selectedWard?.name || '',
        'Registration Center': ps.registration_center_name || '',
        'Registered Voters 2022': ps.registered_voters_2022 || 0
      }));
      exportObjectsToCSV(csvData, `KenPoliMarket_${selectedWard?.name}_PollingStations.csv`);
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
          Navigate through Kenya's administrative divisions: Counties → Constituencies → Wards → Polling Stations
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
                <span>
                  {crumb.name}
                  {crumb.voters && (
                    <span className="ml-2 text-xs opacity-75">
                      ({(crumb.voters / 1000).toFixed(0)}K voters)
                    </span>
                  )}
                </span>
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
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Color by</label>
            <select
              value={colorMetric}
              onChange={(e) => setColorMetric(e.target.value as any)}
              className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="none">None</option>
              <option value="total">Total voters</option>
              <option value="male_pct">Male %</option>
              <option value="female_pct">Female %</option>
              <option value="pwd_pct">PWD %</option>
            </select>
          </div>
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

      {/* Map and Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map */}
        {showMap && (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-blue-600" />
              Interactive Map with Leaflet
            </h3>
            <LeafletInteractiveMap
              level={currentLevel === 'polling_station' ? 'ward' : currentLevel}
              countyId={selectedCounty?.id}
              constituencyId={selectedConstituency?.id}
              wardId={selectedWard?.id}
              selectedYear={selectedYear}
              choroplethData={colorMetric==='none' ? undefined : choroplethData}
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

        {/* Voter Statistics Panel */}
        <div className={showMap ? 'lg:col-span-1' : 'lg:col-span-3'}>
          <VoterStatisticsPanel
            statistics={voterStatistics}
            loading={statisticsLoading}
          />
          {/* Compare selector */}
          {(currentLevel==='county' || currentLevel==='constituency') && (
            <div className="mt-4 bg-white rounded-lg border p-3">
              <label className="text-sm text-gray-700 mr-2">Compare with:</label>
              <select
                className="text-sm border rounded px-2 py-1"
                value={compareId ?? ''}
                onChange={async (e)=>{
                  const val = e.target.value ? Number(e.target.value) : null;
                  setCompareId(val);
                  if (!val) { setCompareStats(null); return; }
                  const endpoint = currentLevel==='county' ? 'constituencies' : 'wards';
                  const res = await fetch(`${API_BASE_URL}/voter-demographics/${endpoint}/${val}?year=${selectedYear === 'all' ? 2022 : selectedYear}`);
                  if (res.ok) setCompareStats(await res.json());
                }}
              >
                <option value="">Select...</option>
                {currentLevel==='county' && constituencies.map(c=> (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                {currentLevel==='constituency' && wards.map(w=> (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
          {compareStats && (
            <div className="mt-4">
              <VoterStatisticsPanel statistics={compareStats} loading={false} />
            </div>
          )}
        </div>
      </div>

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
                        {constituency.registered_voters_2022 && (
                          <p className="text-sm text-gray-500">
                            Voters: {constituency.registered_voters_2022.toLocaleString()}
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

        {/* Ward Level - Polling Stations */}
        {currentLevel === 'ward' && (
          <div>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Polling Stations in {selectedWard?.name} ({filteredPollingStations.length})
              </h3>
              {selectedWard?.registered_voters_2022 && (
                <p className="text-sm text-gray-600 mt-1">
                  Total Registered Voters: {selectedWard.registered_voters_2022.toLocaleString()}
                </p>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading polling stations...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {filteredPollingStations.map((pollingStation) => (
                  <button
                    key={pollingStation.id}
                    onClick={() => handlePollingStationClick(pollingStation)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                          {pollingStation.name}
                        </h4>
                        <p className="text-xs text-gray-500 mb-1">Code: {pollingStation.code}</p>
                        {pollingStation.registration_center_name && (
                          <p className="text-xs text-gray-500 mb-1">
                            Center: {pollingStation.registration_center_name}
                          </p>
                        )}
                        {pollingStation.registered_voters_2022 && (
                          <p className="text-sm text-blue-600 font-medium">
                            {pollingStation.registered_voters_2022.toLocaleString()} voters
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

        {/* Polling Station Level - Details */}
        {currentLevel === 'polling_station' && selectedPollingStation && (
          <div>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedPollingStation.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Polling Station Details
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500">Code</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedPollingStation.code}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Name</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedPollingStation.name}</dd>
                    </div>
                    {selectedPollingStation.registration_center_name && (
                      <div>
                        <dt className="text-xs text-gray-500">Registration Center</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {selectedPollingStation.registration_center_name}
                        </dd>
                      </div>
                    )}
                    {selectedPollingStation.registration_center_code && (
                      <div>
                        <dt className="text-xs text-gray-500">Center Code</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {selectedPollingStation.registration_center_code}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Voter Statistics</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500">Registered Voters (2022)</dt>
                      <dd className="text-2xl font-bold text-green-700">
                        {selectedPollingStation.registered_voters_2022?.toLocaleString() || 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Location Hierarchy</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>County: {selectedCounty?.name}</p>
                  <p>Constituency: {selectedConstituency?.name}</p>
                  <p>Ward: {selectedWard?.name}</p>
                  <p>Polling Station: {selectedPollingStation.name}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

