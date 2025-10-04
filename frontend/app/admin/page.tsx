'use client';

import { useState } from 'react';
import CandidateManager from '@/components/admin/CandidateManager';
import ScenarioCalculator from '@/components/scenarios/ScenarioCalculator';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'candidates' | 'scenarios'>('scenarios');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-white flex items-center">
                <span className="mr-3">🇰🇪</span>
                KenPoliMarket
                <span className="ml-3 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                  Admin Tools
                </span>
              </h1>
              <p className="mt-2 text-blue-100 text-sm">
                Manage candidates and create scenario projections
              </p>
            </div>
            <a
              href="/forecasts"
              className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
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
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'scenarios' && <ScenarioCalculator />}
        {activeTab === 'candidates' && <CandidateManager />}
      </main>
    </div>
  );
}

