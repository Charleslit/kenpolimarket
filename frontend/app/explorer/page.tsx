import CountyExplorerEnhanced from '@/components/explorer/CountyExplorerEnhanced';

export default function ExplorerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-white flex items-center">
                <span className="mr-3">🗺️</span>
                Geographic Explorer
              </h1>
              <p className="mt-2 text-blue-100 text-sm">
                Explore Kenya's administrative divisions from counties to wards
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <a
                href="/forecasts"
                className="px-4 py-2 bg-white bg-opacity-10 text-white rounded-lg hover:bg-opacity-20 transition-colors font-medium"
              >
                ← Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CountyExplorerEnhanced />
      </main>
    </div>
  );
}

