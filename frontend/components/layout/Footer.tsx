import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                <div className="w-1 h-8 bg-[#BB0000]"></div>
                <div className="w-1 h-8 bg-white"></div>
                <div className="w-1 h-8 bg-[#006600]"></div>
              </div>
              <h3 className="text-xl font-bold">Blockcert Afrika</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Kenya's premier data and analytics platform, delivering precision insights across political, economic, and social sectors.
            </p>
          </div>

          {/* Divisions */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-300">
              Our Divisions
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/political" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Political Analysis
                </Link>
              </li>
              <li>
                <span className="text-gray-600 text-sm cursor-not-allowed">
                  Budget Analysis <span className="text-xs">(Coming Soon)</span>
                </span>
              </li>
              <li>
                <span className="text-gray-600 text-sm cursor-not-allowed">
                  Health Analytics <span className="text-xs">(Coming Soon)</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Political Division Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-300">
              Political Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/forecasts" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Election Forecasts
                </Link>
              </li>
              <li>
                <Link href="/explorer" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Geographic Explorer
                </Link>
              </li>
              <li>
                <Link href="/voter-registration" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Voter Data
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Admin Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-gray-300">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  API Documentation
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@blockcertafrika.com"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} Blockcert Afrika. All rights reserved.
            </div>
            
            <div className="flex items-center gap-6">
              <span className="text-xs text-gray-500">
                Compliant with Kenya Data Protection Act 2019
              </span>
              <div className="flex gap-4">
                <a
                  href="https://twitter.com/blockcertafrika"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/company/blockcertafrika"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

