import Link from 'next/link';
import Footer from '@/components/layout/Footer';

export default function PoliticalLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white border-b-4 border-[#BB0000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
              Blockcert Afrika
            </Link>
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-sm text-gray-900 font-medium">Political Analysis</span>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-[#BB0000] text-white text-xs px-3 py-1 font-semibold mb-4">
                POLITICAL DIVISION
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                Electoral Forecasting & Political Analysis
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Kenya's most comprehensive political forecasting platform. Advanced Bayesian AI models, 
                official IEBC data, and probabilistic predictions for the 2027 elections.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/forecasts"
                  className="bg-gray-900 text-white px-6 py-3 font-medium hover:bg-gray-800 transition-colors"
                >
                  View Forecasts
                </Link>
                <Link
                  href="/explorer"
                  className="border-2 border-gray-900 text-gray-900 px-6 py-3 font-medium hover:bg-gray-50 transition-colors"
                >
                  Explore Map
                </Link>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <StatBox number="47" label="Counties" sublabel="Full Coverage" />
              <StatBox number="290" label="Constituencies" sublabel="Detailed Analysis" />
              <StatBox number="1,450+" label="Wards" sublabel="Granular Data" />
              <StatBox number="46K+" label="Polling Stations" sublabel="Comprehensive" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Platform Capabilities
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools for understanding Kenya's electoral landscape
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureBox
              title="Probabilistic Forecasts"
              description="Advanced Bayesian models provide uncertainty-aware predictions with confidence intervals, not just point estimates."
              items={[
                "Presidential race predictions",
                "Gubernatorial forecasts",
                "County-level analysis",
                "Real-time updates"
              ]}
            />
            <FeatureBox
              title="Interactive Geographic Explorer"
              description="Drill down from national to polling station level with interactive maps and detailed demographic data."
              items={[
                "County-level maps",
                "Constituency boundaries",
                "Ward demographics",
                "Polling station data"
              ]}
            />
            <FeatureBox
              title="Voter Registration Analytics"
              description="Comprehensive voter registration data analysis with historical trends and demographic breakdowns."
              items={[
                "Registration trends",
                "Age demographics",
                "Gender distribution",
                "Geographic patterns"
              ]}
            />
            <FeatureBox
              title="Historical Data Analysis"
              description="Access and analyze election results from 2013, 2017, and 2022 with comparative tools."
              items={[
                "Multi-year comparisons",
                "Trend analysis",
                "Turnout patterns",
                "Result visualization"
              ]}
            />
            <FeatureBox
              title="Scenario Planning Tools"
              description="Model different electoral scenarios and see how changes in key variables affect outcomes."
              items={[
                "Custom scenarios",
                "Variable adjustment",
                "Impact analysis",
                "Export capabilities"
              ]}
            />
            <FeatureBox
              title="API & Data Access"
              description="RESTful API for researchers, journalists, and developers. Full data export capabilities."
              items={[
                "REST API access",
                "CSV exports",
                "JSON data feeds",
                "Documentation"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Rigorous Methodology
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our forecasting models combine multiple data sources and advanced statistical techniques 
                to deliver the most accurate predictions possible.
              </p>

              <div className="space-y-4">
                <MethodologyItem
                  number="01"
                  title="Official Data Sources"
                  description="IEBC election results, KNBS demographic data, voter registration statistics"
                />
                <MethodologyItem
                  number="02"
                  title="Bayesian AI Models"
                  description="Probabilistic predictions with uncertainty quantification and confidence intervals"
                />
                <MethodologyItem
                  number="03"
                  title="Historical Analysis"
                  description="Pattern recognition from 2013, 2017, and 2022 elections"
                />
                <MethodologyItem
                  number="04"
                  title="Continuous Updates"
                  description="Real-time model updates as new data becomes available"
                />
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Data Compliance</h3>
              <div className="space-y-4 text-sm">
                <ComplianceItem
                  title="Privacy First"
                  description="Full compliance with Kenya Data Protection Act 2019"
                />
                <ComplianceItem
                  title="Transparent Methods"
                  description="Open methodology and documented data sources"
                />
                <ComplianceItem
                  title="No Personal Data"
                  description="Only aggregate, anonymized data—no individual PII"
                />
                <ComplianceItem
                  title="Auditable Results"
                  description="All predictions include methodology and confidence levels"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Start Exploring Electoral Data
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            Access comprehensive forecasts, interactive maps, and detailed voter analytics
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            <Link
              href="/forecasts"
              className="bg-gray-900 text-white p-6 hover:bg-gray-800 transition-colors group"
            >
              <div className="text-2xl font-bold mb-2">Forecasts</div>
              <div className="text-sm text-gray-300">Presidential & gubernatorial predictions</div>
              <div className="mt-4 text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
                View →
              </div>
            </Link>
            <Link
              href="/explorer"
              className="border-2 border-gray-900 text-gray-900 p-6 hover:bg-gray-50 transition-colors group"
            >
              <div className="text-2xl font-bold mb-2">Explorer</div>
              <div className="text-sm text-gray-600">Interactive geographic analysis</div>
              <div className="mt-4 text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
                Explore →
              </div>
            </Link>
            <Link
              href="/voter-registration"
              className="border-2 border-gray-900 text-gray-900 p-6 hover:bg-gray-50 transition-colors group"
            >
              <div className="text-2xl font-bold mb-2">Voter Data</div>
              <div className="text-sm text-gray-600">Registration & demographic trends</div>
              <div className="mt-4 text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
                Analyze →
              </div>
            </Link>
          </div>

          <div className="text-sm text-gray-500">
            Need API access?{' '}
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 font-medium hover:underline"
            >
              View Documentation →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Stat Box Component
function StatBox({ number, label, sublabel }: { number: string; label: string; sublabel: string }) {
  return (
    <div className="bg-white border-2 border-gray-200 p-6">
      <div className="text-3xl font-bold text-gray-900 mb-1">{number}</div>
      <div className="text-sm font-semibold text-gray-900">{label}</div>
      <div className="text-xs text-gray-500 mt-1">{sublabel}</div>
    </div>
  );
}

// Feature Box Component
function FeatureBox({ title, description, items }: { title: string; description: string; items: string[] }) {
  return (
    <div className="border-2 border-gray-200 p-6 hover:border-gray-900 transition-colors">
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{description}</p>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-[#BB0000] mt-1">▪</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Methodology Item Component
function MethodologyItem({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-gray-900 text-white flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

// Compliance Item Component
function ComplianceItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-5 h-5 border-2 border-[#006600] flex items-center justify-center mt-0.5">
        <div className="w-2 h-2 bg-[#006600]"></div>
      </div>
      <div>
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-gray-600">{description}</div>
      </div>
    </div>
  );
}

