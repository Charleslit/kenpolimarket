'use client';

import { Calendar } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: number | 'all';
  onYearChange: (year: number | 'all') => void;
  availableYears?: number[];
  showAllOption?: boolean;
}

const DEFAULT_YEARS = [2013, 2017, 2022, 2027];

export default function YearSelector({
  selectedYear,
  onYearChange,
  availableYears = DEFAULT_YEARS,
  showAllOption = true
}: YearSelectorProps) {
  
  const getYearLabel = (year: number) => {
    if (year === 2027) {
      return '2027 (Forecast)';
    }
    return year.toString();
  };

  const getYearBadge = (year: number) => {
    if (year === 2027) {
      return (
        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
          Forecast
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Election Year</h3>
        </div>
        <p className="text-sm text-gray-500">
          Select a year to view data
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Year Buttons */}
        {availableYears.map((year) => (
          <button
            key={year}
            onClick={() => onYearChange(year)}
            className={`
              px-6 py-3 rounded-lg font-medium text-sm transition-all flex items-center
              ${
                selectedYear === year
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }
            `}
          >
            {getYearLabel(year)}
            {selectedYear === year && getYearBadge(year)}
          </button>
        ))}

        {/* All Years Option */}
        {showAllOption && (
          <button
            onClick={() => onYearChange('all')}
            className={`
              px-6 py-3 rounded-lg font-medium text-sm transition-all flex items-center
              ${
                selectedYear === 'all'
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }
            `}
          >
            All Years
            {selectedYear === 'all' && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                Compare
              </span>
            )}
          </button>
        )}
      </div>

      {/* Year Info */}
      {selectedYear !== 'all' && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-900">
            {selectedYear === 2013 && (
              <>
                <strong>2013 General Election:</strong> First election under the 2010 Constitution. 
                Uhuru Kenyatta elected president.
              </>
            )}
            {selectedYear === 2017 && (
              <>
                <strong>2017 General Election:</strong> Historic election with Supreme Court nullification 
                and repeat presidential election.
              </>
            )}
            {selectedYear === 2022 && (
              <>
                <strong>2022 General Election:</strong> Most recent election. William Ruto elected president. 
                Current voter registration data available.
              </>
            )}
            {selectedYear === 2027 && (
              <>
                <strong>2027 General Election (Forecast):</strong> Upcoming election. 
                Showing projected voter registration and forecast data.
              </>
            )}
          </p>
        </div>
      )}

      {selectedYear === 'all' && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
          <p className="text-sm text-gray-900">
            <strong>Comparison Mode:</strong> View trends and changes across all election years 
            (2013, 2017, 2022, and 2027 forecast).
          </p>
        </div>
      )}
    </div>
  );
}

