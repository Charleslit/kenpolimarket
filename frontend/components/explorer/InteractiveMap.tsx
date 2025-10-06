'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Layers, ZoomIn, ZoomOut } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface MapMarker {
  id: number;
  name: string;
  lat: number;
  lng: number;
  type: 'county' | 'constituency' | 'ward' | 'polling_station';
  data?: any;
}

interface InteractiveMapProps {
  level: 'national' | 'county' | 'constituency' | 'ward';
  countyId?: number;
  constituencyId?: number;
  wardId?: number;
  selectedYear?: number | 'all';
  onMarkerClick?: (marker: MapMarker) => void;
}

// Kenya county coordinates (approximate centers)
const KENYA_COUNTIES_COORDS: { [key: string]: [number, number] } = {
  'Mombasa': [-4.0435, 39.6682],
  'Kwale': [-4.1742, 39.4520],
  'Kilifi': [-3.6309, 39.8493],
  'Tana River': [-1.5236, 39.9872],
  'Lamu': [-2.2717, 40.9020],
  'Taita Taveta': [-3.3167, 38.4833],
  'Garissa': [-0.4536, 39.6401],
  'Wajir': [1.7471, 40.0629],
  'Mandera': [3.9366, 41.8550],
  'Marsabit': [2.3284, 37.9899],
  'Isiolo': [0.3556, 37.5833],
  'Meru': [0.3556, 37.6500],
  'Tharaka Nithi': [-0.3667, 37.7333],
  'Embu': [-0.5310, 37.4575],
  'Kitui': [-1.3667, 38.0167],
  'Machakos': [-1.5177, 37.2634],
  'Makueni': [-2.2667, 37.8333],
  'Nyandarua': [-0.1833, 36.4833],
  'Nyeri': [-0.4167, 36.9500],
  'Kirinyaga': [-0.6589, 37.3833],
  'Murang\'a': [-0.7833, 37.1500],
  'Kiambu': [-1.1714, 36.8356],
  'Turkana': [3.1167, 35.6167],
  'West Pokot': [1.6167, 35.3833],
  'Samburu': [1.2153, 36.9453],
  'Trans Nzoia': [1.0500, 34.9500],
  'Uasin Gishu': [0.5500, 35.3000],
  'Elgeyo Marakwet': [0.8667, 35.4667],
  'Nandi': [0.1833, 35.1167],
  'Baringo': [0.4667, 36.0833],
  'Laikipia': [0.3667, 36.7833],
  'Nakuru': [-0.3031, 36.0800],
  'Narok': [-1.0833, 35.8667],
  'Kajiado': [-2.0978, 36.7820],
  'Kericho': [-0.3667, 35.2833],
  'Bomet': [-0.7833, 35.3167],
  'Kakamega': [0.2827, 34.7519],
  'Vihiga': [0.0667, 34.7167],
  'Bungoma': [0.5635, 34.5606],
  'Busia': [0.4346, 34.1115],
  'Siaya': [0.0667, 34.2833],
  'Kisumu': [-0.0917, 34.7680],
  'Homa Bay': [-0.5167, 34.4500],
  'Migori': [-1.0634, 34.4731],
  'Kisii': [-0.6817, 34.7680],
  'Nyamira': [-0.5667, 34.9333],
  'Nairobi': [-1.2864, 36.8172]
};

export default function InteractiveMap({
  level,
  countyId,
  constituencyId,
  wardId,
  selectedYear = 2022,
  onMarkerClick
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(6);
  const [center, setCenter] = useState<[number, number]>([-0.0236, 37.9062]); // Kenya center
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  useEffect(() => {
    fetchMarkers();
  }, [level, countyId, constituencyId, wardId, selectedYear]);

  const fetchMarkers = async () => {
    setLoading(true);
    try {
      if (level === 'national') {
        // Fetch all counties
        const response = await fetch(`${API_BASE_URL}/api/counties/`);
        const counties = await response.json();
        
        const countyMarkers: MapMarker[] = counties.map((county: any) => ({
          id: county.id,
          name: county.name,
          lat: KENYA_COUNTIES_COORDS[county.name]?.[0] || -0.0236,
          lng: KENYA_COUNTIES_COORDS[county.name]?.[1] || 37.9062,
          type: 'county' as const,
          data: county
        }));
        
        setMarkers(countyMarkers);
        setCenter([-0.0236, 37.9062]);
        setZoom(6);
        
      } else if (level === 'county' && countyId) {
        // Fetch constituencies in county
        const response = await fetch(`${API_BASE_URL}/api/constituencies/?county_id=${countyId}`);
        const constituencies = await response.json();

        // For now, cluster constituencies around county center
        const countyResponse = await fetch(`${API_BASE_URL}/api/counties/${countyId}`);
        const county = await countyResponse.json();
        const countyCoords = KENYA_COUNTIES_COORDS[county.name] || [-0.0236, 37.9062];

        const constMarkers: MapMarker[] = constituencies.map((constituency: any, index: number) => ({
          id: constituency.id,
          name: constituency.name,
          lat: countyCoords[0] + (Math.random() - 0.5) * 0.5,
          lng: countyCoords[1] + (Math.random() - 0.5) * 0.5,
          type: 'constituency' as const,
          data: constituency
        }));

        setMarkers(constMarkers);
        setCenter(countyCoords);
        setZoom(9);
        
      } else if (level === 'constituency' && constituencyId) {
        // Fetch wards in constituency
        const response = await fetch(`${API_BASE_URL}/api/wards/?constituency_id=${constituencyId}`);
        const wards = await response.json();
        
        // Cluster wards around constituency center (using county coords for now)
        const wardMarkers: MapMarker[] = wards.map((ward: any, index: number) => ({
          id: ward.id,
          name: ward.name,
          lat: center[0] + (Math.random() - 0.5) * 0.2,
          lng: center[1] + (Math.random() - 0.5) * 0.2,
          type: 'ward' as const,
          data: ward
        }));
        
        setMarkers(wardMarkers);
        setZoom(11);
        
      } else if (level === 'ward' && wardId) {
        // Fetch polling stations in ward
        const yearParam = selectedYear !== 'all' ? `&year=${selectedYear}` : '';
        const response = await fetch(`${API_BASE_URL}/api/polling-stations/?ward_id=${wardId}&limit=100${yearParam}`);
        const stations = await response.json();
        
        const stationMarkers: MapMarker[] = stations.map((station: any, index: number) => ({
          id: station.id,
          name: station.name,
          lat: center[0] + (Math.random() - 0.5) * 0.1,
          lng: center[1] + (Math.random() - 0.5) * 0.1,
          type: 'polling_station' as const,
          data: station
        }));
        
        setMarkers(stationMarkers);
        setZoom(13);
      }
    } catch (error) {
      console.error('Failed to fetch markers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'county': return 'bg-blue-600';
      case 'constituency': return 'bg-green-600';
      case 'ward': return 'bg-yellow-600';
      case 'polling_station': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getMarkerSize = (type: string) => {
    switch (type) {
      case 'county': return 'w-4 h-4';
      case 'constituency': return 'w-3 h-3';
      case 'ward': return 'w-2 h-2';
      case 'polling_station': return 'w-2 h-2';
      default: return 'w-3 h-3';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Legend</span>
        </div>
        <div className="space-y-1 text-xs">
          {level === 'national' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span>Counties ({markers.length})</span>
            </div>
          )}
          {level === 'county' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span>Constituencies ({markers.length})</span>
            </div>
          )}
          {level === 'constituency' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
              <span>Wards ({markers.length})</span>
            </div>
          )}
          {level === 'ward' && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <span>Polling Stations ({markers.length})</span>
            </div>
          )}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2 z-10 flex flex-col gap-2">
        <button
          onClick={() => setZoom(z => Math.min(z + 1, 15))}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 1, 5))}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      {/* Simple Map Visualization */}
      <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-green-50">
        {markers.map((marker) => {
          // Calculate position based on lat/lng (simplified projection)
          const x = ((marker.lng + 180) / 360) * 100;
          const y = ((90 - marker.lat) / 180) * 100;
          
          return (
            <div
              key={`${marker.type}-${marker.id}`}
              className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
              onClick={() => handleMarkerClick(marker)}
            >
              <div className={`${getMarkerColor(marker.type)} ${getMarkerSize(marker.type)} rounded-full shadow-lg hover:scale-150 transition-transform`}></div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {marker.name}
                {marker.data?.registered_voters_2022 && (
                  <div className="text-gray-300">
                    {marker.data.registered_voters_2022.toLocaleString()} voters
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Marker Info */}
      {selectedMarker && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-xs">
          <div className="flex items-start gap-2">
            <MapPin className={`w-5 h-5 ${getMarkerColor(selectedMarker.type).replace('bg-', 'text-')}`} />
            <div>
              <h4 className="font-semibold text-gray-900">{selectedMarker.name}</h4>
              <p className="text-xs text-gray-500 capitalize">{selectedMarker.type.replace('_', ' ')}</p>
              {selectedMarker.data?.registered_voters_2022 && (
                <p className="text-sm text-gray-700 mt-1">
                  {selectedMarker.data.registered_voters_2022.toLocaleString()} registered voters
                </p>
              )}
              {selectedMarker.data?.code && (
                <p className="text-xs text-gray-500 mt-1">Code: {selectedMarker.data.code}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

