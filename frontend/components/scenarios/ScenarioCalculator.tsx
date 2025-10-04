'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface Candidate {
  id: number;
  name: string;
  party: string;
}

interface RegionalAdjustment {
  region: string;
  candidate_shares: Record<string, number>;
}

interface ScenarioResult {
  scenario_name: string;
  description: string;
  base_forecast: string;
  national_results: Record<string, {
    votes: number;
    share: number;
    change: number;
    original_votes: number;
    original_share: number;
  }>;
  regional_changes: any[];
  winner: string;
  margin: number;
}

const REGIONS = [
  'Mount Kenya',
  'Rift Valley',
  'Nyanza',
  'Western',
  'Lower Eastern',
  'Coast',
  'Northern',
  'Nairobi'
];

const PARTY_COLORS: Record<string, string> = {
  'UDA': '#FFD700',
  'Azimio': '#FF6B35',
  'Independent': '#4A90E2',
  'Wiper': '#2ECC71',
  'ANC': '#9B59B6',
};

export default function ScenarioCalculator() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('Mount Kenya');
  const [adjustments, setAdjustments] = useState<RegionalAdjustment[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Current adjustment for selected region
  const [currentShares, setCurrentShares] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    // Initialize current shares when candidates change
    if (candidates.length > 0) {
      const initialShares: Record<string, number> = {};
      const equalShare = 100 / candidates.length;
      candidates.forEach(c => {
        initialShares[c.name] = equalShare;
      });
      setCurrentShares(initialShares);
    }
  }, [candidates]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/?position=President`);
      const data = await response.json();
      setCandidates(data);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareChange = (candidateName: string, value: number) => {
    setCurrentShares(prev => ({
      ...prev,
      [candidateName]: value
    }));
  };

  const getTotalShare = () => {
    return Object.values(currentShares).reduce((sum, val) => sum + val, 0);
  };

  const handleAddAdjustment = () => {
    const total = getTotalShare();
    if (Math.abs(total - 100) > 0.1) {
      alert(`Shares must sum to 100%. Current total: ${total.toFixed(1)}%`);
      return;
    }

    // Check if region already has an adjustment
    const existingIndex = adjustments.findIndex(a => a.region === selectedRegion);
    
    const newAdjustment: RegionalAdjustment = {
      region: selectedRegion,
      candidate_shares: { ...currentShares }
    };

    if (existingIndex >= 0) {
      // Update existing adjustment
      const newAdjustments = [...adjustments];
      newAdjustments[existingIndex] = newAdjustment;
      setAdjustments(newAdjustments);
    } else {
      // Add new adjustment
      setAdjustments([...adjustments, newAdjustment]);
    }
  };

  const handleRemoveAdjustment = (region: string) => {
    setAdjustments(adjustments.filter(a => a.region !== region));
  };

  const handleCalculate = async () => {
    if (adjustments.length === 0) {
      alert('Please add at least one regional adjustment');
      return;
    }

    if (!scenarioName.trim()) {
      alert('Please enter a scenario name');
      return;
    }

    setCalculating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/scenarios/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scenarioName,
          description: scenarioDescription,
          adjustments: adjustments
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to calculate scenario');
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error('Failed to calculate scenario:', error);
      alert(error.message || 'Failed to calculate scenario. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const handleReset = () => {
    setAdjustments([]);
    setResult(null);
    setScenarioName('');
    setScenarioDescription('');
    
    // Reset shares to equal
    if (candidates.length > 0) {
      const initialShares: Record<string, number> = {};
      const equalShare = 100 / candidates.length;
      candidates.forEach(c => {
        initialShares[c.name] = equalShare;
      });
      setCurrentShares(initialShares);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalShare = getTotalShare();
  const isValidTotal = Math.abs(totalShare - 100) < 0.1;

  // Prepare chart data for results
  const resultChartData = result ? Object.entries(result.national_results).map(([name, data]) => ({
    name: name.split(' ').slice(-1)[0],
    fullName: name,
    votes: data.votes,
    share: data.share,
    change: data.change,
    originalShare: data.original_share
  })).sort((a, b) => b.share - a.share) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Scenario Calculator</h2>
        <p className="text-sm text-gray-500 mt-1">
          Create "what-if" scenarios by adjusting regional vote shares
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Scenario Builder */}
        <div className="space-y-6">
          {/* Scenario Info */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scenario Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scenario Name *
                </label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Ruto Wins Back Mount Kenya"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={scenarioDescription}
                  onChange={(e) => setScenarioDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="What assumptions does this scenario make?"
                />
              </div>
            </div>
          </div>

          {/* Regional Adjustment */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adjust Regional Shares</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Region
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {REGIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {/* Candidate Sliders */}
              <div className="space-y-3">
                {candidates.map(candidate => (
                  <div key={candidate.id}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-700">
                        {candidate.name} ({candidate.party})
                      </label>
                      <span className="text-sm font-semibold text-gray-900">
                        {currentShares[candidate.name]?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={currentShares[candidate.name] || 0}
                      onChange={(e) => handleShareChange(candidate.name, parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        accentColor: PARTY_COLORS[candidate.party] || '#4A90E2'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Total Validation */}
              <div className={`p-3 rounded-lg ${isValidTotal ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total:</span>
                  <span className={`text-sm font-bold ${isValidTotal ? 'text-green-700' : 'text-red-700'}`}>
                    {totalShare.toFixed(1)}%
                  </span>
                </div>
                {!isValidTotal && (
                  <p className="text-xs text-red-600 mt-1">
                    Shares must sum to 100%
                  </p>
                )}
              </div>

              <button
                onClick={handleAddAdjustment}
                disabled={!isValidTotal}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {adjustments.find(a => a.region === selectedRegion) ? 'Update' : 'Add'} Adjustment for {selectedRegion}
              </button>
            </div>
          </div>

          {/* Current Adjustments */}
          {adjustments.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Current Adjustments ({adjustments.length})
              </h3>
              <div className="space-y-2">
                {adjustments.map((adj, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{adj.region}</div>
                      <div className="text-xs text-gray-500">
                        {Object.entries(adj.candidate_shares).map(([name, share]) => (
                          <span key={name} className="mr-2">
                            {name.split(' ').slice(-1)[0]}: {share.toFixed(1)}%
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAdjustment(adj.region)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleCalculate}
              disabled={calculating || adjustments.length === 0 || !scenarioName.trim()}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
            >
              {calculating ? 'Calculating...' : '🧮 Calculate Scenario'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Results Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-2">{result.scenario_name}</h3>
                {result.description && (
                  <p className="text-green-100 text-sm mb-4">{result.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-green-100 text-sm">Winner</div>
                    <div className="text-2xl font-bold">{result.winner.split(' ').slice(-1)[0]}</div>
                  </div>
                  <div>
                    <div className="text-green-100 text-sm">Margin</div>
                    <div className="text-2xl font-bold">{result.margin.toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {/* Results Chart */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">National Results</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resultChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="share" fill="#4A90E2" name="New Share (%)" />
                    <Bar dataKey="originalShare" fill="#E0E0E0" name="Original Share (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Results */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Comparison</h3>
                <div className="space-y-3">
                  {resultChartData.map((data) => (
                    <div key={data.fullName} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900">{data.fullName}</div>
                        <div className={`text-sm font-bold ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.change >= 0 ? '+' : ''}{data.change.toFixed(1)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Original</div>
                          <div className="font-semibold">{data.originalShare.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-gray-500">New</div>
                          <div className="font-semibold">{data.share.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <p className="text-gray-500 font-medium">No scenario calculated yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Add regional adjustments and click "Calculate Scenario" to see results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

