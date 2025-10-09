'use client';

import { useState } from 'react';
import ExportButton, { SingleExportButton } from '@/components/common/ExportButton';
import { exportTableToPDF, exportReportToPDF, exportObjectsToCSV, exportElementAsImage } from '@/utils/exportUtils';
import { FileText, Table, Image } from 'lucide-react';

export default function TestExportsPage() {
  const [exporting, setExporting] = useState(false);

  // Sample data
  const sampleData = [
    { candidate: 'William Ruto', party: 'UDA', votes: 7500000, share: 52.3 },
    { candidate: 'Raila Odinga', party: 'Azimio', votes: 6800000, share: 47.7 }
  ];

  const handleExportSimplePDF = () => {
    exportTableToPDF(
      '2022 Presidential Results',
      ['Candidate', 'Party', 'Votes', 'Share (%)'],
      sampleData.map(d => [d.candidate, d.party, d.votes.toLocaleString(), d.share.toString()])
    );
  };

  const handleExportComplexPDF = () => {
    exportReportToPDF(
      'Kenya 2022 Presidential Election Analysis',
      [
        {
          heading: 'Executive Summary',
          content: 'The 2022 Kenyan presidential election was held on August 9, 2022. William Ruto of the UDA party won with 52.3% of the vote, defeating Raila Odinga of the Azimio coalition who received 47.7%.'
        },
        {
          heading: 'National Results',
          table: {
            headers: ['Candidate', 'Party', 'Votes', 'Share (%)'],
            data: sampleData.map(d => [d.candidate, d.party, d.votes.toLocaleString(), d.share.toString()])
          }
        },
        {
          heading: 'Regional Breakdown',
          table: {
            headers: ['Region', 'Ruto %', 'Raila %', 'Winner'],
            data: [
              ['Mount Kenya', '75.2', '24.8', 'Ruto'],
              ['Rift Valley', '68.5', '31.5', 'Ruto'],
              ['Nyanza', '15.3', '84.7', 'Raila'],
              ['Western', '32.1', '67.9', 'Raila'],
              ['Coast', '45.2', '54.8', 'Raila'],
              ['Nairobi', '48.9', '51.1', 'Raila']
            ]
          }
        }
      ]
    );
  };

  const handleExportCSV = () => {
    exportObjectsToCSV(sampleData, 'Kenya_2022_Presidential_Results.csv');
  };

  const handleExportImage = async () => {
    setExporting(true);
    await exportElementAsImage('export-demo-card');
    setExporting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Export Features Test Page</h1>
          <p className="text-blue-100">
            Test all export functionality: PDF, CSV, and Image exports
          </p>
        </div>

        {/* Export Buttons Demo */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Export Button Variants</h2>
          
          <div className="space-y-6">
            {/* Compact Variant */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Compact Variant (Dropdown)</h3>
              <ExportButton
                variant="compact"
                onExportPDF={handleExportSimplePDF}
                onExportCSV={handleExportCSV}
                onExportImage={handleExportImage}
              />
            </div>

            {/* Default Variant */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Default Variant (Separate Buttons)</h3>
              <ExportButton
                variant="default"
                onExportPDF={handleExportSimplePDF}
                onExportCSV={handleExportCSV}
                onExportImage={handleExportImage}
              />
            </div>

            {/* Single Button */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Single Export Button</h3>
              <SingleExportButton
                label="Export PDF Report"
                icon={<FileText className="w-4 h-4" />}
                onClick={handleExportComplexPDF}
              />
            </div>
          </div>
        </div>

        {/* Sample Data Card (for image export) */}
        <div id="export-demo-card" className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">2022 Presidential Results</h2>
            <span className="text-sm text-gray-500">August 9, 2022</span>
          </div>

          <div className="space-y-4">
            {sampleData.map((candidate, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-lg text-gray-900">{candidate.candidate}</div>
                    <div className="text-sm text-gray-500">{candidate.party}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{candidate.share}%</div>
                    <div className="text-sm text-gray-500">{candidate.votes.toLocaleString()} votes</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${candidate.share}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>🇰🇪 BlockcertAfrica - Kenya Political Forecasting Platform</p>
            <p className="text-xs mt-1">Data Source: IEBC Official Results</p>
          </div>
        </div>

        {/* Export Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Test Export Functions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleExportSimplePDF}
              className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="text-center">
                <div className="font-semibold text-gray-900">Simple PDF</div>
                <div className="text-xs text-gray-500 mt-1">Single table export</div>
              </div>
            </button>

            <button
              onClick={handleExportComplexPDF}
              className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <FileText className="w-8 h-8 text-purple-600" />
              <div className="text-center">
                <div className="font-semibold text-gray-900">Complex PDF</div>
                <div className="text-xs text-gray-500 mt-1">Multi-section report</div>
              </div>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <Table className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <div className="font-semibold text-gray-900">CSV Export</div>
                <div className="text-xs text-gray-500 mt-1">Spreadsheet format</div>
              </div>
            </button>
          </div>

          <div className="mt-4">
            <button
              onClick={handleExportImage}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50"
            >
              <Image className="w-5 h-5" />
              <span className="font-semibold">
                {exporting ? 'Exporting Image...' : 'Export Card as Image'}
              </span>
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Exports the results card above as a PNG image
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">📝 Testing Instructions</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Click any export button to test the functionality</li>
            <li>• PDF exports will download automatically</li>
            <li>• CSV files can be opened in Excel or Google Sheets</li>
            <li>• Image exports capture the results card above</li>
            <li>• All exports include timestamps in filenames</li>
            <li>• Check browser downloads folder for exported files</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

