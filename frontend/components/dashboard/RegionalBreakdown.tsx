'use client';

import { useEffect, useState } from 'react';
import ExportButton from '@/components/ui/ExportButton';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface County {
  code: string;
  name: string;
  population_2019: number;
  registered_voters_2022: number;
}

interface CountyForecast {
  county_code: string;
  county_name: string;
  leading_candidate: string;
  leading_party: string;
  leading_share: number;
  total_votes: number;
  turnout: number;
  all_candidates?: Array<{
    candidate_name: string;
    party: string;
    predicted_votes: number;
    predicted_vote_share: number;
  }>;
}

// Kenya regions - Updated to match actual data structure
const REGIONS: Record<string, string[]> = {
  'Nairobi Metro': ['47'],
  'Mount Kenya': ['22', '12', '21', '19', '18', '20', '14', '13'], // Kiambu, Meru, Murang'a, Nyeri, Nyandarua, Kirinyaga, Embu, Tharaka Nithi
  'Rift Valley': ['27', '32', '36', '35', '29', '34', '33', '30', '28', '26', '23', '24', '31', '25'], // Uasin Gishu, Nakuru, Bomet, Kericho, Nandi, Kajiado, Narok, Baringo, Elgeyo Marakwet, Trans Nzoia, Turkana, West Pokot, Laikipia, Samburu
  'Nyanza': ['42', '43', '44', '41', '45', '46'], // Kisumu, Homa Bay, Migori, Siaya, Kisii, Nyamira
  'Western': ['37', '39', '40', '38'], // Kakamega, Bungoma, Busia, Vihiga
  'Lower Eastern': ['16', '17', '15'], // Machakos, Makueni, Kitui
  'Coast': ['1', '3', '2', '6', '4', '5'], // Mombasa, Kilifi, Kwale, Taita Taveta, Tana River, Lamu
  'Northern': ['9', '8', '7', '10', '11'], // Mandera, Wajir, Garissa, Marsabit, Isiolo
};

const PARTY_COLORS: Record<string, string> = {
  'UDA': '#FFD700',
  'Azimio': '#FF6B35',
  'Wiper': '#4ECDC4',
  'ANC': '#95E1D3',
  'Independent': '#9B59B6',
};

export default function RegionalBreakdown() {
  const [counties, setCounties] = useState<County[]>([]);
  const [forecasts, setForecasts] = useState<CountyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  const [sortBy, setSortBy] = useState<'name' | 'share' | 'turnout'>('share');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch counties
        const countiesRes = await fetch(`${API_BASE_URL}/counties/`);
        const countiesData = await countiesRes.json();
        setCounties(countiesData);

        // Fetch forecasts for all counties
        const forecastsPromises = countiesData.map(async (county: County) => {
          try {
            const res = await fetch(`${API_BASE_URL}/forecasts/county/${county.code}/latest?election_year=2027`);
            const data = await res.json();

            if (data && data.length > 0) {
              // Find leading candidate
              const sorted = [...data].sort((a, b) =>
                parseFloat(b.predicted_vote_share) - parseFloat(a.predicted_vote_share)
              );
              const leader = sorted[0];

              // Store all candidates data for regional calculations
              const allCandidates = data.map((c: any) => ({
                candidate_name: c.candidate.name,
                party: c.candidate.party,
                predicted_votes: c.predicted_votes,
                predicted_vote_share: parseFloat(c.predicted_vote_share),
              }));

              return {
                county_code: county.code,
                county_name: county.name,
                leading_candidate: leader.candidate.name,
                leading_party: leader.candidate.party,
                leading_share: parseFloat(leader.predicted_vote_share),
                total_votes: data.reduce((sum: number, c: any) => sum + c.predicted_votes, 0),
                turnout: parseFloat(leader.predicted_turnout),
                all_candidates: allCandidates,
              };
            }
            return null;
          } catch (err) {
            return null;
          }
        });

        const forecastsData = await Promise.all(forecastsPromises);
        setForecasts(forecastsData.filter(f => f !== null) as CountyForecast[]);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter by region
  const filteredForecasts = selectedRegion === 'All Regions'
    ? forecasts
    : forecasts.filter(f => {
        const regionCounties = REGIONS[selectedRegion] || [];
        return regionCounties.includes(f.county_code);
      });

  // Sort forecasts
  const sortedForecasts = [...filteredForecasts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.county_name.localeCompare(b.county_name);
      case 'share':
        return b.leading_share - a.leading_share;
      case 'turnout':
        return b.turnout - a.turnout;
      default:
        return 0;
    }
  });

  // Calculate regional stats
  const regionalStats = Object.keys(REGIONS).map(region => {
    const regionCounties = REGIONS[region];
    const regionForecasts = forecasts.filter(f => regionCounties.includes(f.county_code));

    // Count wins by party (for display)
    const partyWins: Record<string, number> = {};
    regionForecasts.forEach(f => {
      partyWins[f.leading_party] = (partyWins[f.leading_party] || 0) + 1;
    });

    // Calculate total votes by party across ALL candidates in the region
    const partyVotes: Record<string, number> = {};
    regionForecasts.forEach(f => {
      if (f.all_candidates) {
        f.all_candidates.forEach(candidate => {
          if (!partyVotes[candidate.party]) {
            partyVotes[candidate.party] = 0;
          }
          partyVotes[candidate.party] += candidate.predicted_votes;
        });
      }
    });

    // Determine leading party by total votes (not counties won)
    const leadingPartyByVotes = Object.entries(partyVotes).sort((a, b) => b[1] - a[1])[0];
    const leadingParty = leadingPartyByVotes ? leadingPartyByVotes[0] : 'N/A';
    const wins = partyWins[leadingParty] || 0;

    const totalVotes = regionForecasts.reduce((sum, f) => sum + f.total_votes, 0);
    const avgTurnout = regionForecasts.reduce((sum, f) => sum + f.turnout, 0) / regionForecasts.length;

    return {
      region,
      counties: regionForecasts.length,
      leadingParty,
      wins,
      totalVotes,
      avgTurnout,
    };
  });

  // Prepare export data
  const exportData = filteredForecasts.map((f) => ({
    County: f.county_name,
    Region: Object.keys(REGIONS).find(r => REGIONS[r].includes(f.county_code)) || 'Unknown',
    'Leading Candidate': f.leading_candidate,
    'Leading Party': f.leading_party,
    'Vote Share (%)': f.leading_share.toFixed(2),
    'Total Votes': f.total_votes,
    'Turnout (%)': f.turnout.toFixed(2),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="regional-breakdown">
      {/* Export Button */}
      <div className="flex justify-end">
        <ExportButton
          elementId="regional-breakdown"
          filename="regional_breakdown_2027"
          data={exportData}
          showDataExport={true}
        />
      </div>

      {/* Regional Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {regionalStats.map(stat => (
          <div
            key={stat.region}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-5 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setSelectedRegion(stat.region)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">{stat.region}</h3>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: PARTY_COLORS[stat.leadingParty] || '#94a3b8' }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Leading Party:</span>
                <span className="font-medium text-gray-900">{stat.leadingParty}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Counties Won:</span>
                <span className="font-medium text-gray-900">{stat.wins}/{stat.counties}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Total Votes:</span>
                <span className="font-medium text-gray-900">{(stat.totalVotes / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Avg Turnout:</span>
                <span className="font-medium text-gray-900">{stat.avgTurnout.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Region Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Region:</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option>All Regions</option>
              {Object.keys(REGIONS).map(region => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="share">Leading Share</option>
              <option value="name">County Name</option>
              <option value="turnout">Turnout</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{sortedForecasts.length}</span> counties
          </div>
        </div>
      </div>

      {/* County Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  County
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leading Candidate
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vote Share
                </th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Votes
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turnout
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedForecasts.map((forecast) => (
                <tr key={forecast.county_code} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{forecast.county_name}</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-gray-900">{forecast.leading_candidate}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                      style={{ backgroundColor: PARTY_COLORS[forecast.leading_party] || '#94a3b8' }}
                    >
                      {forecast.leading_party}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">{forecast.leading_share.toFixed(1)}%</div>
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-xs sm:text-sm text-gray-900">{forecast.total_votes.toLocaleString()}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-xs sm:text-sm text-gray-900">{forecast.turnout.toFixed(1)}%</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Attribution */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-500 italic text-center">
            Forecast by Ongoro based on official IEBC data from 2022
          </p>
        </div>
      </div>
    </div>
  );
}

