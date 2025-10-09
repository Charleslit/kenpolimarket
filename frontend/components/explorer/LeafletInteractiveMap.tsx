'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface MapMarker {
  id: number;
  name: string;
  lat: number;
  lng: number;
  type: 'county' | 'constituency' | 'ward' | 'polling_station';
  data?: any;
}

interface LeafletInteractiveMapProps {
  level: 'national' | 'county' | 'constituency' | 'ward';
  countyId?: number;
  constituencyId?: number;
  wardId?: number;
  selectedYear?: number | 'all';
  onMarkerClick?: (marker: MapMarker) => void;
  choroplethData?: Record<string, number>; // key by lowercased feature name -> value
}

// Component to handle map updates and bounds
function MapUpdater({
  markers,
  level,
  geoJsonBounds
}: {
  markers: MapMarker[];
  level: string;
  geoJsonBounds?: L.LatLngBounds | null;
}) {
  const map = useMap();

  useEffect(() => {
    // If we have GeoJSON bounds, use those for more accurate fitting
    if (geoJsonBounds) {
      map.fitBounds(geoJsonBounds, {
        padding: [50, 50],
        maxZoom: level === 'national' ? 7 : level === 'county' ? 10 : level === 'constituency' ? 12 : 14,
        animate: true,
        duration: 0.5
      });
    } else if (markers.length > 0) {
      // Fallback to marker bounds
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: level === 'national' ? 7 : level === 'county' ? 10 : level === 'constituency' ? 12 : 14,
        animate: true,
        duration: 0.5
      });
    } else {
      // Default to Kenya center
      map.setView([-0.0236, 37.9062], 6, { animate: true });
    }
  }, [markers, level, geoJsonBounds, map]);

  return null;
}

// Custom marker icons
const createCustomIcon = (type: string) => {
  const colors = {
    county: '#2563eb',
    constituency: '#16a34a',
    ward: '#ca8a04',
    polling_station: '#dc2626'
  };
  
  const sizes = {
    county: 12,
    constituency: 10,
    ward: 8,
    polling_station: 6
  };
  
  const color = colors[type as keyof typeof colors] || '#6b7280';
  const size = sizes[type as keyof typeof sizes] || 8;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export default function LeafletInteractiveMap({
  level,
  countyId,
  constituencyId,
  wardId,
  selectedYear = 2022,
  onMarkerClick,
  choroplethData
}: LeafletInteractiveMapProps) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoJsonBounds, setGeoJsonBounds] = useState<L.LatLngBounds | null>(null);

  // GeoJSON data for boundaries
  const [countiesGeoJSON, setCountiesGeoJSON] = useState<any>(null);
  const [constituenciesGeoJSON, setConstituenciesGeoJSON] = useState<any>(null);
  const [wardsGeoJSON, setWardsGeoJSON] = useState<any>(null);

  // County/Constituency/Ward names for filtering GeoJSON
  const [selectedCountyName, setSelectedCountyName] = useState<string | null>(null);
  const [selectedConstituencyName, setSelectedConstituencyName] = useState<string | null>(null);
  const [selectedWardName, setSelectedWardName] = useState<string | null>(null);

  // Load GeoJSON files
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        // Always load counties
        const countiesRes = await fetch('/kenya-counties.geojson');
        if (countiesRes.ok) {
          const countiesData = await countiesRes.json();
          setCountiesGeoJSON(countiesData);
        }

        // Load constituencies if available
        try {
          const constituenciesRes = await fetch('/kenya-constituencies.geojson');
          if (constituenciesRes.ok) {
            const constituenciesData = await constituenciesRes.json();
            setConstituenciesGeoJSON(constituenciesData);
          }
        } catch (err) {
          console.log('Constituencies GeoJSON not available yet');
        }

        // Load wards if available
        try {
          const wardsRes = await fetch('/kenya-wards.geojson');
          if (wardsRes.ok) {
            const wardsData = await wardsRes.json();
            setWardsGeoJSON(wardsData);
          }
        } catch (err) {
          console.log('Wards GeoJSON not available yet');
        }
      } catch (err) {
        console.error('Error loading GeoJSON:', err);
      }
    };

    loadGeoJSON();
  }, []);

  // Helper function to calculate bounds from GeoJSON feature
  const calculateBoundsFromGeoJSON = (feature: any): L.LatLngBounds | null => {
    if (!feature || !feature.geometry) return null;

    try {
      const coords = feature.geometry.type === 'Polygon'
        ? feature.geometry.coordinates[0]
        : feature.geometry.type === 'MultiPolygon'
        ? feature.geometry.coordinates.flat(2)
        : null;

      if (!coords || coords.length === 0) return null;

      const latLngs = coords.map((coord: number[]) => L.latLng(coord[1], coord[0]));
      return L.latLngBounds(latLngs);
    } catch (err) {
      console.error('Error calculating bounds:', err);
      return null;
    }
  };

  // Fetch markers based on level
  useEffect(() => {
    fetchMarkers();
  }, [level, countyId, constituencyId, wardId, selectedYear]);

  const fetchMarkers = async () => {
    setLoading(true);
    setError(null);
    setGeoJsonBounds(null);

    try {
      if (level === 'national') {
        // Fetch all counties
        const response = await fetch(`${API_BASE_URL}/counties/`);
        if (!response.ok) throw new Error('Failed to fetch counties');
        const counties = await response.json();

        // Set bounds to all of Kenya
        if (countiesGeoJSON && countiesGeoJSON.features) {
          const allCoords: L.LatLng[] = [];
          countiesGeoJSON.features.forEach((feature: any) => {
            const bounds = calculateBoundsFromGeoJSON(feature);
            if (bounds) {
              allCoords.push(bounds.getNorthEast(), bounds.getSouthWest());
            }
          });
          if (allCoords.length > 0) {
            setGeoJsonBounds(L.latLngBounds(allCoords));
          }
        }
        
        const countyMarkers: MapMarker[] = counties.map((county: any) => {
          // Try to get coordinates from GeoJSON
          let lat = -0.0236;
          let lng = 37.9062;
          
          if (countiesGeoJSON) {
            const feature = countiesGeoJSON.features.find((f: any) => 
              f.properties.COUNTY_NAM?.toLowerCase() === county.name.toLowerCase() ||
              f.properties.name?.toLowerCase() === county.name.toLowerCase()
            );
            
            if (feature && feature.geometry.type === 'Polygon') {
              // Calculate centroid
              const coords = feature.geometry.coordinates[0];
              const centroid = coords.reduce((acc: number[], coord: number[]) => {
                return [acc[0] + coord[0], acc[1] + coord[1]];
              }, [0, 0]);
              lng = centroid[0] / coords.length;
              lat = centroid[1] / coords.length;
            }
          }
          
          return {
            id: county.id,
            name: county.name,
            lat,
            lng,
            type: 'county' as const,
            data: county
          };
        });
        
        setMarkers(countyMarkers);
        
      } else if (level === 'county' && countyId) {
        // Fetch county details first to get name
        const countyResponse = await fetch(`${API_BASE_URL}/counties/${countyId}`);
        if (!countyResponse.ok) throw new Error('Failed to fetch county');
        const county = await countyResponse.json();
        setSelectedCountyName(county.name);

        // Set bounds to the selected county
        if (countiesGeoJSON) {
          const countyFeature = countiesGeoJSON.features.find((f: any) =>
            f.properties.COUNTY_NAM?.toLowerCase() === county.name.toLowerCase() ||
            f.properties.name?.toLowerCase() === county.name.toLowerCase()
          );
          if (countyFeature) {
            const bounds = calculateBoundsFromGeoJSON(countyFeature);
            if (bounds) setGeoJsonBounds(bounds);
          }
        }

        // Fetch constituencies in county
        const response = await fetch(`${API_BASE_URL}/constituencies/?county_id=${countyId}`);
        if (!response.ok) throw new Error('Failed to fetch constituencies');
        const constituencies = await response.json();

        const constMarkers: MapMarker[] = constituencies.map((constituency: any) => {
          let lat = -0.0236;
          let lng = 37.9062;
          
          // Try to get from GeoJSON if available
          if (constituenciesGeoJSON) {
            const feature = constituenciesGeoJSON.features.find((f: any) =>
              f.properties.name?.toLowerCase() === constituency.name.toLowerCase() ||
              f.properties.CONSTITUEN?.toLowerCase() === constituency.name.toLowerCase()
            );
            
            if (feature && feature.geometry.type === 'Polygon') {
              const coords = feature.geometry.coordinates[0];
              const centroid = coords.reduce((acc: number[], coord: number[]) => {
                return [acc[0] + coord[0], acc[1] + coord[1]];
              }, [0, 0]);
              lng = centroid[0] / coords.length;
              lat = centroid[1] / coords.length;
            }
          }
          
          return {
            id: constituency.id,
            name: constituency.name,
            lat,
            lng,
            type: 'constituency' as const,
            data: constituency
          };
        });

        setMarkers(constMarkers);
        
      } else if (level === 'constituency' && constituencyId) {
        // Fetch constituency details first to get name
        const constResponse = await fetch(`${API_BASE_URL}/constituencies/${constituencyId}`);
        if (!constResponse.ok) throw new Error('Failed to fetch constituency');
        const constituency = await constResponse.json();
        setSelectedConstituencyName(constituency.name);

        // Set bounds to the selected constituency
        if (constituenciesGeoJSON) {
          const constFeature = constituenciesGeoJSON.features.find((f: any) =>
            f.properties.name?.toLowerCase() === constituency.name.toLowerCase() ||
            f.properties.CONSTITUEN?.toLowerCase() === constituency.name.toLowerCase()
          );
          if (constFeature) {
            const bounds = calculateBoundsFromGeoJSON(constFeature);
            if (bounds) setGeoJsonBounds(bounds);
          }
        }

        // Fetch wards in constituency
        const response = await fetch(`${API_BASE_URL}/wards/?constituency_id=${constituencyId}`);
        if (!response.ok) throw new Error('Failed to fetch wards');
        const wards = await response.json();
        
        const wardMarkers: MapMarker[] = wards.map((ward: any) => {
          let lat = -0.0236;
          let lng = 37.9062;
          
          // Try to get from GeoJSON if available
          if (wardsGeoJSON) {
            const feature = wardsGeoJSON.features.find((f: any) =>
              f.properties.name?.toLowerCase() === ward.name.toLowerCase() ||
              f.properties.WARD_NAME?.toLowerCase() === ward.name.toLowerCase()
            );
            
            if (feature && feature.geometry.type === 'Polygon') {
              const coords = feature.geometry.coordinates[0];
              const centroid = coords.reduce((acc: number[], coord: number[]) => {
                return [acc[0] + coord[0], acc[1] + coord[1]];
              }, [0, 0]);
              lng = centroid[0] / coords.length;
              lat = centroid[1] / coords.length;
            }
          }
          
          return {
            id: ward.id,
            name: ward.name,
            lat,
            lng,
            type: 'ward' as const,
            data: ward
          };
        });
        
        setMarkers(wardMarkers);
        
      } else if (level === 'ward' && wardId) {
        // Fetch ward details first to get name
        const wardResponse = await fetch(`${API_BASE_URL}/wards/${wardId}`);
        if (!wardResponse.ok) throw new Error('Failed to fetch ward');
        const ward = await wardResponse.json();
        setSelectedWardName(ward.name);

        // Set bounds to the selected ward
        if (wardsGeoJSON) {
          const wardFeature = wardsGeoJSON.features.find((f: any) =>
            f.properties.name?.toLowerCase() === ward.name.toLowerCase() ||
            f.properties.WARD_NAME?.toLowerCase() === ward.name.toLowerCase()
          );
          if (wardFeature) {
            const bounds = calculateBoundsFromGeoJSON(wardFeature);
            if (bounds) setGeoJsonBounds(bounds);
          }
        }

        // Fetch polling stations in ward
        const yearParam = selectedYear !== 'all' ? `&year=${selectedYear}` : '';
        const response = await fetch(`${API_BASE_URL}/polling_stations/?ward_id=${wardId}&limit=100${yearParam}`);
        if (!response.ok) throw new Error('Failed to fetch polling stations');
        const stations = await response.json();
        
        const stationMarkers: MapMarker[] = stations.map((station: any) => ({
          id: station.id,
          name: station.name,
          lat: station.latitude || -0.0236,
          lng: station.longitude || 37.9062,
          type: 'polling_station' as const,
          data: station
        }));
        
        setMarkers(stationMarkers);
      }
    } catch (err) {
      console.error('Failed to fetch markers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (marker: MapMarker) => {
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
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
        </div>
      </div>
    );
  }

  // Compute color scale for choropleth (simple quintiles)
  const getColor = (value: number, min: number, max: number) => {
    if (max <= min) return '#edf2f7';
    const t = (value - min) / (max - min);
    // interpolate from light blue to dark blue
    const c0 = [237, 242, 247];
    const c1 = [30, 64, 175];
    const r = Math.round(c0[0] + t * (c1[0] - c0[0]));
    const g = Math.round(c0[1] + t * (c1[1] - c0[1]));
    const b = Math.round(c0[2] + t * (c1[2] - c0[2]));
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Determine min/max from choropleth data
  const values = choroplethData ? Object.values(choroplethData) : [];
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 1;

  const KENYA_BOUNDS = L.latLngBounds(L.latLng(-5.5, 33.5), L.latLng(5.5, 42.5));

  return (
    <div className="relative">
      <MapContainer
        center={[-0.0236, 37.9062]}
        zoom={6}
        style={{ height: '500px', width: '100%' }}
        className="rounded-lg border border-gray-200"
        maxBounds={KENYA_BOUNDS}
        minZoom={6}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Optional Choropleth polygons */}
        {choroplethData && level === 'national' && countiesGeoJSON && (
          <GeoJSON
            data={countiesGeoJSON}
            style={(feature: any) => {
              const name = (feature.properties.COUNTY_NAM || feature.properties.name || '').toLowerCase();
              const val = choroplethData[name];
              const fill = typeof val === 'number' ? getColor(val, minVal, maxVal) : '#f3f4f6';
              return { color: '#ffffff', weight: 1, fillColor: fill, fillOpacity: 0.8 };
            }}
          />
        )}
        {choroplethData && level === 'county' && constituenciesGeoJSON && selectedCountyName && (
          <GeoJSON
            data={{
              type: 'FeatureCollection',
              features: constituenciesGeoJSON.features.filter((f: any) => 
                (f.properties.COUNTY_NAM || '').toLowerCase() === selectedCountyName.toLowerCase()
              )
            } as any}
            style={(feature: any) => {
              const name = (feature.properties.name || feature.properties.CONSTITUEN || '').toLowerCase();
              const val = choroplethData[name];
              const fill = typeof val === 'number' ? getColor(val, minVal, maxVal) : '#f3f4f6';
              return { color: '#ffffff', weight: 1, fillColor: fill, fillOpacity: 0.8 };
            }}
          />
        )}
        {choroplethData && level === 'constituency' && wardsGeoJSON && selectedConstituencyName && (
          <GeoJSON
            data={{
              type: 'FeatureCollection',
              features: wardsGeoJSON.features.filter((f: any) => {
                const cname = (f.properties.CONSTITUEN || f.properties.name || '').toLowerCase();
                return cname === selectedConstituencyName?.toLowerCase();
              })
            } as any}
            style={(feature: any) => {
              const name = (feature.properties.WARD_NAME || feature.properties.name || '').toLowerCase();
              const val = choroplethData[name];
              const fill = typeof val === 'number' ? getColor(val, minVal, maxVal) : '#f3f4f6';
              return { color: '#ffffff', weight: 1, fillColor: fill, fillOpacity: 0.8 };
            }}
          />
        )}

        {/* Render markers */}
        {markers.map((marker) => (
          <Marker
            key={`${marker.type}-${marker.id}`}
            position={[marker.lat, marker.lng]}
            icon={createCustomIcon(marker.type)}
            eventHandlers={{
              click: () => handleMarkerClick(marker)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm">{marker.name}</h3>
                <p className="text-xs text-gray-600 capitalize">{marker.type.replace('_', ' ')}</p>
                {marker.data?.registered_voters && (
                  <p className="text-xs mt-1">
                    Voters: {marker.data.registered_voters.toLocaleString()}
                  </p>
                )}
                {marker.data?.population_2019 && (
                  <p className="text-xs">
                    Population: {marker.data.population_2019.toLocaleString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <MapUpdater markers={markers} level={level} geoJsonBounds={geoJsonBounds} />
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Legend</span>
        </div>
        <div className="space-y-1 text-xs">
          {choroplethData ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{background:getColor(minVal,minVal,maxVal)}}></span><span>Low</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{background:getColor((minVal+maxVal)/2,minVal,maxVal)}}></span><span>Medium</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{background:getColor(maxVal,minVal,maxVal)}}></span><span>High</span></div>
            </div>
          ) : (
            <>
              {level === 'national' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
                  <span>Counties ({markers.length})</span>
                </div>
              )}
              {level === 'county' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full border-2 border-white"></div>
                  <span>Constituencies ({markers.length})</span>
                </div>
              )}
              {level === 'constituency' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full border-2 border-white"></div>
                  <span>Wards ({markers.length})</span>
                </div>
              )}
              {level === 'ward' && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full border-2 border-white"></div>
                  <span>Polling Stations ({markers.length})</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

