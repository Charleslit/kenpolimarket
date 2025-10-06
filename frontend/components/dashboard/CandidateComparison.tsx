'use client';

import { useEffect, useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Candidate {
  id: number;
  name: string;
  party: string;
}

interface CandidateStats {
  candidate: Candidate;
  national_share: number;
  counties_leading: number;
  total_votes: number;
  avg_margin: number;
  strongholds: string[];
  weakest: string[];
}

const PARTY_COLORS: Record<string, string> = {
  'UDA': '#FFD700',
  'Azimio': '#FF6B35',
  'Wiper': '#4ECDC4',
  'ANC': '#95E1D3',
  'Independent': '#9B59B6',
  'Jubilee': '#DC143C',  // Crimson red
};

export default function CandidateComparison() {
  const [candidates, setCandidates] = useState<CandidateStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch national summary
        const summaryRes = await fetch(`${API_BASE_URL}/forecasts/summary/national`);
        const summary = await summaryRes.json();

        // Fetch county data for each candidate
        const candidateStatsPromises = summary.candidates.map(async (c: any) => {
          // Fetch all counties to find where this candidate is leading
          const countiesRes = await fetch(`${API_BASE_URL}/counties/`);
          const counties = await countiesRes.json();

          let countiesLeading = 0;
          const strongholds: { county: string; share: number }[] = [];
          const weakest: { county: string; share: number }[] = [];

          for (const county of counties) {
            try {
              const forecastRes = await fetch(
                `${API_BASE_URL}/forecasts/county/${county.code}/latest?election_year=2027`
              );
              const forecasts = await forecastRes.json();

              const candidateForecast = forecasts.find(
                (f: any) => f.candidate.name === c.candidate_name
              );

              if (candidateForecast) {
                const share = parseFloat(candidateForecast.predicted_vote_share);
                
                // Check if leading
                const isLeading = forecasts.every(
                  (f: any) => f.candidate.name === c.candidate_name || 
                  parseFloat(f.predicted_vote_share) <= share
                );

                if (isLeading) countiesLeading++;

                strongholds.push({ county: county.name, share });
                weakest.push({ county: county.name, share });
              }
            } catch (err) {
              // Skip county if error
            }
          }

          // Sort to find strongholds and weakest
          strongholds.sort((a, b) => b.share - a.share);
          weakest.sort((a, b) => a.share - b.share);

          return {
            candidate: {
              id: c.candidate_id || 0,
              name: c.candidate_name,
              party: c.party,
            },
            national_share: c.predicted_vote_share,
            counties_leading: countiesLeading,
            total_votes: c.predicted_votes,
            avg_margin: 0, // Calculate if needed
            strongholds: strongholds.slice(0, 5).map(s => `${s.county} (${s.share.toFixed(1)}%)`),
            weakest: weakest.slice(0, 5).map(w => `${w.county} (${w.share.toFixed(1)}%)`),
          };
        });

        const stats = await Promise.all(candidateStatsPromises);
        setCandidates(stats);
        
        // Select top 3 by default
        setSelectedCandidates(stats.slice(0, 3).map(s => s.candidate.id));
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleCandidate = (id: number) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const selectedStats = candidates.filter(c => selectedCandidates.includes(c.candidate.id));

  // Prepare radar chart data
  const radarData = [
    {
      metric: 'National Share',
      ...Object.fromEntries(selectedStats.map(s => [s.candidate.name, s.national_share])),
    },
    {
      metric: 'Counties Leading',
      ...Object.fromEntries(selectedStats.map(s => [s.candidate.name, (s.counties_leading / 47) * 100])),
    },
    {
      metric: 'Vote Strength',
      ...Object.fromEntries(selectedStats.map(s => [s.candidate.name, (s.total_votes / 20000000) * 100])),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Candidate Selector */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Candidates to Compare</h3>
        <div className="flex flex-wrap gap-3">
          {candidates.map(c => (
            <button
              key={c.candidate.id}
              onClick={() => toggleCandidate(c.candidate.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCandidates.includes(c.candidate.id)
                  ? 'text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: selectedCandidates.includes(c.candidate.id)
                  ? PARTY_COLORS[c.candidate.party] || '#94a3b8'
                  : undefined,
              }}
            >
              {c.candidate.name} ({c.candidate.party})
            </button>
          ))}
        </div>
      </div>

      {selectedStats.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Select at least one candidate to compare</p>
        </div>
      ) : (
        <>
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedStats.map(stat => (
              <div
                key={stat.candidate.id}
                className="bg-white rounded-xl shadow-lg border-2 p-6"
                style={{ borderColor: PARTY_COLORS[stat.candidate.party] || '#94a3b8' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{stat.candidate.name}</h3>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: PARTY_COLORS[stat.candidate.party] || '#94a3b8' }}
                  >
                    {stat.candidate.party}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">National Share</span>
                    <span className="text-2xl font-bold text-gray-900">{stat.national_share.toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Counties Leading</span>
                    <span className="text-xl font-semibold text-gray-900">{stat.counties_leading}/47</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Votes</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {(stat.total_votes / 1000000).toFixed(2)}M
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Top Strongholds:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {stat.strongholds.slice(0, 3).map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Radar Chart */}
          {selectedStats.length >= 2 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  {selectedStats.map(stat => (
                    <Radar
                      key={stat.candidate.id}
                      name={stat.candidate.name}
                      dataKey={stat.candidate.name}
                      stroke={PARTY_COLORS[stat.candidate.party] || '#94a3b8'}
                      fill={PARTY_COLORS[stat.candidate.party] || '#94a3b8'}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Head-to-Head Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Head-to-Head Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                    {selectedStats.map(stat => (
                      <th
                        key={stat.candidate.id}
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                      >
                        {stat.candidate.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      National Vote Share
                    </td>
                    {selectedStats.map(stat => (
                      <td key={stat.candidate.id} className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-gray-900">{stat.national_share.toFixed(1)}%</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Counties Leading
                    </td>
                    {selectedStats.map(stat => (
                      <td key={stat.candidate.id} className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-semibold text-gray-900">{stat.counties_leading}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Total Votes
                    </td>
                    {selectedStats.map(stat => (
                      <td key={stat.candidate.id} className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-semibold text-gray-900">
                          {(stat.total_votes / 1000000).toFixed(2)}M
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

