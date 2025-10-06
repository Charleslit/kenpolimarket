'use client';

import { useState } from 'react';
import { Upload, Database, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface ImportProgress {
  status: string;
  total_rows?: number;
  processed_rows?: number;
  created_stations?: number;
  updated_stations?: number;
  errors?: string[];
  message: string;
}

export default function DataImportManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ImportProgress | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2022);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('election_year', selectedYear.toString());

    try {
      const response = await fetch(`${API_BASE_URL}/polling-stations/import-csv`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setUploadProgress(result);
        
        if (result.status === 'completed') {
          // Clear file after successful upload
          setTimeout(() => {
            setSelectedFile(null);
          }, 3000);
        }
      } else {
        const error = await response.json();
        setUploadProgress({
          status: 'failed',
          message: error.detail || 'Upload failed'
        });
      }
    } catch (error: any) {
      setUploadProgress({
        status: 'failed',
        message: error.message || 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setUploadProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Database className="w-7 h-7" />
          Historical Data Import
        </h2>
        <p className="text-purple-100">
          Import voter registration data from IEBC CSV files for different election years
        </p>
      </div>

      {/* Year Selector */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Election Year</h3>
        <div className="flex gap-3">
          {[2013, 2017, 2022, 2027].map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all
                ${
                  selectedYear === year
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {year}
              {year === 2027 && (
                <span className="ml-2 text-xs opacity-75">(Forecast)</span>
              )}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Selected year: <strong>{selectedYear}</strong> - Data will be imported into the voter_registration_history table
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-6 h-6 text-blue-600" />
          Upload CSV File
        </h3>

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            Drag and drop your IEBC CSV file here, or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Expected format: rov_per_polling_station.csv
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors font-medium"
          >
            Choose File
          </label>

          {selectedFile && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 font-medium flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload & Import
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className={`mt-6 p-6 rounded-lg border-2 ${
            uploadProgress.status === 'completed' ? 'bg-green-50 border-green-200' :
            uploadProgress.status === 'failed' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              {uploadProgress.status === 'completed' && (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              )}
              {uploadProgress.status === 'failed' && (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              )}
              {uploadProgress.status === 'processing' && (
                <div className="w-6 h-6 flex-shrink-0 mt-1 animate-spin">⏳</div>
              )}
              
              <div className="flex-1">
                <p className={`font-bold text-lg ${
                  uploadProgress.status === 'completed' ? 'text-green-800' :
                  uploadProgress.status === 'failed' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {uploadProgress.message}
                </p>
                
                {uploadProgress.processed_rows && uploadProgress.processed_rows > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white bg-opacity-50 rounded p-3">
                      <p className="text-gray-600">Total Rows</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {uploadProgress.total_rows?.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded p-3">
                      <p className="text-gray-600">Processed</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {uploadProgress.processed_rows.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded p-3">
                      <p className="text-gray-600">Created</p>
                      <p className="text-2xl font-bold text-green-700">
                        {uploadProgress.created_stations?.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded p-3">
                      <p className="text-gray-600">Updated</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {uploadProgress.updated_stations?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {uploadProgress.errors && uploadProgress.errors.length > 0 && (
                  <div className="mt-4 p-3 bg-red-100 rounded">
                    <p className="font-semibold text-red-800 mb-2">Errors:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {uploadProgress.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {uploadProgress.errors.length > 5 && (
                        <li className="font-semibold">
                          ... and {uploadProgress.errors.length - 5} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Import Instructions
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Select the election year (2013, 2017, 2022, or 2027)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>Upload the IEBC CSV file (rov_per_polling_station.csv format)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>Data will be imported into voter_registration_history table</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>Triggers will automatically update ward, constituency, and county totals</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">5.</span>
            <span>Users can then select the year in the Geographic Explorer to view historical data</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

