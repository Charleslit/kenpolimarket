'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface Candidate {
  id: number;
  name: string;
  party: string;
  position: string;
}

interface CandidateStats {
  candidate_id: number;
  candidate_name: string;
  party: string;
  total_votes: number;
  vote_share: number;
  counties_leading: number;
  counties_total: number;
}

export default function CandidateManager() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<Record<number, CandidateStats>>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    party: '',
    position: 'President'
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/`);
      const data = await response.json();
      setCandidates(data);
      
      // Fetch stats for each candidate
      const statsPromises = data.map((c: Candidate) =>
        fetch(`${API_BASE_URL}/candidates/${c.id}/stats`).then(r => r.json())
      );
      const statsData = await Promise.all(statsPromises);
      const statsMap: Record<number, CandidateStats> = {};
      statsData.forEach(s => {
        statsMap[s.candidate_id] = s;
      });
      setStats(statsMap);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update existing candidate
        await fetch(`${API_BASE_URL}/candidates/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        // Create new candidate
        await fetch(`${API_BASE_URL}/candidates/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      
      // Reset form and refresh
      setFormData({ name: '', party: '', position: 'President' });
      setShowAddForm(false);
      setEditingId(null);
      fetchCandidates();
    } catch (error) {
      console.error('Failed to save candidate:', error);
      alert('Failed to save candidate. Please try again.');
    }
  };

  const handleEdit = (candidate: Candidate) => {
    setFormData({
      name: candidate.name,
      party: candidate.party,
      position: candidate.position
    });
    setEditingId(candidate.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also delete all associated forecasts!`)) {
      return;
    }
    
    try {
      await fetch(`${API_BASE_URL}/candidates/${id}`, {
        method: 'DELETE'
      });
      fetchCandidates();
    } catch (error) {
      console.error('Failed to delete candidate:', error);
      alert('Failed to delete candidate. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', party: '', position: 'President' });
    setShowAddForm(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidate Management</h2>
          <p className="text-sm text-gray-500 mt-1">Add, edit, or remove candidates from the system</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>{showAddForm ? '✕ Cancel' : '+ Add Candidate'}</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Candidate' : 'Add New Candidate'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Raila Odinga"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Political Party *
              </label>
              <input
                type="text"
                required
                value={formData.party}
                onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Azimio la Umoja"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="President">President</option>
                <option value="Governor">Governor</option>
                <option value="Senator">Senator</option>
                <option value="MP">MP</option>
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update Candidate' : 'Add Candidate'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Candidates List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Votes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vote Share
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Counties Leading
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {candidates.map((candidate) => {
                const candidateStats = stats[candidate.id];
                return (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{candidate.party}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{candidate.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {candidateStats ? (candidateStats.total_votes / 1000000).toFixed(2) + 'M' : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {candidateStats ? candidateStats.vote_share.toFixed(1) + '%' : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {candidateStats ? `${candidateStats.counties_leading} / ${candidateStats.counties_total}` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(candidate)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(candidate.id, candidate.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {candidates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No candidates found. Click "Add Candidate" to create one.
        </div>
      )}
    </div>
  );
}

