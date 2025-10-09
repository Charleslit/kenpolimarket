'use client';

import { useState, useEffect } from 'react';
import CandidateManager from '@/components/admin/CandidateManager';
import ElectionDataManager from '@/components/admin/ElectionDataManager';
import DataImportManager from '@/components/admin/DataImportManager';
import ScenarioCalculator from '@/components/scenarios/ScenarioCalculator';

// Temporary password protection - will be replaced with proper auth later
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'ken2027';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'data' | 'candidates' | 'scenarios' | 'import'>('data');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check if already authenticated in session
  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setError('');
      setPassword('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setPassword('');
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin Access
              </h1>
              <p className="text-gray-600">
                Enter password to access admin tools
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter admin password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Access Admin Tools
              </button>
            </form>

            {/* Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                🔐 This is a temporary password protection. Full authentication will be implemented later.
              </p>
            </div>

            {/* Back Link */}
            <div className="mt-4 text-center">
              <a
                href="/forecasts"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show admin interface if authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-white flex items-center">
                <span className="mr-3">🇰🇪</span>
                BlockcertAfrica
                <span className="ml-3 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                  Admin Tools
                </span>
              </h1>
              <p className="mt-2 text-blue-100 text-sm">
                Manage candidates and create scenario projections
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <a
                href="/forecasts"
                className="px-4 py-2 bg-white bg-opacity-10 text-white rounded-lg hover:bg-opacity-20 transition-colors font-medium"
              >
                ← Dashboard
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center"
              >
                <span className="mr-2">🔓</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('data')}
              className={`${
                activeTab === 'data'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
            >
              <span className="mr-2">📊</span>
              Election Data
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`${
                activeTab === 'scenarios'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
            >
              <span className="mr-2">🧮</span>
              Scenario Calculator
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`${
                activeTab === 'candidates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
            >
              <span className="mr-2">👥</span>
              Candidate Management
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
            >
              <span className="mr-2">📥</span>
              Data Import
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'data' && <ElectionDataManager />}
        {activeTab === 'scenarios' && <ScenarioCalculator />}
        {activeTab === 'candidates' && <CandidateManager />}
        {activeTab === 'import' && <DataImportManager />}
      </main>
    </div>
  );
}

