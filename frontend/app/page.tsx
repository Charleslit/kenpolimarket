import Link from 'next/link';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Clean, Data-Driven Design */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {/* Subtle geometric background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            {/* Kenya flag accent */}
            <div className="flex justify-center mb-6">
              <div className="flex gap-1">
                <div className="w-1 h-12 bg-[#BB0000]"></div>
                <div className="w-1 h-12 bg-[#000000]"></div>
                <div className="w-1 h-12 bg-[#006600]"></div>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
              Blockcert Afrika
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Kenya's Premier Data & Analytics Platform
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              Transforming complex data into actionable insights across political, economic, and social sectors
            </p>

            {/* Data visualization accent */}
            <div className="flex justify-center mb-12">
              <svg width="200" height="40" viewBox="0 0 200 40" className="opacity-30">
                <polyline
                  points="0,35 40,25 80,30 120,15 160,20 200,10"
                  fill="none"
                  stroke="#1a1a1a"
                  strokeWidth="2"
                />
                <circle cx="40" cy="25" r="3" fill="#BB0000" />
                <circle cx="80" cy="30" r="3" fill="#000000" />
                <circle cx="120" cy="15" r="3" fill="#006600" />
                <circle cx="160" cy="20" r="3" fill="#1a1a1a" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Specialized Data Analytics Across Sectors
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We deliver precision analytics and forecasting through our specialized divisions
            </p>
          </div>

          {/* Divisions Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Political Analysis Division */}
            <DivisionCard
              title="Political Analysis"
              description="Advanced forecasting and analysis for Kenya's electoral landscape. Probabilistic predictions powered by Bayesian AI and official IEBC data."
              href="/political"
              stats={[
                { value: "47", label: "Counties Covered" },
                { value: "2027", label: "Next Election" },
              ]}
              accentColor="border-[#BB0000]"
            />

            {/* Budget Analysis Division */}
            <DivisionCard
              title="Budget Analysis"
              description="Comprehensive fiscal data analysis and forecasting. Track government spending, revenue projections, and economic indicators."
              href="#"
              stats={[
                { value: "KES", label: "National Budget" },
                { value: "47", label: "County Budgets" },
              ]}
              accentColor="border-[#006600]"
              comingSoon
            />

            {/* Health Analysis Division */}
            <DivisionCard
              title="Health Analytics"
              description="Data-driven insights into Kenya's healthcare system. Track health indicators, facility performance, and public health trends."
              href="#"
              stats={[
                { value: "47", label: "Counties" },
                { value: "Real-time", label: "Data Updates" },
              ]}
              accentColor="border-[#000000]"
              comingSoon
            />
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Data-Driven Excellence
              </h2>
              <div className="space-y-6">
                <ApproachItem
                  title="Rigorous Methodology"
                  description="We employ advanced statistical models and machine learning techniques, ensuring every insight is backed by solid data science."
                />
                <ApproachItem
                  title="Transparency First"
                  description="Open data sources, documented methodologies, and full auditability. We believe in showing our work."
                />
                <ApproachItem
                  title="Privacy Compliant"
                  description="Full compliance with Kenya Data Protection Act 2019. We handle data with the utmost care and responsibility."
                />
                <ApproachItem
                  title="Actionable Insights"
                  description="We don't just present data—we transform it into clear, actionable intelligence for decision-makers."
                />
              </div>
            </div>

            {/* Visual element - data grid */}
            <div className="hidden md:block">
              <div className="grid grid-cols-4 gap-2 opacity-20">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square border border-gray-300"
                    style={{
                      backgroundColor: i % 7 === 0 ? '#BB0000' : i % 5 === 0 ? '#006600' : 'transparent',
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Explore Our Analytics?
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            Start with our political analysis platform—the most comprehensive electoral forecasting system in Kenya
          </p>
          <Link
            href="/political"
            className="inline-block bg-gray-900 text-white px-8 py-4 text-lg font-medium hover:bg-gray-800 transition-colors border-2 border-gray-900"
          >
            Explore Political Analysis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Division Card Component
function DivisionCard({
  title,
  description,
  href,
  stats,
  accentColor,
  comingSoon = false,
}: {
  title: string;
  description: string;
  href: string;
  stats: { value: string; label: string }[];
  accentColor: string;
  comingSoon?: boolean;
}) {
  const content = (
    <div className={`relative bg-white border-2 ${accentColor} p-8 h-full transition-all hover:shadow-lg ${comingSoon ? 'opacity-75' : ''}`}>
      {comingSoon && (
        <div className="absolute top-4 right-4 bg-gray-900 text-white text-xs px-3 py-1 font-medium">
          COMING SOON
        </div>
      )}

      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>

      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
        {stats.map((stat, idx) => (
          <div key={idx}>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {!comingSoon && (
        <div className="mt-6 text-gray-900 font-medium flex items-center">
          Explore Division
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );

  if (comingSoon) {
    return <div className="cursor-not-allowed">{content}</div>;
  }

  return (
    <Link href={href} className="block group">
      {content}
    </Link>
  );
}

// Approach Item Component
function ApproachItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-2 h-2 bg-gray-900 mt-2"></div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
