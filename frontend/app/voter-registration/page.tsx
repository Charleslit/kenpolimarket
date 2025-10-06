'use client';

import { useState, useEffect } from 'react';
import { Upload, BarChart3, Map, TrendingUp, Users, Building2, MapPin } from 'lucide-react';
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/polling-stations/import-csv`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setUploadProgress(result);
        
        if (result.status === 'completed') {
          // Refresh data after successful upload
          setTimeout(() => {
            fetchData();
            setSelectedFile(null);
            setUploadProgress(null);
          }, 2000);
        }
      } else {
        const error = await response.json();
        setUploadProgress({
          status: 'failed',
          message: error.detail || 'Upload failed'
        });
      }
    } catch (error: any) {
      setUploadProgress({
        status: 'failed',
        message: error.message || 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
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

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-600" />
            Import Polling Station Data
          </h2>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Drag and drop your CSV file here, or click to browse
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
            >
              Choose File
            </label>

            {selectedFile && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="mt-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {uploading ? 'Uploading...' : 'Upload & Import'}
                </button>
              </div>
            )}
          </div>

          {uploadProgress && (
            <div className={`mt-4 p-4 rounded-lg ${
              uploadProgress.status === 'completed' ? 'bg-green-50 border border-green-200' :
              uploadProgress.status === 'failed' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`font-semibold ${
                uploadProgress.status === 'completed' ? 'text-green-800' :
                uploadProgress.status === 'failed' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {uploadProgress.message}
              </p>
              {uploadProgress.processed_rows > 0 && (
                <div className="mt-2 text-sm text-gray-700">
                  <p>Processed: {uploadProgress.processed_rows.toLocaleString()} rows</p>
                  <p>Created: {uploadProgress.created_stations.toLocaleString()} stations</p>
                  <p>Updated: {uploadProgress.updated_stations.toLocaleString()} stations</p>
                </div>
              )}
            </div>
          )}
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

