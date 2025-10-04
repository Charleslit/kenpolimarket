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

interface CountyMapProps {
  counties: County[];
  selectedCounty: County | null;
  onCountyClick: (countyCode: string) => void;
  electionResults: ElectionResult[];
}

export default function CountyMap({
  counties,
  selectedCounty,
  onCountyClick,
  electionResults,
}: CountyMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });

  useEffect(() => {
    if (!svgRef.current || counties.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = 600;
    const height = 500;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create a simple grid-based visualization of counties
    // Since we don't have actual GeoJSON data, we'll create a stylized grid
    const countiesPerRow = 7;
    const cellWidth = width / countiesPerRow;
    const cellHeight = height / Math.ceil(counties.length / countiesPerRow);

    // Create color scale based on turnout
    const turnoutByCounty = new Map(
      electionResults.map(r => [r.county_code, r.turnout_percentage])
    );

    const maxTurnout = d3.max(Array.from(turnoutByCounty.values())) || 100;
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, maxTurnout]);

    // Create county cells
    const countyGroups = svg
      .selectAll('g.county')
      .data(counties)
      .enter()
      .append('g')
      .attr('class', 'county')
      .attr('transform', (d, i) => {
        const row = Math.floor(i / countiesPerRow);
        const col = i % countiesPerRow;
        return `translate(${col * cellWidth}, ${row * cellHeight})`;
      });

    // Add rectangles for each county
    countyGroups
      .append('rect')
      .attr('width', cellWidth - 2)
      .attr('height', cellHeight - 2)
      .attr('x', 1)
      .attr('y', 1)
      .attr('rx', 4)
      .attr('fill', d => {
        const turnout = turnoutByCounty.get(d.code);
        return turnout ? colorScale(turnout) : '#e5e7eb';
      })
      .attr('stroke', d => selectedCounty?.code === d.code ? '#1d4ed8' : '#9ca3af')
      .attr('stroke-width', d => selectedCounty?.code === d.code ? 3 : 1)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        onCountyClick(d.code);
      })
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .attr('stroke', '#1d4ed8')
          .attr('stroke-width', 2);

        const turnout = turnoutByCounty.get(d.code);
        const content = `
          <strong>${d.name}</strong><br/>
          Code: ${d.code}<br/>
          Population: ${d.population_2019.toLocaleString()}<br/>
          ${turnout ? `Turnout: ${turnout.toFixed(1)}%` : 'No data'}
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
            .attr('stroke', '#9ca3af')
            .attr('stroke-width', 1);
        }
        setTooltip(prev => ({ ...prev, visible: false }));
      });

    // Add county codes as text
    countyGroups
      .append('text')
      .attr('x', cellWidth / 2)
      .attr('y', cellHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', d => {
        const turnout = turnoutByCounty.get(d.code);
        return turnout && turnout > 50 ? '#ffffff' : '#1f2937';
      })
      .attr('pointer-events', 'none')
      .text(d => d.code);

    // Add legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - legendWidth - 20;
    const legendY = height - legendHeight - 40;

    const legend = svg.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Create gradient for legend
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'turnout-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colorScale(0));

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colorScale(maxTurnout));

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#turnout-gradient)')
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 1);

    legend.append('text')
      .attr('x', 0)
      .attr('y', -5)
      .attr('font-size', '12px')
      .attr('fill', '#4b5563')
      .text('Turnout %');

    legend.append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 15)
      .attr('font-size', '10px')
      .attr('fill', '#6b7280')
      .text('0%');

    legend.append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', '#6b7280')
      .text(`${maxTurnout.toFixed(0)}%`);

  }, [counties, selectedCounty, electionResults, onCountyClick]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="100%"
        height="500"
        viewBox="0 0 600 500"
        className="border border-gray-200 rounded-lg bg-gray-50"
      />
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
            maxWidth: '250px',
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}

      {/* Info Box */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>📍 Interactive County Map</strong>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Click on any county to view detailed forecast data. Colors represent voter turnout percentage.
        </p>
        <p className="text-xs text-blue-500 mt-2">
          Note: This is a simplified grid visualization. In production, use actual GeoJSON boundaries.
        </p>
      </div>
    </div>
  );
}

