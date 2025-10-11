'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import RunSelector from "@/components/shared/RunSelector";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredDivision, setHoveredDivision] = useState<string | null>(null);
  const pathname = usePathname();

  // Determine which division we're in
  const isPoliticalSection = pathname.startsWith('/forecasts') ||
                             pathname.startsWith('/explorer') ||
                             pathname.startsWith('/voter-registration') ||
                             pathname.startsWith('/admin') ||
                             pathname.startsWith('/political');

  // Three main divisions with dropdown items
  const divisions = [
    {
      name: 'Political',
      href: '/political',
      active: isPoliticalSection,
      color: 'border-[#BB0000] hover:bg-[#BB0000] hover:text-white',
      activeColor: 'bg-[#BB0000] text-white',
      dropdownColor: 'bg-[#BB0000]',
      dropdownItems: [
        { name: 'Overview', href: '/political', description: 'Division landing page' },
        { name: 'Forecasts', href: '/forecasts', description: 'Election predictions & probabilities' },
        { name: 'Explorer', href: '/explorer', description: 'Interactive geographic maps' },
        { name: 'Voter Data', href: '/voter-registration', description: 'Registration analytics' },
        { name: 'Admin Tools', href: '/admin', description: 'Administrative utilities' },
      ]
    },
    {
      name: 'Budget',
      href: '#',
      active: false,
      comingSoon: true,
      color: 'border-[#006600] hover:bg-[#006600] hover:text-white',
      activeColor: 'bg-[#006600] text-white',
      dropdownColor: 'bg-[#006600]',
      dropdownItems: [
        { name: 'National Budget', href: '#', description: 'Coming soon' },
        { name: 'County Budgets', href: '#', description: 'Coming soon' },
        { name: 'Revenue Analysis', href: '#', description: 'Coming soon' },
      ]
    },
    {
      name: 'Health',
      href: '#',
      active: false,
      comingSoon: true,
      color: 'border-gray-900 hover:bg-gray-900 hover:text-white',
      activeColor: 'bg-gray-900 text-white',
      dropdownColor: 'bg-gray-900',
      dropdownItems: [
        { name: 'Health Facilities', href: '#', description: 'Coming soon' },
        { name: 'Public Health', href: '#', description: 'Coming soon' },
        { name: 'County Health', href: '#', description: 'Coming soon' },
      ]
    },
  ];

  // Political subdivision items (only show when in political section)
  const politicalSubItems = [
    { name: 'Forecasts', href: '/forecasts' },
    { name: 'Explorer', href: '/explorer' },
    { name: 'Voter Data', href: '/voter-registration' },
    { name: 'Admin', href: '/admin' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-6 bg-[#BB0000] group-hover:h-8 transition-all"></div>
                <div className="w-0.5 h-6 bg-gray-900 group-hover:h-8 transition-all"></div>
                <div className="w-0.5 h-6 bg-[#006600] group-hover:h-8 transition-all"></div>
              </div>
              <span className="text-xl font-bold text-gray-900">Blockcert Afrika</span>
            </Link>
          </div>

          {/* Desktop Navigation - Google-inspired with Dropdowns */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Three Main Divisions with Hover Dropdowns */}
            {divisions.map((division) => (
              <div
                key={division.name}
                className="relative"
                onMouseEnter={() => setHoveredDivision(division.name)}
                onMouseLeave={() => setHoveredDivision(null)}
              >
                {division.comingSoon ? (
                  <div
                    className={`px-4 py-2 text-sm font-medium border-2 ${division.color} text-gray-400 cursor-not-allowed transition-all relative`}
                  >
                    {division.name}
                    <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] px-1 py-0.5 font-bold">
                      SOON
                    </span>
                  </div>
                ) : (
                  <Link
                    href={division.href}
                    className={`px-4 py-2 text-sm font-medium border-2 transition-all ${
                      division.active
                        ? division.activeColor
                        : `${division.color} text-gray-900`
                    }`}
                  >
                    {division.name}
                  </Link>
                )}

                {/* Dropdown Menu on Hover */}
                {hoveredDivision === division.name && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border-2 border-gray-200 shadow-xl z-50 animate-fadeIn">
                    {/* Dropdown Header */}
                    <div className={`${division.dropdownColor} text-white px-4 py-3`}>
                      <div className="font-bold text-sm">{division.name} Division</div>
                      <div className="text-xs opacity-90 mt-0.5">
                        {division.comingSoon ? 'Coming Soon' : 'Explore our tools'}
                      </div>
                    </div>

                    {/* Dropdown Items */}
                    <div className="py-2">
                      {division.dropdownItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                            division.comingSoon ? 'cursor-not-allowed opacity-60' : ''
                          }`}
                          onClick={(e) => division.comingSoon && e.preventDefault()}
                        >
                          <div className="font-medium text-sm text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Global Forecast Run Selector */}
            <div className="hidden md:flex items-center">
              <RunSelector />
            </div>

            {/* About & API */}
            <Link
              href="/about"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/about')
                  ? 'text-gray-900 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              About
            </Link>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              API ↗
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 text-gray-700 hover:bg-gray-100"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Political Subdivision Bar - Google-style secondary nav */}
      {isPoliticalSection && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-1 overflow-x-auto py-2 hide-scrollbar">
              <Link
                href="/political"
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  pathname === '/political'
                    ? 'text-[#BB0000] border-b-2 border-[#BB0000]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </Link>
              {politicalSubItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive(item.href)
                      ? 'text-[#BB0000] border-b-2 border-[#BB0000]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Three Main Divisions */}
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Divisions
            </div>
            {divisions.map((division) => (
              division.comingSoon ? (
                <div
                  key={division.name}
                  className="px-3 py-2 text-base text-gray-400 flex items-center justify-between"
                >
                  {division.name}
                  <span className="bg-gray-900 text-white text-[10px] px-2 py-0.5 font-bold">
                    SOON
                  </span>
                </div>
              ) : (
                <Link
                  key={division.name}
                  href={division.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium ${
                    division.active
                      ? 'bg-[#BB0000] text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {division.name}
                </Link>
              )
            ))}

            {/* Political Subdivision (if in political section) */}
            {isPoliticalSection && (
              <div className="border-t border-gray-200 mt-2 pt-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Political Tools
                </div>
                <Link
                  href="/political"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium ${
                    pathname === '/political'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Overview
                </Link>
                {politicalSubItems.map((item) => (
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
                    {item.name}
                  </Link>
                ))}
              </div>
            )}

            {/* About & API */}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium ${
                  isActive('/about')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                About
              </Link>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
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

