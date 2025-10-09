'use client';

import { useState, useRef, useEffect } from 'react';

interface County {
  code: string;
  name: string;
  region?: string;
  population_2019: number;
  registered_voters_2022: number;
}

interface CountySearchProps {
  counties: County[];
  onSelect: (county: County) => void;
  selectedCounty?: County | null;
  placeholder?: string;
}

export default function CountySearch({ 
  counties, 
  onSelect, 
  selectedCounty,
  placeholder = "Search counties by name, code, or region..." 
}: CountySearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fuzzy search function
  const fuzzyMatch = (str: string, pattern: string): boolean => {
    const lowerStr = str.toLowerCase();
    const lowerPattern = pattern.toLowerCase();
    
    // Exact match
    if (lowerStr.includes(lowerPattern)) return true;
    
    // Fuzzy match
    let patternIdx = 0;
    for (let i = 0; i < lowerStr.length && patternIdx < lowerPattern.length; i++) {
      if (lowerStr[i] === lowerPattern[patternIdx]) {
        patternIdx++;
      }
    }
    return patternIdx === lowerPattern.length;
  };

  // Debounce query for smoother UX on mobile
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Filter counties
  const filteredCounties = debouncedQuery.trim() === ''
    ? counties
    : counties.filter(county =>
        fuzzyMatch(county.name, debouncedQuery) ||
        fuzzyMatch(county.code, debouncedQuery) ||
        (county.region && fuzzyMatch(county.region, debouncedQuery))
      );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredCounties.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCounties[highlightedIndex]) {
            handleSelect(filteredCounties[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setQuery('');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredCounties]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (county: County) => {
    onSelect(county);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(0);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const formatNumber = (num?: number) => {
    if (!num) return '';
    return num.toLocaleString();
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400 text-lg">🔍</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search counties"
          aria-autocomplete="list"
          aria-controls="county-dropdown"
          aria-expanded={isOpen}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <span className="text-xl">✕</span>
          </button>
        )}
      </div>

      {/* Selected County Display */}
      {selectedCounty && !isOpen && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div>
            <span className="font-semibold text-blue-900">{selectedCounty.name}</span>
            {selectedCounty.region && (
              <span className="text-sm text-blue-700 ml-2">({selectedCounty.region})</span>
            )}
          </div>
          <button
            onClick={() => onSelect(null as any)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Change
          </button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id="county-dropdown"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
        >
          {filteredCounties.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="text-3xl mb-2">🔍</div>
              <p>No counties found matching "{query}"</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            filteredCounties.map((county, index) => (
              <button
                key={county.code}
                onClick={() => handleSelect(county)}
                className={`w-full text-left px-4 py-2.5 sm:py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  index === highlightedIndex ? 'bg-blue-100' : ''
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {county.name}
                      <span className="ml-2 text-xs text-gray-500 font-normal">
                        ({county.code})
                      </span>
                    </div>
                    {county.region && (
                      <div className="text-sm text-gray-600 mt-1">
                        📍 {county.region}
                      </div>
                    )}
                    {county.population_2019 && (
                      <div className="text-xs text-gray-500 mt-1">
                        👥 {formatNumber(county.population_2019)} people
                        {county.registered_voters_2022 && (
                          <span className="ml-3">
                            🗳️ {formatNumber(county.registered_voters_2022)} voters
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {index === highlightedIndex && (
                    <span className="text-blue-600 ml-2">→</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Keyboard Hints */}
      {isOpen && filteredCounties.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-center space-x-4">
          <span>↑↓ Navigate</span>
          <span>Enter Select</span>
          <span>Esc Close</span>
        </div>
      )}
    </div>
  );
}

