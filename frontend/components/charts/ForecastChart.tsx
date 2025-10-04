'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface Candidate {
  id: number;
  name: string;
  party: string;
  votes: number;
  percentage: number;
}

interface ElectionData {
  election: {
    id: number;
    year: number;
    type: string;
    date: string;
  };
  registered_voters: number;
  total_votes_cast: number;
  turnout_percentage: number;
  candidates: Candidate[];
}

interface ElectionHistoryResponse {
  county: {
    code: string;
    name: string;
  };
  elections: ElectionData[];
}

interface ForecastChartProps {
  countyCode: string;
  countyName: string;
}

export default function ForecastChart({ countyCode, countyName }: ForecastChartProps) {
  const [electionHistory, setElectionHistory] = useState<ElectionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElectionHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/counties/${countyCode}/election-history`);
        if (!response.ok) throw new Error('Failed to fetch election history');
        const data: ElectionHistoryResponse = await response.json();
        setElectionHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchElectionHistory();
  }, [countyCode]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading election history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center text-red-600">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!electionHistory || electionHistory.elections.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2">No election history available for {countyName}</p>
        </div>
      </div>
    );
  }

  // Transform API response to chart data format
  const yearlyData = electionHistory.elections.map(electionData => ({
    year: electionData.election.year,
    turnout: electionData.turnout_percentage,
    candidates: electionData.candidates.map(c => ({
      name: c.name,
      party: c.party,
      votes: c.votes,
      percentage: c.percentage,
    })),
  }));

  // Sort by year
  yearlyData.sort((a, b) => a.year - b.year);

  // Prepare data for turnout chart
  const turnoutData = yearlyData.map(d => ({
    year: d.year,
    turnout: d.turnout,
  }));

  // Get top candidates across all elections for the line chart
  const candidateVotes = new Map<string, Array<{ year: number; percentage: number }>>();

  electionHistory.elections.forEach(electionData => {
    electionData.candidates.forEach(candidate => {
      const key = `${candidate.name} (${candidate.party})`;
      if (!candidateVotes.has(key)) {
        candidateVotes.set(key, []);
      }
      candidateVotes.get(key)!.push({
        year: electionData.election.year,
        percentage: candidate.percentage,
      });
    });
  });

  // Prepare data for candidate performance chart
  const candidateData = yearlyData.map(yearData => {
    const dataPoint: any = { year: yearData.year };
    yearData.candidates.forEach(candidate => {
      const key = `${candidate.name} (${candidate.party})`;
      dataPoint[key] = candidate.percentage;
    });
    return dataPoint;
  });

  // Get unique candidates for the legend
  const uniqueCandidates = Array.from(candidateVotes.keys());
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Turnout Trend */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Voter Turnout Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={turnoutData}>
            <defs>
              <linearGradient id="colorTurnout" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              label={{ value: 'Turnout %', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Turnout']}
            />
            <Area
              type="monotone"
              dataKey="turnout"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorTurnout)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Candidate Performance */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Candidate Performance</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={candidateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              label={{ value: 'Vote %', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              iconType="line"
            />
            {uniqueCandidates.map((candidate, index) => (
              <Line
                key={candidate}
                type="monotone"
                dataKey={candidate}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Election Summary Table */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Election Results Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Winner</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Votes</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Turnout</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {yearlyData.map(yearData => {
                const winner = yearData.candidates.reduce((prev, current) =>
                  current.percentage > prev.percentage ? current : prev
                );
                return (
                  <tr key={yearData.year} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{yearData.year}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700">{winner.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">{winner.party}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-gray-700">{winner.votes.toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right font-medium text-blue-600">{winner.percentage.toFixed(1)}%</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-gray-600">{yearData.turnout.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

