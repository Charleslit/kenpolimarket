'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

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

interface D3CountyMapProps {
  counties: County[];
  selectedCounty: County | null;
  onCountyClick: (countyCode: string) => void;
  electionResults: ElectionResult[];
}

export default function D3CountyMap({
  counties,
  selectedCounty,
  onCountyClick,
  electionResults,
}: D3CountyMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });

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

  // Render map
  useEffect(() => {
    if (!svgRef.current || !geoJsonData || counties.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create projection for Kenya
    const projection = d3.geoMercator()
      .fitSize([width, height], geoJsonData);

    const path = d3.geoPath().projection(projection);

    // Create color scale based on turnout
    const turnoutByCounty = new Map(
      electionResults.map(r => [r.county_code, r.turnout_percentage])
    );

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

    // Create a group for the map
    const g = svg.append('g');

    // Draw counties
    const countyPaths = g.selectAll('path')
      .data(geoJsonData.features)
      .enter()
      .append('path')
      .attr('d', path as any)
      .attr('class', 'county-path')
      .attr('fill', (d: any) => {
        const countyName = d.properties.COUNTY_NAM || 
                          d.properties.name || 
                          d.properties.NAME ||
                          d.properties.County;
        const county = counties.find(c => 
          c.name.toLowerCase() === countyName?.toLowerCase()
        );
        return county ? getTurnoutColor(county.code) : '#e5e7eb';
      })
      .attr('stroke', (d: any) => {
        const countyName = d.properties.COUNTY_NAM || 
                          d.properties.name || 
                          d.properties.NAME ||
                          d.properties.County;
        const isSelected = selectedCounty?.name.toLowerCase() === countyName?.toLowerCase();
        return isSelected ? '#1d4ed8' : '#9ca3af';
      })
      .attr('stroke-width', (d: any) => {
        const countyName = d.properties.COUNTY_NAM || 
                          d.properties.name || 
                          d.properties.NAME ||
                          d.properties.County;
        const isSelected = selectedCounty?.name.toLowerCase() === countyName?.toLowerCase();
        return isSelected ? 3 : 1;
      })
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('click', function(event, d: any) {
        const countyName = d.properties.COUNTY_NAM || 
                          d.properties.name || 
                          d.properties.NAME ||
                          d.properties.County;
        const county = counties.find(c => 
          c.name.toLowerCase() === countyName?.toLowerCase()
        );
        if (county) {
          onCountyClick(county.code);
        }
      })
      .on('mouseenter', function(event, d: any) {
        const countyName = d.properties.COUNTY_NAM || 
                          d.properties.name || 
                          d.properties.NAME ||
                          d.properties.County;
        const county = counties.find(c => 
          c.name.toLowerCase() === countyName?.toLowerCase()
        );

        if (county) {
          d3.select(this)
            .attr('stroke', '#1d4ed8')
            .attr('stroke-width', 3)
            .attr('opacity', 1);

          const result = electionResults.find(r => r.county_code === county.code);
          const content = `
            <strong class="text-lg">${county.name}</strong><br/>
            <span class="text-sm">Code: ${county.code}</span><br/>
            <span class="text-sm">Population: ${county.population_2019.toLocaleString()}</span><br/>
            <span class="text-sm">Registered Voters: ${county.registered_voters_2022.toLocaleString()}</span><br/>
            ${result ? `<span class="text-sm font-semibold mt-2 block">Turnout: ${result.turnout_percentage.toFixed(1)}%</span>` : ''}
          `;

          setTooltip({
            visible: true,
            x: event.pageX,
            y: event.pageY,
            content,
          });
        }
      })
      .on('mousemove', (event) => {
        setTooltip(prev => ({
          ...prev,
          x: event.pageX,
          y: event.pageY,
        }));
      })
      .on('mouseleave', function(event, d: any) {
        const countyName = d.properties.COUNTY_NAM || 
                          d.properties.name || 
                          d.properties.NAME ||
                          d.properties.County;
        const isSelected = selectedCounty?.name.toLowerCase() === countyName?.toLowerCase();
        
        d3.select(this)
          .attr('stroke', isSelected ? '#1d4ed8' : '#9ca3af')
          .attr('stroke-width', isSelected ? 3 : 1)
          .attr('opacity', 0.8);

        setTooltip(prev => ({ ...prev, visible: false }));
      });

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 20)`);

    const legendData = [
      { label: '< 50%', color: '#dbeafe' },
      { label: '50-60%', color: '#93c5fd' },
      { label: '60-70%', color: '#60a5fa' },
      { label: '70-80%', color: '#3b82f6' },
      { label: '> 80%', color: '#1e40af' },
    ];

    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Voter Turnout');

    legendData.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${20 + i * 20})`);

      legendRow.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', item.color)
        .attr('stroke', '#9ca3af')
        .attr('stroke-width', 1);

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .attr('font-size', '11px')
        .text(item.label);
    });

  }, [geoJsonData, counties, selectedCounty, electionResults, onCountyClick]);

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
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
      <svg
        ref={svgRef}
        width="100%"
        height="600"
        viewBox="0 0 800 600"
        className="border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-green-50"
      />
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-3 pointer-events-none"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
            maxWidth: '300px',
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}

      {/* Controls Info */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>📍 Interactive County Map</strong>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Click counties to select • Hover for details • Scroll to zoom • Drag to pan
        </p>
      </div>
    </div>
  );
}

