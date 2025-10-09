'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ExportButton from '@/components/ui/ExportButton';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface NationalSummary {
  forecast_run_id: string;
  election_year: number;
  model_name: string;
  model_version: string;
  run_timestamp: string;
  total_predicted_votes: number;
  candidates: {
    candidate_name: string;
    party: string;
    predicted_votes: number;
    predicted_vote_share: number;
  }[];
}

const PARTY_COLORS: Record<string, string> = {
  'UDA': '#FFD700',
  'Azimio': '#FF6B35',
  'Wiper': '#4ECDC4',
  'ANC': '#95E1D3',
  'Independent': '#9B59B6',
  'Jubilee': '#DC143C',  // Crimson red
  'NARC-Kenya': '#E74C3C',
  'Roots Party': '#2ECC71',
};

export default function NationalDashboard() {
  const [summary, setSummary] = useState<NationalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNationalSummary = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/forecasts/summary/national`);
        if (!response.ok) throw new Error('Failed to fetch national summary');
        const data = await response.json();
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchNationalSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">{error || 'No data available'}</p>
      </div>
    );
  }

  // Sort candidates by vote share
  const sortedCandidates = [...summary.candidates]
    .sort((a, b) => b.predicted_vote_share - a.predicted_vote_share);

  // Prepare data for charts
  const barChartData = sortedCandidates.map(c => ({
    name: c.candidate_name.split(' ').slice(-1)[0], // Last name only
    votes: c.predicted_votes,
    share: c.predicted_vote_share,
    party: c.party,
  }));

  const pieChartData = sortedCandidates.map(c => ({
    name: c.candidate_name,
    value: c.predicted_vote_share,
    party: c.party,
  }));

  const winner = sortedCandidates[0];
  const runnerUp = sortedCandidates[1];
  const margin = winner.predicted_vote_share - runnerUp.predicted_vote_share;
  const needsRunoff = winner.predicted_vote_share < 50;

  // Prepare export data
  const exportData = summary.candidates.map((c: any) => ({
    Candidate: c.name,
    Party: c.party,
    'Predicted Vote Share (%)': c.predicted_vote_share.toFixed(2),
    'Predicted Votes': c.predicted_votes,
  }));

  return (
    <div className="space-y-6" id="national-dashboard">
      {/* Export Button */}
      <div className="flex justify-end">
        <ExportButton
          elementId="national-dashboard"
          filename="national_forecast_2027"
          data={exportData}
          showDataExport={true}
        />
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Votes */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Predicted Votes</p>
              <p className="text-2xl sm:text-3xl font-bold mt-2">
                {(summary.total_predicted_votes / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-2 sm:p-3">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Leading Candidate */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs sm:text-sm font-medium">Leading Candidate</p>
              <p className="text-xl sm:text-2xl font-bold mt-2">{winner.candidate_name.split(' ').slice(-1)[0]}</p>
              <p className="text-green-100 text-xs sm:text-sm mt-1">{winner.predicted_vote_share.toFixed(1)}%</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-2 sm:p-3">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Margin */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs sm:text-sm font-medium">Victory Margin</p>
              <p className="text-2xl sm:text-3xl font-bold mt-2">{margin.toFixed(1)}%</p>
              <p className="text-purple-100 text-xs sm:text-sm mt-1">vs {runnerUp.candidate_name.split(' ').slice(-1)[0]}</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-2 sm:p-3">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Runoff Status */}
        <div className={`bg-gradient-to-br ${needsRunoff ? 'from-orange-500 to-orange-600' : 'from-teal-500 to-teal-600'} rounded-xl p-4 sm:p-6 text-white shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-90 text-xs sm:text-sm font-medium">Runoff Status</p>
              <p className="text-xl sm:text-2xl font-bold mt-2">{needsRunoff ? 'Likely' : 'Unlikely'}</p>
              <p className="text-white text-opacity-90 text-xs sm:text-sm mt-1">{needsRunoff ? 'No 50%+ winner' : 'Clear majority'}</p>
            </div>
            <div className={`${needsRunoff ? 'bg-orange-400' : 'bg-teal-400'} bg-opacity-30 rounded-full p-2 sm:p-3`}>
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Vote Share by Candidate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Vote Share']}
              />
              <Bar dataKey="share" radius={[8, 8, 0, 0]}>
                {barChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PARTY_COLORS[entry.party] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Vote Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name ? name.split(' ').slice(-1)[0] : 'Unknown'}: ${typeof value === 'number' ? value.toFixed(1) : '0'}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PARTY_COLORS[entry.party] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: '12px' }}
                formatter={(value: number) => `${value.toFixed(2)}%`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Candidate Cards */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Detailed Breakdown</h3>
        <div className="space-y-3">
          {sortedCandidates.map((candidate, index) => (
            <div
              key={candidate.candidate_name}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 font-bold text-sm sm:text-base text-gray-700">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base text-gray-900">{candidate.candidate_name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{candidate.party}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{candidate.predicted_vote_share.toFixed(1)}%</p>
                  <p className="text-xs sm:text-sm text-gray-500">{(candidate.predicted_votes / 1000000).toFixed(2)}M votes</p>
                </div>
                <div className="w-24 sm:w-32">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${candidate.predicted_vote_share}%`,
                        backgroundColor: PARTY_COLORS[candidate.party] || '#94a3b8',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Info */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <div>
            <span className="font-medium">Model:</span> {summary.model_name} {summary.model_version}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span> {new Date(summary.run_timestamp).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Election:</span> {summary.election_year}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-300">
          <p className="text-xs text-gray-500 italic text-center">
            KenPoliMarket | Electoral Forecasting & Political Analysis
          </p>
        </div>
      </div>
    </div>
  );
}

