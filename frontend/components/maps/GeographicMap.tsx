'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface County {
  code: string;
  name: string;
  population_2019: number;
  registered_voters_2022: number;
  region?: string;
}

interface ForecastData {
  county_code: string;
  county_name: string;
  leading_candidate?: string;
  vote_share?: number;
  margin?: number;
  competitiveness?: 'safe' | 'lean' | 'tossup';
}

interface GeographicMapProps {
  counties: County[];
  forecastData?: ForecastData[];
  selectedCounty: County | null;
  onCountyClick: (countyCode: string) => void;
  colorBy?: 'turnout' | 'margin' | 'population' | 'competitiveness';
}

export default function GeographicMap({
  counties,
  forecastData = [],
  selectedCounty,
  onCountyClick,
  colorBy = 'population',
}: GeographicMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });

  const [viewMode, setViewMode] = useState<'geographic' | 'cartogram'>('geographic');

  useEffect(() => {
    if (!svgRef.current || counties.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    svg.selectAll('*').remove();

    // Create Kenya-like geographic layout (simplified)
    // In production, you'd load actual GeoJSON from /public/kenya-counties.geojson
    const kenyaRegions = {
      'Nairobi': { x: 400, y: 350, size: 'large' },
      'Mombasa': { x: 650, y: 450, size: 'medium' },
      'Kisumu': { x: 200, y: 300, size: 'medium' },
      'Nakuru': { x: 350, y: 300, size: 'large' },
      'Uasin Gishu': { x: 300, y: 250, size: 'medium' },
      'Kiambu': { x: 400, y: 320, size: 'medium' },
      'Machakos': { x: 450, y: 370, size: 'medium' },
      'Kakamega': { x: 250, y: 280, size: 'medium' },
      'Bungoma': { x: 220, y: 250, size: 'medium' },
      'Kilifi': { x: 680, y: 420, size: 'medium' },
      'Kwale': { x: 650, y: 480, size: 'small' },
      'Garissa': { x: 600, y: 250, size: 'large' },
      'Wajir': { x: 650, y: 150, size: 'large' },
      'Mandera': { x: 700, y: 80, size: 'large' },
      'Marsabit': { x: 600, y: 120, size: 'large' },
      'Isiolo': { x: 550, y: 200, size: 'medium' },
      'Meru': { x: 500, y: 250, size: 'medium' },
      'Tharaka Nithi': { x: 520, y: 280, size: 'small' },
      'Embu': { x: 480, y: 310, size: 'small' },
      'Kitui': { x: 520, y: 370, size: 'large' },
      'Makueni': { x: 480, y: 400, size: 'medium' },
      'Nyandarua': { x: 370, y: 280, size: 'small' },
      'Nyeri': { x: 420, y: 280, size: 'small' },
      'Kirinyaga': { x: 450, y: 300, size: 'small' },
      'Murang\'a': { x: 420, y: 310, size: 'small' },
      'Kajiado': { x: 420, y: 420, size: 'large' },
      'Kericho': { x: 320, y: 320, size: 'medium' },
      'Bomet': { x: 300, y: 340, size: 'small' },
      'Narok': { x: 350, y: 380, size: 'large' },
      'Baringo': { x: 380, y: 220, size: 'medium' },
      'Laikipia': { x: 420, y: 230, size: 'medium' },
      'Samburu': { x: 480, y: 180, size: 'large' },
      'Trans Nzoia': { x: 280, y: 230, size: 'small' },
      'Elgeyo Marakwet': { x: 330, y: 240, size: 'small' },
      'Nandi': { x: 300, y: 270, size: 'small' },
      'West Pokot': { x: 320, y: 200, size: 'medium' },
      'Turkana': { x: 350, y: 120, size: 'large' },
      'Siaya': { x: 180, y: 300, size: 'small' },
      'Vihiga': { x: 230, y: 290, size: 'small' },
      'Busia': { x: 200, y: 270, size: 'small' },
      'Homa Bay': { x: 180, y: 330, size: 'medium' },
      'Migori': { x: 180, y: 360, size: 'small' },
      'Kisii': { x: 220, y: 340, size: 'small' },
      'Nyamira': { x: 240, y: 330, size: 'small' },
      'Taita Taveta': { x: 580, y: 450, size: 'medium' },
      'Lamu': { x: 720, y: 380, size: 'small' },
      'Tana River': { x: 650, y: 350, size: 'large' },
    };

    // Create color scale based on selected metric
    const getColorValue = (d: County): string => {
      switch (colorBy) {
        case 'population':
          const maxPop = d3.max(counties, c => c.population_2019) || 1;
          const popScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxPop]);
          return popScale(d.population_2019);

        case 'margin':
          const marginScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 100]);
          return marginScale(50); // Default to 50 for now

        case 'competitiveness':
          const forecast = forecastData.find(f => f.county_code === d.code);
          const compScale = d3.scaleOrdinal<string>()
            .domain(['safe', 'lean', 'tossup'])
            .range(['#10b981', '#f59e0b', '#ef4444']);
          return compScale(forecast?.competitiveness || 'safe');

        default:
          const defaultScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 100]);
          return defaultScale(50);
      }
    };

    // Create county circles
    const countyGroups = svg
      .selectAll('g.county')
      .data(counties)
      .enter()
      .append('g')
      .attr('class', 'county')
      .attr('transform', d => {
        const pos = kenyaRegions[d.name as keyof typeof kenyaRegions] || { x: 400, y: 300, size: 'small' };
        return `translate(${pos.x}, ${pos.y})`;
      });

    // Add circles for each county
    countyGroups
      .append('circle')
      .attr('r', d => {
        const pos = kenyaRegions[d.name as keyof typeof kenyaRegions] || { size: 'small' };
        const sizeMap = { small: 15, medium: 25, large: 35 };
        return sizeMap[pos.size as keyof typeof sizeMap];
      })
      .attr('fill', d => getColorValue(d))
      .attr('stroke', d => selectedCounty?.code === d.code ? '#1d4ed8' : '#ffffff')
      .attr('stroke-width', d => selectedCounty?.code === d.code ? 4 : 2)
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        onCountyClick(d.code);
      })
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .attr('stroke', '#1d4ed8')
          .attr('stroke-width', 3)
          .attr('opacity', 1);

        const forecast = forecastData.find(f => f.county_code === d.code);
        const content = `
          <strong>${d.name}</strong><br/>
          Code: ${d.code}<br/>
          Population: ${d.population_2019.toLocaleString()}<br/>
          Voters: ${d.registered_voters_2022.toLocaleString()}<br/>
          ${forecast?.leading_candidate ? `Leading: ${forecast.leading_candidate} (${forecast.vote_share?.toFixed(1)}%)` : ''}
          ${forecast?.competitiveness ? `<br/>Status: ${forecast.competitiveness.toUpperCase()}` : ''}
        `;

        setTooltip({
          visible: true,
          x: event.pageX,
          y: event.pageY,
          content,
        });
      })
      .on('mousemove', (event) => {
        setTooltip(prev => ({
          ...prev,
          x: event.pageX,
          y: event.pageY,
        }));
      })
      .on('mouseleave', function(event, d) {
        if (selectedCounty?.code !== d.code) {
          d3.select(this)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2)
            .attr('opacity', 0.8);
        }
        setTooltip(prev => ({ ...prev, visible: false }));
      });

    // Add county labels
    countyGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .attr('text-shadow', '0 0 3px rgba(0,0,0,0.8)')
      .text(d => d.code);

    // Add legend
    addLegend(svg, colorBy, width, height);

  }, [counties, selectedCounty, forecastData, onCountyClick, colorBy]);

  const addLegend = (svg: any, metric: string, width: number, height: number) => {
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = 20;
    const legendY = height - 60;

    const legend = svg.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    if (metric === 'competitiveness') {
      const categories = ['safe', 'lean', 'tossup'];
      const labels = ['Safe', 'Lean', 'Tossup'];
      const colors = ['#10b981', '#f59e0b', '#ef4444'];

      categories.forEach((cat, i) => {
        legend.append('rect')
          .attr('x', i * 70)
          .attr('y', 0)
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', colors[i]);

        legend.append('text')
          .attr('x', i * 70 + 20)
          .attr('y', 12)
          .attr('font-size', '12px')
          .attr('fill', '#4b5563')
          .text(labels[i]);
      });
    } else {
      const defs = svg.append('defs');
      const gradient = defs.append('linearGradient')
        .attr('id', 'map-gradient')
        .attr('x1', '0%')
        .attr('x2', '100%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', metric === 'population' ? '#fef3c7' : '#dbeafe');

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', metric === 'population' ? '#dc2626' : '#1e40af');

      legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#map-gradient)')
        .attr('stroke', '#9ca3af')
        .attr('stroke-width', 1);

      legend.append('text')
        .attr('x', 0)
        .attr('y', -5)
        .attr('font-size', '12px')
        .attr('fill', '#4b5563')
        .text(metric === 'population' ? 'Population' : 'Metric');

      legend.append('text')
        .attr('x', 0)
        .attr('y', legendHeight + 15)
        .attr('font-size', '10px')
        .attr('fill', '#6b7280')
        .text('Low');

      legend.append('text')
        .attr('x', legendWidth)
        .attr('y', legendHeight + 15)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('fill', '#6b7280')
        .text('High');
    }
  };

  return (
    <div className="relative">
      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setViewMode('geographic')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'geographic'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🗺️ Geographic
        </button>
        <button
          onClick={() => setViewMode('cartogram')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'cartogram'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📊 Cartogram
        </button>
      </div>

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
    </div>
  );
}

