'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Election {
  id: number;
  year: number;
  type: string;
  date: string;
  description?: string;
}

interface County {
  id: number;
  code: string;
  name: string;
}

interface Candidate {
  id: number;
  name: string;
  party: string;
  position: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  records_imported?: number;
  errors?: string[];
}

export default function ElectionDataManager() {
  const [elections, setElections] = useState<Election[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'elections' | 'import' | 'results'>('elections');

  // Election form state
  const [showElectionForm, setShowElectionForm] = useState(false);
  const [electionForm, setElectionForm] = useState({
    year: new Date().getFullYear(),
    type: 'General',
    date: '',
    description: ''
  });

  // Import state
  const [importType, setImportType] = useState<'csv' | 'json' | 'manual'>('csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  // Manual entry state
  const [selectedElection, setSelectedElection] = useState<number | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<number | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [votes, setVotes] = useState<string>('');

  useEffect(() => {
    fetchElections();
    fetchCounties();
    fetchCandidates();
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

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/`);
      const data = await response.json();
      setCandidates(data);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    }
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/elections/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(electionForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create election');
      }

      setElectionForm({ year: new Date().getFullYear(), type: 'General', date: '', description: '' });
      setShowElectionForm(false);
      fetchElections();
      alert('Election created successfully!');
    } catch (error: any) {
      console.error('Failed to create election:', error);
      alert(error.message || 'Failed to create election');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Please select a file to import');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('import_type', importType);

      const response = await fetch(`${API_BASE_URL}/elections/import`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        fetchElections();
        fetchCandidates();
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        message: error.message || 'Import failed',
        errors: [error.toString()]
      });
    } finally {
      setImporting(false);
    }
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedElection || !selectedCounty || !selectedCandidate || !votes) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/elections/${selectedElection}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          county_id: selectedCounty,
          candidate_id: selectedCandidate,
          votes: parseInt(votes)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add result');
      }

      setVotes('');
      alert('Result added successfully!');
    } catch (error: any) {
      console.error('Failed to add result:', error);
      alert(error.message || 'Failed to add result');
    }
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Election Data Management</h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('elections')}
            className={`${
              activeTab === 'elections'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Elections
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Import Data
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`${
              activeTab === 'results'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Manual Entry
          </button>
        </nav>
      </div>

      {/* Elections Tab */}
      {activeTab === 'elections' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Manage Elections</h3>
            <button
              onClick={() => setShowElectionForm(!showElectionForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showElectionForm ? 'Cancel' : 'Add Election'}
            </button>
          </div>

          {/* Election Form */}
          {showElectionForm && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Create New Election</h4>
              <form onSubmit={handleCreateElection} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                    <input
                      type="number"
                      value={electionForm.year}
                      onChange={(e) => setElectionForm({ ...electionForm, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      min="2000"
                      max="2100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={electionForm.type}
                      onChange={(e) => setElectionForm({ ...electionForm, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="General">General Election</option>
                      <option value="Presidential">Presidential</option>
                      <option value="Parliamentary">Parliamentary</option>
                      <option value="Gubernatorial">Gubernatorial</option>
                      <option value="By-Election">By-Election</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={electionForm.date}
                    onChange={(e) => setElectionForm({ ...electionForm, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={electionForm.description}
                    onChange={(e) => setElectionForm({ ...electionForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Optional description..."
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Election
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Elections List */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {elections.map((election) => (
                  <tr key={election.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {election.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {election.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(election.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {election.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Election Data</h3>

            {/* Import Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Import Format</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setImportType('csv')}
                  className={`px-4 py-2 rounded-lg border ${
                    importType === 'csv'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  CSV File
                </button>
                <button
                  onClick={() => setImportType('json')}
                  className={`px-4 py-2 rounded-lg border ${
                    importType === 'json'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  JSON File
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File ({importType.toUpperCase()})
              </label>
              <input
                type="file"
                accept={importType === 'csv' ? '.csv' : '.json'}
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={!selectedFile || importing}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {importing ? 'Importing...' : 'Import Data'}
            </button>

            {/* Import Result */}
            {importResult && (
              <div className={`mt-6 p-4 rounded-lg ${
                importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  importResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {importResult.success ? '✓ Import Successful' : '✗ Import Failed'}
                </h4>
                <p className={importResult.success ? 'text-green-700' : 'text-red-700'}>
                  {importResult.message}
                </p>
                {importResult.records_imported && (
                  <p className="text-green-700 mt-1">
                    Records imported: {importResult.records_imported}
                  </p>
                )}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-700 font-medium">Errors:</p>
                    <ul className="list-disc list-inside text-red-600 text-sm">
                      {importResult.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Format Guide */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">CSV Format Guide</h4>
              <p className="text-sm text-blue-700 mb-2">
                Your CSV file should have the following columns:
              </p>
              <code className="block text-xs bg-white p-2 rounded border border-blue-300 text-gray-800">
                election_year,county_code,candidate_name,party,position,votes
              </code>
              <p className="text-sm text-blue-700 mt-2">
                Example: <code className="text-xs bg-white px-1 py-0.5 rounded">2022,001,William Ruto,UDA,President,7176141</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Tab */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Result Entry</h3>
          <form onSubmit={handleManualEntry} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Election *</label>
              <select
                value={selectedElection || ''}
                onChange={(e) => setSelectedElection(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
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
              <label className="block text-sm font-medium text-gray-700 mb-1">County *</label>
              <select
                value={selectedCounty || ''}
                onChange={(e) => setSelectedCounty(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select County</option>
                {counties.map((county) => (
                  <option key={county.id} value={county.id}>
                    {county.name} ({county.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Candidate *</label>
              <select
                value={selectedCandidate || ''}
                onChange={(e) => setSelectedCandidate(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Candidate</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} ({candidate.party}) - {candidate.position}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Votes *</label>
              <input
                type="number"
                value={votes}
                onChange={(e) => setVotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                placeholder="Enter vote count"
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Result
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
