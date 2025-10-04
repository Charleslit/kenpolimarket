import Breadcrumbs from '@/components/layout/Breadcrumbs';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs items={[{ label: 'About' }]} />

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About KenPoliMarket
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Kenya's premier political forecasting platform for the 2027 elections
          </p>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              KenPoliMarket provides data-driven, probabilistic forecasts for Kenya's elections. 
              We combine official IEBC data, demographic information, historical voting patterns, 
              and advanced Bayesian AI models to deliver accurate, transparent predictions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Methodology</h2>
            <p className="text-gray-700 mb-4">
              Our forecasting model uses:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Bayesian Statistical Models:</strong> Probabilistic predictions with uncertainty quantification</li>
              <li><strong>Historical Data:</strong> Analysis of 2013, 2017, and 2022 election results</li>
              <li><strong>Demographic Data:</strong> Population, ethnicity, and voter registration statistics</li>
              <li><strong>Regional Patterns:</strong> County and constituency-level voting behavior</li>
              <li><strong>Survey Integration:</strong> Incorporation of polling data when available</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Coverage</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">47</div>
                <div className="text-sm text-gray-600">Counties</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">290</div>
                <div className="text-sm text-gray-600">Constituencies</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600">1,450+</div>
                <div className="text-sm text-gray-600">Wards</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Privacy & Compliance</h2>
            <p className="text-gray-700 mb-4">
              We are committed to protecting user privacy and complying with the Kenya Data Protection Act 2019. 
              All data is anonymized and aggregated. We do not collect personal information without consent.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Transparency</h2>
            <p className="text-gray-700 mb-4">
              Our methodology is open and transparent. We publish:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Detailed model specifications</li>
              <li>Data sources and collection methods</li>
              <li>Uncertainty estimates for all predictions</li>
              <li>Historical accuracy metrics</li>
              <li>API access for researchers and developers</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Disclaimer</h2>
            <p className="text-gray-700 mb-4">
              KenPoliMarket forecasts are probabilistic predictions based on available data and statistical models. 
              They are not guarantees of election outcomes. Elections are complex events influenced by many factors, 
              including late-breaking news, campaign dynamics, and voter turnout. Our forecasts are updated regularly 
              as new data becomes available.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact</h2>
            <p className="text-gray-700 mb-4">
              For questions, feedback, or partnership inquiries:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li>📧 Email: <a href="mailto:info@kenpolimarket.com" className="text-blue-600 hover:underline">info@kenpolimarket.com</a></li>
              <li>🐦 Twitter: <a href="https://twitter.com/kenpolimarket" className="text-blue-600 hover:underline">@kenpolimarket</a></li>
              <li>💼 LinkedIn: <a href="https://linkedin.com/company/kenpolimarket" className="text-blue-600 hover:underline">KenPoliMarket</a></li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Interested in our API?
          </h3>
          <p className="text-blue-700 mb-4">
            Access our forecasting data programmatically for research or integration into your applications.
          </p>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View API Documentation →
          </a>
        </div>
      </div>
    </div>
  );
}

