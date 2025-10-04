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

  // Style function for GeoJSON features
  const style = (feature: any) => {
    const countyName = feature.properties.COUNTY_NAM ||
                       feature.properties.name ||
                       feature.properties.NAME;
    const county = counties.find(c =>
      c.name.toLowerCase() === countyName?.toLowerCase()
    );

    const isSelected = selectedCounty?.name.toLowerCase() === countyName?.toLowerCase();
    
    return {
      fillColor: county ? getTurnoutColor(county.code) : '#e5e7eb',
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

  return (
    <div className="relative">
      <MapContainer
        center={[0.0236, 37.9062]} // Kenya center coordinates
        zoom={6}
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
        <h4 className="font-semibold text-sm mb-2">Voter Turnout %</h4>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#dbeafe] border border-gray-300 mr-1"></div>
            <span>&lt;50%</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#93c5fd] border border-gray-300 mr-1"></div>
            <span>50-60%</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#60a5fa] border border-gray-300 mr-1"></div>
            <span>60-70%</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#3b82f6] border border-gray-300 mr-1"></div>
            <span>70-80%</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#1e40af] border border-gray-300 mr-1"></div>
            <span>&gt;80%</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>📍 Interactive County Map</strong>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Click on any county to view detailed forecast data. Hover for quick info. Colors represent voter turnout percentage.
        </p>
      </div>
    </div>
  );
}

