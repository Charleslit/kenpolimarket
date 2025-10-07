'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [divisionsOpen, setDivisionsOpen] = useState(false);
  const pathname = usePathname();

  // Determine if we're in political section
  const isPoliticalSection = pathname.startsWith('/forecasts') ||
                             pathname.startsWith('/explorer') ||
                             pathname.startsWith('/voter-registration') ||
                             pathname.startsWith('/admin') ||
                             pathname.startsWith('/political');

  const mainNavItems = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'About', href: '/about', icon: 'ℹ️' },
  ];

  const politicalNavItems = [
    { name: 'Political Hub', href: '/political', icon: '📊' },
    { name: 'Forecasts', href: '/forecasts', icon: '📈' },
    { name: 'Explorer', href: '/explorer', icon: '🗺️' },
    { name: 'Voter Data', href: '/voter-registration', icon: '🗳️' },
    { name: 'Admin Tools', href: '/admin', icon: '🧮' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-6 bg-[#BB0000]"></div>
                <div className="w-0.5 h-6 bg-gray-900"></div>
                <div className="w-0.5 h-6 bg-[#006600]"></div>
              </div>
              <span className="text-xl font-bold text-gray-900">Blockcert Afrika</span>
              {isPoliticalSection && (
                <span className="hidden sm:inline-block px-2 py-1 bg-[#BB0000] text-white text-xs font-semibold">
                  POLITICAL
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Main nav items */}
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center space-x-2 ${
                  isActive(item.href)
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}

            {/* Divisions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDivisionsOpen(!divisionsOpen)}
                onBlur={() => setTimeout(() => setDivisionsOpen(false), 200)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Divisions</span>
                <span className="text-xs">▾</span>
              </button>

              {divisionsOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 shadow-lg">
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Active Divisions
                    </div>
                    {politicalNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-4 py-2 text-sm hover:bg-gray-50 ${
                          isActive(item.href) ? 'bg-gray-100 font-medium' : ''
                        }`}
                      >
                        <span className="mr-2">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Coming Soon
                      </div>
                      <div className="px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                        💰 Budget Analysis
                      </div>
                      <div className="px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                        🏥 Health Analytics
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* API Docs Link */}
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
            >
              <span>⚡</span>
              <span>API</span>
              <span className="text-xs">↗</span>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Main nav */}
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium ${
                  isActive(item.href)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}

            {/* Political Division */}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Political Division
              </div>
              {politicalNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Coming Soon */}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Coming Soon
              </div>
              <div className="px-3 py-2 text-base text-gray-400">
                💰 Budget Analysis
              </div>
              <div className="px-3 py-2 text-base text-gray-400">
                🏥 Health Analytics
              </div>
            </div>

            {/* API */}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                <span className="mr-2">⚡</span>
                API Docs
                <span className="ml-1 text-xs">↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

