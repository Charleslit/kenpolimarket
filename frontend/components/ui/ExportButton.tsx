'use client';

import React, { useState } from 'react';
import {
  exportChartAsPNG,
  exportChartAsPDF,
  exportDataAsCSV,
  exportDataAsJSON,
  copyChartToClipboard,
} from '@/utils/chartExport';

interface ExportButtonProps {
  elementId: string;
  filename?: string;
  data?: any[];
  showDataExport?: boolean;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  elementId,
  filename = 'chart',
  data,
  showDataExport = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleExport = async (type: 'png' | 'pdf' | 'csv' | 'json' | 'copy') => {
    setIsExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      switch (type) {
        case 'png':
          await exportChartAsPNG(elementId, filename);
          setExportStatus({ type: 'success', message: 'Chart exported as PNG!' });
          break;
        case 'pdf':
          await exportChartAsPDF(elementId, filename);
          setExportStatus({ type: 'success', message: 'Chart exported as PDF!' });
          break;
        case 'csv':
          if (data) {
            exportDataAsCSV(data, filename);
            setExportStatus({ type: 'success', message: 'Data exported as CSV!' });
          }
          break;
        case 'json':
          if (data) {
            exportDataAsJSON(data, filename);
            setExportStatus({ type: 'success', message: 'Data exported as JSON!' });
          }
          break;
        case 'copy':
          await copyChartToClipboard(elementId);
          setExportStatus({ type: 'success', message: 'Chart copied to clipboard!' });
          break;
      }
      setTimeout(() => {
        setIsOpen(false);
        setExportStatus({ type: null, message: '' });
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ type: 'error', message: 'Export failed. Please try again.' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
        disabled={isExporting}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span className="font-medium">Export</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fadeIn">
          <div className="py-2">
            {/* Chart Export Options */}
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Export Chart
            </div>
            
            <button
              onClick={() => handleExport('png')}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Download as PNG</span>
            </button>

            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Download as PDF</span>
            </button>

            <button
              onClick={() => handleExport('copy')}
              disabled={isExporting}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy to Clipboard</span>
            </button>

            {/* Data Export Options */}
            {showDataExport && data && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Export Data
                </div>

                <button
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download as CSV</span>
                </button>

                <button
                  onClick={() => handleExport('json')}
                  disabled={isExporting}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span>Download as JSON</span>
                </button>
              </>
            )}
          </div>

          {/* Status Message */}
          {exportStatus.type && (
            <div
              className={`px-4 py-3 border-t ${
                exportStatus.type === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {exportStatus.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span className="text-sm font-medium">{exportStatus.message}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default ExportButton;

