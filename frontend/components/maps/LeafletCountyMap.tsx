'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface County {
  code: string;
  name: string;
  population_2019: number;
  registered_voters_2022: number;
}

type ColorByMode = 'turnout' | 'winner' | 'registered';

interface ElectionResult {
  county_code: string;
  county_name: string;
  candidate_name: string;
  party: string;
  votes: number;
  vote_percentage: number;
  turnout_percentage: number;
}

interface LeafletCountyMapProps {
  counties: County[];
  selectedCounty: County | null;
  onCountyClick: (countyCode: string) => void;
  electionResults: ElectionResult[];
  colorBy?: ColorByMode;
}

// Component to handle map updates
function MapUpdater({ selectedCounty }: { selectedCounty: County | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCounty) {
      // You can add logic to zoom to selected county here
      map.setView([0.0236, 37.9062], 7); // Kenya center
    }
  }, [selectedCounty, map]);

  return null;
}

export default function LeafletCountyMap({
  counties,
  selectedCounty,
  onCountyClick,
  electionResults,
  colorBy = 'turnout',
}: LeafletCountyMapProps) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load GeoJSON data
  useEffect(() => {
    const loadGeoJson = async () => {
      try {
        const response = await fetch('/kenya-counties.geojson');
        if (!response.ok) throw new Error('Failed to load GeoJSON');
        const data = await response.json();
        setGeoJsonData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading GeoJSON:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map data');
        setLoading(false);
      }
    };

    loadGeoJson();
  }, []);

  // Create color scale based on turnout
  const getTurnoutColor = (countyCode: string): string => {
    const result = electionResults.find(r => r.county_code === countyCode);
    if (!result) return '#e5e7eb';

    const turnout = result.turnout_percentage;
    if (turnout >= 80) return '#1e40af';
    if (turnout >= 70) return '#3b82f6';
    if (turnout >= 60) return '#60a5fa';
    if (turnout >= 50) return '#93c5fd';
    return '#dbeafe';
  };

  // Color helpers
  const getWinnerKey = (countyCode: string): string | null => {
    const rows = electionResults.filter(r => r.county_code === countyCode);
    if (!rows.length) return null;
    const top = rows.reduce((max, r) => (r.vote_percentage > max.vote_percentage ? r : max), rows[0]);
    return top.party || top.candidate_name || null;
  };
  const hashToIndex = (key: string, size: number) => {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return h % size;
  };
  const categoricalPalette = ['#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#ea580c', '#0891b2', '#ca8a04', '#9333ea'];
  const getWinnerColor = (key: string | null): string => !key ? '#e5e7eb' : categoricalPalette[hashToIndex(key, categoricalPalette.length)];
  const regValues = counties.map(c => c.registered_voters_2022).filter(v => typeof v === 'number');
  const regMin = regValues.length ? Math.min(...regValues) : 0;
  const regMax = regValues.length ? Math.max(...regValues) : 1;
  const getRegisteredColor = (value: number | undefined): string => {
    if (!value || regMax === regMin) return '#ecfdf5';
    const t = (value - regMin) / (regMax - regMin);
    const stops = ['#ecfdf5', '#a7f3d0', '#6ee7b7', '#34d399', '#059669'];
    return stops[Math.max(0, Math.min(4, Math.floor(t * 5)))]
  };

  // Style function for GeoJSON features
  const style = (feature: any) => {
    const countyName = feature.properties.COUNTY_NAM || feature.properties.name || feature.properties.NAME;
    const county = counties.find(c => c.name.toLowerCase() === countyName?.toLowerCase());
    const isSelected = selectedCounty?.name.toLowerCase() === countyName?.toLowerCase();

    let fill = '#e5e7eb';
    if (county) {
      if (colorBy === 'turnout') fill = getTurnoutColor(county.code);
      else if (colorBy === 'registered') fill = getRegisteredColor(county.registered_voters_2022);
      else if (colorBy === 'winner') fill = getWinnerColor(getWinnerKey(county.code));
    }

    return {
      fillColor: fill,
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#1d4ed8' : '#9ca3af',
      fillOpacity: 0.7,
    };
  };

  // Event handlers for each feature
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const countyName = feature.properties.COUNTY_NAM ||
                       feature.properties.name ||
                       feature.properties.NAME;
    const county = counties.find(c =>
      c.name.toLowerCase() === countyName?.toLowerCase()
    );

    if (!county) return;

    const result = electionResults.find(r => r.county_code === county.code);

    // Popup content
    const popupContent = `
      <div class="p-2">
        <h3 class="font-bold text-lg">${county.name}</h3>
        <p class="text-sm">Code: ${county.code}</p>
        <p class="text-sm">Population: ${county.population_2019.toLocaleString()}</p>
        <p class="text-sm">Registered Voters: ${county.registered_voters_2022.toLocaleString()}</p>
        ${result ? `<p class="text-sm font-semibold mt-2">Turnout: ${result.turnout_percentage.toFixed(1)}%</p>` : ''}
      </div>
    `;

    layer.bindPopup(popupContent);

    // Hover effects
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#1d4ed8',
          fillOpacity: 0.9,
        });
        layer.bringToFront();
      },
      mouseout: (e) => {
        const layer = e.target;
        const isSelected = selectedCounty?.name.toLowerCase() === countyName?.toLowerCase();
        layer.setStyle({
          weight: isSelected ? 3 : 1,
          color: isSelected ? '#1d4ed8' : '#9ca3af',
          fillOpacity: 0.7,
        });
      },
      click: () => {
        if (county) {
          onCountyClick(county.code);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <div className="text-center p-6">
          <p className="text-red-600 font-semibold">Failed to load map</p>
          <p className="text-sm text-red-500 mt-2">{error}</p>
          <p className="text-xs text-gray-600 mt-4">
            Make sure kenya-counties.geojson is in the /public folder
          </p>
        </div>
      </div>
    );
  }

  // Kenya's geographic bounds (approximate)
  const kenyaBounds: L.LatLngBoundsExpression = [
    [-4.8, 33.9],  // Southwest coordinates (southern border, western border)
    [5.5, 41.9]    // Northeast coordinates (northern border, eastern border)
  ];

  return (
    <div className="relative">
      <MapContainer
        center={[0.0236, 37.9062]} // Kenya center coordinates
        zoom={6}
        minZoom={6}  // Prevent zooming out too far
        maxZoom={10} // Prevent zooming in too close
        maxBounds={kenyaBounds} // Restrict panning to Kenya
        maxBoundsViscosity={1.0} // Make bounds completely solid (no dragging outside)
        style={{ height: '500px', width: '100%' }}
        className="rounded-lg border border-gray-200"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geoJsonData && (
          <GeoJSON
            data={geoJsonData}
            style={style}
            onEachFeature={onEachFeature}
          />
        )}

        <MapUpdater selectedCounty={selectedCounty} />
      </MapContainer>

      {/* Legend */}
      <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
        {colorBy === 'turnout' && (
          <>
            <h4 className="font-semibold text-sm mb-2">Voter Turnout %</h4>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center"><div className="w-4 h-4 bg-[#dbeafe] border mr-1"></div><span>&lt;50%</span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-[#93c5fd] border mr-1"></div><span>50-60%</span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-[#60a5fa] border mr-1"></div><span>60-70%</span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-[#3b82f6] border mr-1"></div><span>70-80%</span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-[#1e40af] border mr-1"></div><span>&gt;80%</span></div>
            </div>
          </>
        )}
        {colorBy === 'registered' && (
          <>
            <h4 className="font-semibold text-sm mb-2">Registered Voters (relative)</h4>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center"><div className="w-4 h-4 bg-[#ecfdf5] border mr-1"></div><span>Low</span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-[#a7f3d0] border mr-1"></div><span> </span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-[#6ee7b7] border mr-1"></div><span> </span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-[#34d399] border mr-1"></div><span> </span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-[#059669] border mr-1"></div><span>High</span></div>
            </div>
          </>
        )}
        {colorBy === 'winner' && (
          <>
            <h4 className="font-semibold text-sm mb-2">Projected Winner</h4>
            <div className="flex flex-wrap gap-3 text-xs">
              {Array.from(new Set(counties.map(c => getWinnerKey(c.code)).filter(Boolean) as string[])).slice(0, 6).map(key => (
                <div key={key} className="flex items-center">
                  <div className="w-4 h-4 mr-1" style={{ backgroundColor: getWinnerColor(key), border: '1px solid rgba(0,0,0,0.2)' }} />
                  <span className="truncate max-w-[120px]" title={key}>{key}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800"><strong>📍 Interactive County Map of Kenya</strong></p>
        <p className="text-xs text-blue-600 mt-1">
          Click a county for details. Hover for quick info. Colors represent {colorBy === 'turnout' ? 'voter turnout percentage' : colorBy === 'registered' ? 'registered voters (relative scale)' : 'projected winner'}.
          Map is locked to Kenya's boundaries.
        </p>
      </div>
    </div>
  );
}

