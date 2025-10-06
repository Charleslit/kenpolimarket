'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import ExportButton from '../common/ExportButton';
import { exportTableToPDF, exportObjectsToCSV, exportElementAsImage } from '@/utils/exportUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface Election {
  id: number;
  year: number;
  type: string;
  date: string;
}

interface County {
  id: number;
  code: string;
  name: string;
}

interface ComparisonResult {
  county: string;
  county_code: string;
  year_1_votes: number;
  year_2_votes: number;
  change: number;
  change_percentage: number;
  swing: 'gain' | 'loss' | 'stable';
}

interface CandidateComparison {
  candidate_name: string;
  party: string;
  year_1_total: number;
  year_2_total: number;
  change: number;
  change_percentage: number;
  year_1_share: number;
  year_2_share: number;
}

export default function VotingPatternComparison() {
  const [elections, setElections] = useState<Election[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  
  // Selection state
  const [selectedElection1, setSelectedElection1] = useState<number | null>(null);
  const [selectedElection2, setSelectedElection2] = useState<number | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<number | null>(null);
  const [comparisonType, setComparisonType] = useState<'national' | 'county'>('national');
  
  // Results
  const [countyResults, setCountyResults] = useState<ComparisonResult[]>([]);
  const [candidateResults, setCandidateResults] = useState<CandidateComparison[]>([]);
  const [hasResults, setHasResults] = useState(false);

  useEffect(() => {
    fetchElections();
    fetchCounties();
  }, []);

  const fetchElections = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/elections/`);
      const data = await response.json();
      setElections(data);
    } catch (error) {
      console.error('Failed to fetch elections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounties = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/counties/`);
      const data = await response.json();
      setCounties(data);
    } catch (error) {
      console.error('Failed to fetch counties:', error);
    }
  };

  const handleCompare = async () => {
    if (!selectedElection1 || !selectedElection2) {
      alert('Please select two elections to compare');
      return;
    }

    if (selectedElection1 === selectedElection2) {
      alert('Please select different elections');
      return;
    }

    setComparing(true);
    setHasResults(false);

    try {
      // Fetch results for both elections
      const [results1, results2] = await Promise.all([
        fetch(`${API_BASE_URL}/elections/${selectedElection1}/results`).then(r => r.json()),
        fetch(`${API_BASE_URL}/elections/${selectedElection2}/results`).then(r => r.json())
      ]);

      // Process and compare results
      if (comparisonType === 'national') {
        compareNationalResults(results1, results2);
      } else {
        compareCountyResults(results1, results2);
      }

      setHasResults(true);
    } catch (error) {
      console.error('Comparison failed:', error);
      alert('Failed to compare elections. Please try again.');
    } finally {
      setComparing(false);
    }
  };

  const compareNationalResults = (results1: any, results2: any) => {
    // Compare candidate totals
    const candidates1 = results1.summary?.candidate_totals || [];
    const candidates2 = results2.summary?.candidate_totals || [];

    const comparisonMap = new Map<string, CandidateComparison>();

    // Process first election
    candidates1.forEach((c: any) => {
      comparisonMap.set(c.name, {
        candidate_name: c.name,
        party: c.party,
        year_1_total: c.total_votes,
        year_2_total: 0,
        change: 0,
        change_percentage: 0,
        year_1_share: c.percentage,
        year_2_share: 0
      });
    });

    // Process second election
    candidates2.forEach((c: any) => {
      const existing = comparisonMap.get(c.name);
      if (existing) {
        existing.year_2_total = c.total_votes;
        existing.year_2_share = c.percentage;
        existing.change = c.total_votes - existing.year_1_total;
        existing.change_percentage = existing.year_1_total > 0
          ? ((c.total_votes - existing.year_1_total) / existing.year_1_total) * 100
          : 0;
      } else {
        comparisonMap.set(c.name, {
          candidate_name: c.name,
          party: c.party,
          year_1_total: 0,
          year_2_total: c.total_votes,
          change: c.total_votes,
          change_percentage: 100,
          year_1_share: 0,
          year_2_share: c.percentage
        });
      }
    });

    setCandidateResults(Array.from(comparisonMap.values()));
  };

  const compareCountyResults = (results1: any, results2: any) => {
    // Group results by county
    const countyMap = new Map<string, ComparisonResult>();

    results1.results?.forEach((r: any) => {
      const key = r.county.code;
      if (!countyMap.has(key)) {
        countyMap.set(key, {
          county: r.county.name,
          county_code: r.county.code,
          year_1_votes: 0,
          year_2_votes: 0,
          change: 0,
          change_percentage: 0,
          swing: 'stable'
        });
      }
      const county = countyMap.get(key)!;
      county.year_1_votes += r.votes;
    });

    results2.results?.forEach((r: any) => {
      const key = r.county.code;
      if (!countyMap.has(key)) {
        countyMap.set(key, {
          county: r.county.name,
          county_code: r.county.code,
          year_1_votes: 0,
          year_2_votes: 0,
          change: 0,
          change_percentage: 0,
          swing: 'stable'
        });
      }
      const county = countyMap.get(key)!;
      county.year_2_votes += r.votes;
    });

    // Calculate changes
    countyMap.forEach((county) => {
      county.change = county.year_2_votes - county.year_1_votes;
      county.change_percentage = county.year_1_votes > 0
        ? ((county.year_2_votes - county.year_1_votes) / county.year_1_votes) * 100
        : 0;
      
      if (Math.abs(county.change_percentage) < 5) {
        county.swing = 'stable';
      } else if (county.change_percentage > 0) {
        county.swing = 'gain';
      } else {
        county.swing = 'loss';
      }
    });

    setCountyResults(Array.from(countyMap.values()).sort((a, b) => 
      Math.abs(b.change_percentage) - Math.abs(a.change_percentage)
    ));
  };

  const getElectionLabel = (electionId: number) => {
    const election = elections.find(e => e.id === electionId);
    return election ? `${election.year} ${election.type}` : '';
  };

  // Export Functions
  const handleExportPDF = () => {
    if (!hasResults || (!candidateResults.length && !countyResults.length)) return;

    const election1Label = getElectionLabel(selectedElection1!);
    const election2Label = getElectionLabel(selectedElection2!);

    if (comparisonType === 'national' && candidateResults.length > 0) {
      exportTableToPDF(
        `Election Comparison: ${election1Label} vs ${election2Label}`,
        ['Candidate', 'Party', `${election1Label} Votes`, `${election2Label} Votes`, 'Change', 'Change %'],
        candidateResults.map(c => [
          c.candidate_name,
          c.party,
          c.year_1_total.toLocaleString(),
          c.year_2_total.toLocaleString(),
          c.change.toLocaleString(),
          c.change_percentage.toFixed(1) + '%'
        ])
      );
    } else if (countyResults.length > 0) {
      exportTableToPDF(
        `County-by-County Comparison: ${election1Label} vs ${election2Label}`,
        ['County', `${election1Label} Votes`, `${election2Label} Votes`, 'Change', 'Change %', 'Trend'],
        countyResults.map(c => [
          c.county,
          c.year_1_votes.toLocaleString(),
          c.year_2_votes.toLocaleString(),
          c.change.toLocaleString(),
          c.change_percentage.toFixed(1) + '%',
          c.swing.toUpperCase()
        ])
      );
    }
  };

  const handleExportCSV = () => {
    if (!hasResults) return;

    const election1Label = getElectionLabel(selectedElection1!);
    const election2Label = getElectionLabel(selectedElection2!);

    if (comparisonType === 'national' && candidateResults.length > 0) {
      const csvData = candidateResults.map(c => ({
        Candidate: c.candidate_name,
        Party: c.party,
        [`${election1Label} Votes`]: c.year_1_total,
        [`${election1Label} Share (%)`]: c.year_1_share.toFixed(2),
        [`${election2Label} Votes`]: c.year_2_total,
        [`${election2Label} Share (%)`]: c.year_2_share.toFixed(2),
        'Vote Change': c.change,
        'Change (%)': c.change_percentage.toFixed(2)
      }));
      exportObjectsToCSV(csvData, `KenPoliMarket_Comparison_${election1Label}_vs_${election2Label}.csv`);
    } else if (countyResults.length > 0) {
      const csvData = countyResults.map(c => ({
        County: c.county,
        'County Code': c.county_code,
        [`${election1Label} Votes`]: c.year_1_votes,
        [`${election2Label} Votes`]: c.year_2_votes,
        'Vote Change': c.change,
        'Change (%)': c.change_percentage.toFixed(2),
        'Trend': c.swing.toUpperCase()
      }));
      exportObjectsToCSV(csvData, `KenPoliMarket_County_Comparison_${election1Label}_vs_${election2Label}.csv`);
    }
  };

  const handleExportImage = async () => {
    await exportElementAsImage('comparison-results');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Voting Pattern Comparison</h2>
        <p className="text-purple-100">
          Compare election results across different years to identify trends and patterns
        </p>
      </div>

      {/* Selection Panel */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Elections to Compare</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Election
            </label>
            <select
              value={selectedElection1 || ''}
              onChange={(e) => setSelectedElection1(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Election</option>
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.year} - {election.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Second Election
            </label>
            <select
              value={selectedElection2 || ''}
              onChange={(e) => setSelectedElection2(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Election</option>
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.year} - {election.type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comparison Type
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => setComparisonType('national')}
              className={`px-4 py-2 rounded-lg border ${
                comparisonType === 'national'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              National Comparison
            </button>
            <button
              onClick={() => setComparisonType('county')}
              className={`px-4 py-2 rounded-lg border ${
                comparisonType === 'county'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              County-by-County
            </button>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={!selectedElection1 || !selectedElection2 || comparing}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          {comparing ? 'Comparing...' : 'Compare Elections'}
        </button>
      </div>

      {/* Results */}
      {hasResults && (
        <div id="comparison-results" className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Comparison Results: {getElectionLabel(selectedElection1!)} vs {getElectionLabel(selectedElection2!)}
            </h3>
            <ExportButton
              variant="compact"
              onExportPDF={handleExportPDF}
              onExportCSV={handleExportCSV}
              onExportImage={handleExportImage}
            />
          </div>

          {/* National Comparison Results */}
          {comparisonType === 'national' && candidateResults.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {getElectionLabel(selectedElection1!)}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {getElectionLabel(selectedElection2!)}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Change</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trend</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {candidateResults.map((result, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.candidate_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.party}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {result.year_1_total.toLocaleString()}
                        <span className="text-xs text-gray-500 ml-1">
                          ({result.year_1_share.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {result.year_2_total.toLocaleString()}
                        <span className="text-xs text-gray-500 ml-1">
                          ({result.year_2_share.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`font-semibold ${
                          result.change > 0 ? 'text-green-600' : result.change < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {result.change > 0 ? '+' : ''}{result.change.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {result.change > 0 ? (
                          <div className="flex items-center justify-end text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span className="text-sm font-semibold">+{result.change_percentage.toFixed(1)}%</span>
                          </div>
                        ) : result.change < 0 ? (
                          <div className="flex items-center justify-end text-red-600">
                            <TrendingDown className="w-4 h-4 mr-1" />
                            <span className="text-sm font-semibold">{result.change_percentage.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end text-gray-600">
                            <Minus className="w-4 h-4 mr-1" />
                            <span className="text-sm">0%</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* County Comparison Results */}
          {comparisonType === 'county' && countyResults.length > 0 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {countyResults.slice(0, 20).map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      result.swing === 'gain'
                        ? 'border-green-200 bg-green-50'
                        : result.swing === 'loss'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">{result.county}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Year 1:</span>
                        <span className="font-medium">{result.year_1_votes.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Year 2:</span>
                        <span className="font-medium">{result.year_2_votes.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                        <span className="text-gray-600">Change:</span>
                        <div className={`flex items-center font-semibold ${
                          result.swing === 'gain' ? 'text-green-600' : result.swing === 'loss' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {result.swing === 'gain' && <TrendingUp className="w-4 h-4 mr-1" />}
                          {result.swing === 'loss' && <TrendingDown className="w-4 h-4 mr-1" />}
                          {result.swing === 'stable' && <Minus className="w-4 h-4 mr-1" />}
                          <span>{result.change_percentage > 0 ? '+' : ''}{result.change_percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

