'use client';

import { useState } from 'react';

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'excel';
  includeCharts: boolean;
  includeMetadata: boolean;
  dateRange?: { start: string; end: string };
  counties?: string[];
  candidates?: string[];
}

interface ComprehensiveExportProps {
  data: any[];
  filename?: string;
  availableCounties?: string[];
  availableCandidates?: string[];
}

export default function ComprehensiveExport({
  data,
  filename = 'kenpolimarket-export',
  availableCounties = [],
  availableCandidates = [],
}: ComprehensiveExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    includeCharts: false,
    includeMetadata: true,
  });
  const [exporting, setExporting] = useState(false);

  const exportToCSV = (filteredData: any[]) => {
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(filteredData[0]);
    const csvContent = [
      // Add metadata if requested
      ...(options.includeMetadata ? [
        `# KenPoliMarket Export`,
        `# Generated: ${new Date().toISOString()}`,
        `# Records: ${filteredData.length}`,
        ``,
      ] : []),
      // Headers
      headers.join(','),
      // Data rows
      ...filteredData.map(row =>
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      ),
    ].join('\n');

    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  };

  const exportToJSON = (filteredData: any[]) => {
    const exportData = {
      ...(options.includeMetadata && {
        metadata: {
          generated: new Date().toISOString(),
          source: 'KenPoliMarket',
          records: filteredData.length,
          filters: {
            counties: options.counties,
            candidates: options.candidates,
            dateRange: options.dateRange,
          },
        },
      }),
      data: filteredData,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    downloadFile(jsonString, `${filename}.json`, 'application/json');
  };

  const exportToExcel = async (filteredData: any[]) => {
    // Simple Excel-compatible CSV with UTF-8 BOM
    const BOM = '\uFEFF';
    const headers = Object.keys(filteredData[0] || {});
    
    const csvContent = BOM + [
      headers.join('\t'),
      ...filteredData.map(row =>
        headers.map(header => row[header] ?? '').join('\t')
      ),
    ].join('\n');

    downloadFile(csvContent, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = async (filteredData: any[]) => {
    setExporting(true);
    try {
      const jsPDF = (await import('jspdf')).jsPDF;
      const pdf = new jsPDF();

      // Title
      pdf.setFontSize(20);
      pdf.text('KenPoliMarket Export', 20, 20);

      // Metadata
      if (options.includeMetadata) {
        pdf.setFontSize(10);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        pdf.text(`Records: ${filteredData.length}`, 20, 35);
      }

      // Data table
      pdf.setFontSize(8);
      let y = 45;
      const headers = Object.keys(filteredData[0] || {});
      
      // Headers
      pdf.setFontSize(8);
      headers.forEach((header, i) => {
        pdf.text(header, 20 + (i * 35), y);
      });

      // Data rows (first 50 to avoid PDF size issues)
      pdf.setFontSize(7);
      filteredData.slice(0, 50).forEach((row, rowIndex) => {
        y += 5;
        if (y > 280) {
          pdf.addPage();
          y = 20;
        }
        headers.forEach((header, i) => {
          const value = String(row[header] ?? '').substring(0, 20);
          pdf.text(value, 20 + (i * 35), y);
        });
      });

      if (filteredData.length > 50) {
        pdf.addPage();
        pdf.text(`Note: Only first 50 records shown. Total: ${filteredData.length}`, 20, 20);
      }

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try another format.');
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    setExporting(true);

    // Filter data based on options
    let filteredData = [...data];

    if (options.counties && options.counties.length > 0) {
      filteredData = filteredData.filter(item =>
        options.counties!.includes(item.county_code || item.county)
      );
    }

    if (options.candidates && options.candidates.length > 0) {
      filteredData = filteredData.filter(item =>
        options.candidates!.includes(item.candidate_name || item.candidate)
      );
    }

    // Export based on format
    switch (options.format) {
      case 'csv':
        exportToCSV(filteredData);
        break;
      case 'json':
        exportToJSON(filteredData);
        break;
      case 'excel':
        exportToExcel(filteredData);
        break;
      case 'pdf':
        exportToPDF(filteredData);
        return; // PDF export handles its own loading state
    }

    setExporting(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
      >
        <span>{exporting ? '⏳' : '📥'}</span>
        <span>{exporting ? 'Exporting...' : 'Export Report'}</span>
        {!exporting && <span className="text-xs">▼</span>}
      </button>

      {isOpen && !exporting && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
          <h3 className="text-lg font-semibold mb-4">Export Options</h3>

          {/* Format Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['csv', 'json', 'excel', 'pdf'] as const).map(format => (
                <button
                  key={format}
                  onClick={() => setOptions(prev => ({ ...prev, format }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    options.format === format
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="mb-4 space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.includeMetadata}
                onChange={(e) => setOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Include metadata</span>
            </label>
            {options.format === 'pdf' && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeCharts}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Include charts</span>
              </label>
            )}
          </div>

          {/* County Filter */}
          {availableCounties.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Counties (optional)
              </label>
              <select
                multiple
                className="w-full border border-gray-300 rounded-lg p-2 text-sm max-h-32"
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setOptions(prev => ({ ...prev, counties: selected }));
                }}
              >
                {availableCounties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

