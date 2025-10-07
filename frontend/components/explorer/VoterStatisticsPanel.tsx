'use client';

import { Users, UserCheck, UserX, Accessibility } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface VoterStatistics {
  level: string;
  id: number;
  name: string;
  code?: string;
  total_registered_voters: number;
  male_voters: number;
  female_voters: number;
  pwd_voters: number;
  male_percentage: number;
  female_percentage: number;
  pwd_percentage: number;
  election_year: number;
  parent_name?: string;
}

interface VoterStatisticsPanelProps {
  statistics: VoterStatistics | null;
  loading?: boolean;
}

const GENDER_COLORS = {
  male: '#3b82f6',    // blue-500
  female: '#ec4899',  // pink-500
};

const PWD_COLORS = {
  pwd: '#8b5cf6',     // violet-500
  other: '#d1d5db',   // gray-300
};

export default function VoterStatisticsPanel({ statistics, loading }: VoterStatisticsPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No voter statistics available</p>
          <p className="text-sm mt-1">Select a location to view demographics</p>
        </div>
      </div>
    );
  }

  // Prepare data for gender pie chart
  const genderData = [
    { name: 'Male', value: statistics.male_voters, percentage: statistics.male_percentage },
    { name: 'Female', value: statistics.female_voters, percentage: statistics.female_percentage },
  ];

  // Prepare data for PWD pie chart
  const pwdData = [
    { name: 'PWD', value: statistics.pwd_voters, percentage: statistics.pwd_percentage },
    { 
      name: 'Other', 
      value: statistics.total_registered_voters - statistics.pwd_voters,
      percentage: 100 - statistics.pwd_percentage 
    },
  ];

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Voter Demographics</h3>
        </div>
        <p className="text-sm text-blue-100 mt-1">
          {statistics.name} {statistics.parent_name && `• ${statistics.parent_name}`}
        </p>
      </div>

      {/* Total Voters Card */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Total Registered Voters
            </p>
            <p className="text-4xl font-bold text-blue-900 mt-1">
              {formatNumber(statistics.total_registered_voters)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {statistics.election_year} Election Year
            </p>
          </div>
          <div className="bg-blue-600 rounded-full p-4">
            <Users className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="p-6 space-y-6">
        {/* Gender Breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Gender Distribution
          </h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Male */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <p className="text-xs font-medium text-gray-600 uppercase">Male</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {formatNumber(statistics.male_voters)}
              </p>
              <p className="text-sm text-blue-700 font-medium mt-1">
                {statistics.male_percentage.toFixed(1)}%
              </p>
            </div>

            {/* Female */}
            <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <p className="text-xs font-medium text-gray-600 uppercase">Female</p>
              </div>
              <p className="text-2xl font-bold text-pink-900">
                {formatNumber(statistics.female_voters)}
              </p>
              <p className="text-sm text-pink-700 font-medium mt-1">
                {statistics.female_percentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Gender Pie Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill={GENDER_COLORS.male} />
                  <Cell fill={GENDER_COLORS.female} />
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatNumber(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disability Statistics */}
        <div className="pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Accessibility className="w-4 h-4" />
            Persons with Disabilities (PWD)
          </h4>
          
          <div className="bg-violet-50 rounded-lg p-4 border border-violet-200 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase mb-1">
                  PWD Voters
                </p>
                <p className="text-3xl font-bold text-violet-900">
                  {formatNumber(statistics.pwd_voters)}
                </p>
              </div>
              <div className="text-right">
                <div className="bg-violet-600 rounded-full px-4 py-2">
                  <p className="text-2xl font-bold text-white">
                    {statistics.pwd_percentage.toFixed(1)}%
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">of total voters</p>
              </div>
            </div>
          </div>

          {/* PWD Pie Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pwdData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => 
                    name === 'PWD' ? `PWD: ${percentage.toFixed(1)}%` : ''
                  }
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill={PWD_COLORS.pwd} />
                  <Cell fill={PWD_COLORS.other} />
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatNumber(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 rounded p-3">
              <p className="text-gray-600 mb-1">Gender Ratio</p>
              <p className="font-semibold text-gray-900">
                {statistics.male_voters > 0 && statistics.female_voters > 0
                  ? `${(statistics.male_voters / statistics.female_voters).toFixed(2)}:1`
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-gray-600 mb-1">Data Source</p>
              <p className="font-semibold text-gray-900">IEBC {statistics.election_year}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Statistics for {statistics.level.replace('_', ' ')} level • 
          Code: {statistics.code || 'N/A'}
        </p>
      </div>
    </div>
  );
}

