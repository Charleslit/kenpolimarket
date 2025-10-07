import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs items={[{ label: 'About' }]} />

        <div className="bg-white border-2 border-gray-200 p-8 mb-8">
          {/* Company Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex gap-0.5">
              <div className="w-1 h-12 bg-[#BB0000]"></div>
              <div className="w-1 h-12 bg-gray-900"></div>
              <div className="w-1 h-12 bg-[#006600]"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Blockcert Afrika
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kenya's Premier Data & Analytics Platform
              </p>
            </div>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Who We Are</h2>
            <p className="text-gray-700 mb-4">
              Blockcert Afrika is Kenya's leading data analytics and visualization platform,
              specializing in transforming complex data into actionable insights across multiple sectors.
              We combine cutting-edge technology, rigorous methodology, and deep local expertise to deliver
              precision analytics that drive informed decision-making.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              To democratize access to high-quality data analytics in Kenya by providing transparent,
              accurate, and actionable insights across political, economic, and social sectors. We believe
              that data-driven decision-making is essential for national progress and development.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Divisions</h2>
            <p className="text-gray-700 mb-6">
              We operate specialized divisions, each focused on delivering excellence in their respective domains:
            </p>

            <div className="space-y-6 mb-8">
              <div className="border-l-4 border-[#BB0000] pl-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Political Analysis Division</h3>
                <p className="text-gray-700 mb-2">
                  Advanced electoral forecasting and political analysis for Kenya's democratic processes.
                  Our political division combines Bayesian AI models with official IEBC data to deliver
                  probabilistic predictions for the 2027 elections and beyond.
                </p>
                <Link href="/political" className="text-gray-900 font-medium hover:underline">
                  Explore Political Division →
                </Link>
              </div>

              <div className="border-l-4 border-[#006600] pl-4 opacity-60">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Budget Analysis Division</h3>
                <p className="text-gray-700 mb-2">
                  Comprehensive fiscal data analysis and forecasting. Track government spending,
                  revenue projections, and economic indicators at national and county levels.
                </p>
                <span className="text-sm text-gray-500 font-medium">Coming Soon</span>
              </div>

              <div className="border-l-4 border-gray-900 pl-4 opacity-60">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Health Analytics Division</h3>
                <p className="text-gray-700 mb-2">
                  Data-driven insights into Kenya's healthcare system. Track health indicators,
                  facility performance, and public health trends across all counties.
                </p>
                <span className="text-sm text-gray-500 font-medium">Coming Soon</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Approach</h2>
            <ul className="list-none text-gray-700 mb-4 space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-gray-900 mt-2"></span>
                <div>
                  <strong>Rigorous Methodology:</strong> Advanced statistical models and machine learning
                  techniques ensure every insight is backed by solid data science
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-gray-900 mt-2"></span>
                <div>
                  <strong>Official Data Sources:</strong> We work exclusively with verified data from
                  government agencies (IEBC, KNBS) and reputable institutions
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-gray-900 mt-2"></span>
                <div>
                  <strong>Transparency First:</strong> Open methodologies, documented processes,
                  and full auditability in all our analytics
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-gray-900 mt-2"></span>
                <div>
                  <strong>Actionable Insights:</strong> We transform raw data into clear,
                  actionable intelligence for decision-makers
                </div>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Privacy & Compliance</h2>
            <p className="text-gray-700 mb-4">
              We are committed to protecting user privacy and complying with the Kenya Data Protection Act 2019.
              All data is anonymized and aggregated. We do not collect personal information without consent.
              Our systems are designed with privacy-by-default principles.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Technology & Innovation</h2>
            <p className="text-gray-700 mb-4">
              We leverage cutting-edge technology to deliver superior analytics:
            </p>
            <ul className="list-none text-gray-700 mb-4 space-y-2">
              <li className="flex gap-2">
                <span>•</span>
                <span>Bayesian AI and machine learning models for probabilistic forecasting</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Interactive data visualization and geographic mapping</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>RESTful APIs for seamless data integration</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Real-time data processing and updates</span>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For questions, feedback, partnership inquiries, or data access requests:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li>📧 Email: <a href="mailto:info@blockcertafrika.com" className="text-gray-900 font-medium hover:underline">info@blockcertafrika.com</a></li>
              <li>🐦 Twitter: <a href="https://twitter.com/blockcertafrika" className="text-gray-900 font-medium hover:underline">@blockcertafrika</a></li>
              <li>💼 LinkedIn: <a href="https://linkedin.com/company/blockcertafrika" className="text-gray-900 font-medium hover:underline">Blockcert Afrika</a></li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 border-2 border-gray-200 p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Explore Our Divisions
          </h3>
          <p className="text-gray-600 mb-6">
            Start with our political analysis platform—the most comprehensive electoral forecasting system in Kenya
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/political"
              className="bg-gray-900 text-white px-6 py-3 font-medium hover:bg-gray-800 transition-colors"
            >
              Political Analysis →
            </Link>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-gray-900 text-gray-900 px-6 py-3 font-medium hover:bg-gray-50 transition-colors"
            >
              API Documentation
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

