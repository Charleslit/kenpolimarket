'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import ExportButton from '@/components/ui/ExportButton';

interface ForecastData {
  id: number;
  forecast_run_id: string;
  county_id: number;
  candidate_id: number;
  predicted_vote_share: number;
  lower_bound_90: number;
  upper_bound_90: number;
  predicted_votes: number;
  predicted_turnout: number;
  candidate: {
    id: number;
    name: string;
    party: string;
  };
  county: {
    code: string;
    name: string;
  };
}

interface ForecastWithUncertaintyProps {
  countyCode: string;
  electionYear?: number;
}

const ForecastWithUncertainty: React.FC<ForecastWithUncertaintyProps> = ({
  countyCode,
  electionYear = 2027,
}) => {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecasts = async () => {
      if (!countyCode) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/forecasts/county/${countyCode}/latest?election_year=${electionYear}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError('No forecasts available for this county yet.');
          } else {
            throw new Error('Failed to fetch forecasts');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setForecasts(data);
      } catch (err) {
        console.error('Error fetching forecasts:', err);
        setError('Failed to load forecast data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchForecasts();
  }, [countyCode, electionYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">{error}</p>
      </div>
    );
  }

  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No forecast data available for this county.</p>
      </div>
    );
  }

  // Prepare data for visualization
  const chartData = forecasts.map((forecast) => ({
    candidate: `${forecast.candidate.name} (${forecast.candidate.party})`,
    predicted: parseFloat(forecast.predicted_vote_share.toString()),
    lower: parseFloat(forecast.lower_bound_90.toString()),
    upper: parseFloat(forecast.upper_bound_90.toString()),
    uncertainty: [
      parseFloat(forecast.lower_bound_90.toString()),
      parseFloat(forecast.upper_bound_90.toString()),
    ],
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-gray-900 mb-2">{data.candidate}</p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Predicted:</span> {data.predicted.toFixed(2)}%
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">90% CI:</span> [{data.lower.toFixed(2)}%, {data.upper.toFixed(2)}%]
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Uncertainty range: ±{((data.upper - data.lower) / 2).toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Get colors for candidates (party colors)
  const PARTY_COLORS: Record<string, string> = {
    'UDA': '#FFD700',
    'Azimio': '#FF6B35',
    'Wiper': '#4ECDC4',
    'ANC': '#95E1D3',
    'Independent': '#9B59B6',
    'Jubilee': '#DC143C',  // Crimson red
  };

  const getColor = (party: string, index: number) => {
    if (PARTY_COLORS[party]) {
      return PARTY_COLORS[party];
    }
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    return colors[index % colors.length];
  };

  // Prepare pie chart data
  const pieChartData = forecasts.map((forecast) => ({
    name: forecast.candidate.name,
    value: parseFloat(forecast.predicted_vote_share.toString()),
    party: forecast.candidate.party,
  }));

  // Prepare export data
  const exportData = forecasts.map((forecast) => ({
    Candidate: forecast.candidate.name,
    Party: forecast.candidate.party,
    'Predicted Vote Share (%)': parseFloat(forecast.predicted_vote_share.toString()).toFixed(2),
    'Lower Bound 90% (%)': parseFloat(forecast.lower_bound_90.toString()).toFixed(2),
    'Upper Bound 90% (%)': parseFloat(forecast.upper_bound_90.toString()).toFixed(2),
    'Predicted Votes': forecast.predicted_votes,
    'Predicted Turnout (%)': parseFloat(forecast.predicted_turnout.toString()).toFixed(2),
  }));

  return (
    <div className="space-y-6" id="county-forecast-view">
      {/* Header with Export Button */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              🔮 {electionYear} Election Forecast
            </h3>
            <p className="text-sm text-gray-600">
              Probabilistic predictions with 90% credible intervals
            </p>
          </div>
          <ExportButton
            elementId="county-forecast-view"
            filename={`forecast_county_${countyCode}_${electionYear}`}
            data={exportData}
            showDataExport={true}
          />
        </div>
      </div>

      {/* Forecast Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forecasts.map((forecast, index) => (
          <div
            key={forecast.id}
            className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                  {forecast.candidate.name}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600">{forecast.candidate.party}</p>
              </div>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getColor(forecast.candidate.party, index) }}
              ></div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Predicted Vote Share</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {parseFloat(forecast.predicted_vote_share.toString()).toFixed(1)}%
                </p>
              </div>

              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-600 mb-1">90% Credible Interval</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {parseFloat(forecast.lower_bound_90.toString()).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">to</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {parseFloat(forecast.upper_bound_90.toString()).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div>
                  <p className="text-gray-600">Predicted Votes</p>
                  <p className="font-semibold text-gray-900">
                    {forecast.predicted_votes.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Turnout</p>
                  <p className="font-semibold text-gray-900">
                    {parseFloat(forecast.predicted_turnout.toString()).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pie Chart and Bar Chart Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Vote Distribution
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }: { name?: string; value?: number }) =>
                  name && typeof value === 'number'
                    ? `${name.split(' ').slice(-1)[0]}: ${value.toFixed(1)}%`
                    : ''
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.party, index)} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Visual representation of predicted vote share distribution</p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Vote Share Comparison
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pieChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ value: 'Vote Share (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Vote Share']}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.party, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Side-by-side comparison of predicted vote shares</p>
          </div>
        </div>
      </div>

      {/* Uncertainty Visualization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Vote Share with Uncertainty Bands
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="candidate"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={80}
            />
            <YAxis
              label={{ value: 'Vote Share (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Uncertainty band */}
            <Area
              type="monotone"
              dataKey="uncertainty"
              fill="#93c5fd"
              stroke="none"
              fillOpacity={0.3}
              name="90% Credible Interval"
            />

            {/* Predicted value line */}
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="#3b82f6"
              fillOpacity={0.1}
              name="Predicted Vote Share"
            />

            {/* 50% reference line */}
            <ReferenceLine
              y={50}
              stroke="#9ca3af"
              strokeDasharray="3 3"
              label={{ value: '50%', position: 'right' }}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>
            Shaded area represents 90% credible interval. There is a 90% probability that the
            true vote share falls within this range.
          </p>
        </div>
      </div>

      {/* Model Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs sm:text-sm text-gray-600">
          <span className="font-semibold">Model:</span> SimpleBayesianForecast v1.0 |{' '}
          <span className="font-semibold">Method:</span> Monte Carlo sampling (2000 samples) |{' '}
          <span className="font-semibold">Based on:</span> Official IEBC data from 2022
        </p>
        <p className="text-xs text-gray-500 mt-2 italic">
          BlockcertAfrica | Electoral Forecasting & Political Analysis
        </p>
      </div>
    </div>
  );
};

export default ForecastWithUncertainty;

