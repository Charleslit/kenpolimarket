'use client';

import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HistoricalData {
  year: number;
  candidate: string;
  party: string;
  votes: number;
  vote_percentage: number;
  turnout_percentage?: number;
}

interface HistoricalTrendsProps {
  data: HistoricalData[];
  county?: string;
  title?: string;
}

export default function HistoricalTrends({
  data,
  county,
  title = 'Historical Election Trends',
}: HistoricalTrendsProps) {
  const [viewMode, setViewMode] = useState<'line' | 'bar' | 'comparison'>('line');
  const [selectedMetric, setSelectedMetric] = useState<'votes' | 'percentage' | 'turnout'>('percentage');

  // Group data by year
  const dataByYear = data.reduce((acc, item) => {
    if (!acc[item.year]) {
      acc[item.year] = [];
    }
    acc[item.year].push(item);
    return {};
  }, {} as Record<number, HistoricalData[]>);

  // Prepare data for charts
  const years = [2013, 2017, 2022];
  const candidates = Array.from(new Set(data.map(d => d.candidate)));

  const chartData = years.map(year => {
    const yearData = data.filter(d => d.year === year);
    const dataPoint: any = { year };
    
    yearData.forEach(item => {
      if (selectedMetric === 'votes') {
        dataPoint[item.candidate] = item.votes;
      } else if (selectedMetric === 'percentage') {
        dataPoint[item.candidate] = item.vote_percentage;
      } else if (selectedMetric === 'turnout') {
        dataPoint['turnout'] = item.turnout_percentage || 0;
      }
    });

    return dataPoint;
  });

  // Calculate trends
  const calculateTrend = (candidate: string) => {
    const candidateData = data
      .filter(d => d.candidate === candidate)
      .sort((a, b) => a.year - b.year);

    if (candidateData.length < 2) return null;

    const first = candidateData[0].vote_percentage;
    const last = candidateData[candidateData.length - 1].vote_percentage;
    const change = last - first;

    return {
      change,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs(change),
    };
  };

  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#ec4899', // pink
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {county && (
          <p className="text-sm text-gray-600">
            Historical data for {county} (2013, 2017, 2022)
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* View Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            View Mode
          </label>
          <div className="flex gap-2">
            {(['line', 'bar', 'comparison'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {mode === 'line' && '📈'}
                {mode === 'bar' && '📊'}
                {mode === 'comparison' && '⚖️'}
                {' '}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metric
          </label>
          <div className="flex gap-2">
            {(['percentage', 'votes', 'turnout'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === metric
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {metric === 'percentage' && '%'}
                {metric === 'votes' && '#'}
                {metric === 'turnout' && '👥'}
                {' '}
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mb-6">
        {viewMode === 'line' && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetric === 'turnout' ? (
                <Line
                  type="monotone"
                  dataKey="turnout"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 5 }}
                  name="Turnout %"
                />
              ) : (
                candidates.map((candidate, index) => (
                  <Line
                    key={candidate}
                    type="monotone"
                    dataKey={candidate}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    name={candidate}
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'bar' && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetric === 'turnout' ? (
                <Bar dataKey="turnout" fill="#3b82f6" name="Turnout %" />
              ) : (
                candidates.map((candidate, index) => (
                  <Bar
                    key={candidate}
                    dataKey={candidate}
                    fill={colors[index % colors.length]}
                    name={candidate}
                  />
                ))
              )}
            </BarChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'comparison' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((candidate, index) => {
              const trend = calculateTrend(candidate);
              const candidateData = data
                .filter(d => d.candidate === candidate)
                .sort((a, b) => a.year - b.year);

              return (
                <div
                  key={candidate}
                  className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{candidate}</h3>
                  <div className="space-y-2">
                    {candidateData.map(item => (
                      <div key={item.year} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.year}:</span>
                        <span className="font-medium" style={{ color: colors[index % colors.length] }}>
                          {selectedMetric === 'votes'
                            ? item.votes.toLocaleString()
                            : `${item.vote_percentage.toFixed(1)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                  {trend && (
                    <div className={`mt-3 pt-3 border-t border-gray-200 text-sm ${
                      trend.direction === 'up' ? 'text-green-600' :
                      trend.direction === 'down' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      <span className="font-medium">
                        {trend.direction === 'up' && '↗️ '}
                        {trend.direction === 'down' && '↘️ '}
                        {trend.direction === 'stable' && '→ '}
                        Trend: {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                        {trend.percentage.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
        <div>
          <p className="text-sm text-blue-600 font-medium">Elections Analyzed</p>
          <p className="text-2xl font-bold text-blue-900">{years.length}</p>
        </div>
        <div>
          <p className="text-sm text-blue-600 font-medium">Candidates Tracked</p>
          <p className="text-2xl font-bold text-blue-900">{candidates.length}</p>
        </div>
        <div>
          <p className="text-sm text-blue-600 font-medium">Data Points</p>
          <p className="text-2xl font-bold text-blue-900">{data.length}</p>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>💡 Insight:</strong> Historical trends help identify voting patterns and predict future outcomes.
          Use this data to understand how support has shifted over time.
        </p>
      </div>
    </div>
  );
}

