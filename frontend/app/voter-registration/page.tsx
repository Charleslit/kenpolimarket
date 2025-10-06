'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Map, TrendingUp, Users, Building2, MapPin } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PollingStationStats {
  total_polling_stations: number;
  total_registered_voters: number;
  total_registration_centers: number;
  avg_voters_per_station: number;
  max_voters_per_station: number;
  min_voters_per_station: number;
  counties_count: number;
  constituencies_count: number;
  wards_count: number;
}

interface CountyData {
  id: number;
  code: string;
  name: string;
  polling_stations: number;
  registration_centers: number;
  total_voters: number;
  avg_voters_per_station: number;
}

export default function VoterRegistrationPage() {
  const [stats, setStats] = useState<PollingStationStats | null>(null);
  const [countyData, setCountyData] = useState<CountyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, countyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/polling-stations/stats`),
        fetch(`${API_BASE_URL}/api/polling-stations/by-county`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (countyRes.ok) {
        const countyData = await countyRes.json();
        setCountyData(countyData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const top10Counties = countyData.slice(0, 10);
  const chartData = top10Counties.map(c => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
    voters: c.total_voters,
    stations: c.polling_stations
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">🗳️ Voter Registration Dashboard</h1>
          <p className="text-green-100">
            Comprehensive analysis of Kenya's 2022 polling station data
          </p>
        </div>



        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Voters</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats.total_registered_voters / 1000000).toFixed(2)}M
                  </p>
                </div>
                <Users className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Polling Stations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_polling_stations.toLocaleString()}
                  </p>
                </div>
                <MapPin className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Reg. Centers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_registration_centers.toLocaleString()}
                  </p>
                </div>
                <Building2 className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg per Station</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(stats.avg_voters_per_station)}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-600 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 Counties by Voters */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Counties by Registered Voters</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="voters" fill="#3B82F6" name="Registered Voters" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 10 Counties by Stations */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Counties by Polling Stations</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stations" fill="#10B981" name="Polling Stations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* County Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">County Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">County</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Polling Stations</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Reg. Centers</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Voters</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg/Station</th>
                </tr>
              </thead>
              <tbody>
                {countyData.map((county, index) => (
                  <tr key={county.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-3 px-4 text-gray-900">{county.name}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{county.polling_stations.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{county.registration_centers.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{county.total_voters.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{Math.round(county.avg_voters_per_station)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

