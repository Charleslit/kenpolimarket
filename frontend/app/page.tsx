export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            KenPoliMarket
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Kenya's Premier Political Forecasting & Analysis Platform
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/forecasts"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              📊 View Forecasts
            </a>
            <a
              href="/explorer"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              🗺️ Geographic Explorer
            </a>
            <a
              href="/voter-registration"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              🗳️ Voter Data
            </a>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition"
            >
              API Docs ↗
            </a>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Probabilistic Forecasts"
            description="Advanced Bayesian models provide uncertainty-aware predictions, not just point estimates."
            icon="📊"
          />
          <FeatureCard
            title="Privacy-First"
            description="Kenya Data Protection Act 2019 compliant. Only aggregate data, no individual-level PII."
            icon="🔒"
          />
          <FeatureCard
            title="Transparent Methodology"
            description="Open data sources (IEBC, KNBS), documented models, and full auditability."
            icon="🔍"
          />
          <FeatureCard
            title="Interactive Maps"
            description="Drill down from counties to constituencies, wards, and 43K+ polling stations with interactive maps."
            icon="🗺️"
          />
          <FeatureCard
            title="Play-Money Markets"
            description="Legal-compliant prediction mechanisms with reputation systems, no real gambling."
            icon="🎯"
          />
          <FeatureCard
            title="API Access"
            description="RESTful API for researchers, journalists, and developers. CSV exports available."
            icon="⚡"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard number="47" label="Counties" />
            <StatCard number="248" label="Constituencies" />
            <StatCard number="737" label="Wards" />
            <StatCard number="43K+" label="Polling Stations" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
        <p className="text-gray-600 mb-8">
          Access real-time forecasts, historical data, and interactive visualizations
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="/forecasts"
            className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-green-700 transition inline-block"
          >
            📊 View Forecasts
          </a>
          <a
            href="/explorer"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-blue-700 transition inline-block"
          >
            🗺️ Explore Map
          </a>
          <a
            href="/voter-registration"
            className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-purple-700 transition inline-block"
          >
            🗳️ Voter Data
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4">
            Built with ❤️ for transparent, data-driven political analysis in Kenya
          </p>
          <div className="flex gap-6 justify-center text-sm text-gray-400">
            <a href="/about" className="hover:text-white">About</a>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              API Documentation
            </a>
            <a href="mailto:info@kenpolimarket.com" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-blue-600 mb-2">{number}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}
