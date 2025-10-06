'use client';

import React, { useState } from 'react';
import { Download, FileText, Table, Image, Loader2 } from 'lucide-react';

export interface ExportOption {
  label: string;
  icon: React.ReactNode;
  action: () => void | Promise<void>;
}

interface ExportButtonProps {
  options?: ExportOption[];
  onExportPDF?: () => void | Promise<void>;
  onExportCSV?: () => void | Promise<void>;
  onExportImage?: () => void | Promise<void>;
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * Reusable Export Button Component
 * Displays a dropdown with export options (PDF, CSV, Image)
 */
export default function ExportButton({
  options,
  onExportPDF,
  onExportCSV,
  onExportImage,
  className = '',
  variant = 'default'
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Build default options if not provided
  const exportOptions: ExportOption[] = options || [
    ...(onExportPDF ? [{
      label: 'Export as PDF',
      icon: <FileText className="w-4 h-4" />,
      action: onExportPDF
    }] : []),
    ...(onExportCSV ? [{
      label: 'Export as CSV',
      icon: <Table className="w-4 h-4" />,
      action: onExportCSV
    }] : []),
    ...(onExportImage ? [{
      label: 'Export as Image',
      icon: <Image className="w-4 h-4" />,
      action: onExportImage
    }] : [])
  ];

  const handleExport = async (action: () => void | Promise<void>) => {
    setIsExporting(true);
    setIsOpen(false);
    
    try {
      await action();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (exportOptions.length === 0) {
    return null;
  }

  // Compact variant - single button with dropdown
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isExporting}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">Export</span>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              {exportOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleExport(option.action)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Default variant - separate buttons
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {exportOptions.map((option, index) => (
        <button
          key={index}
          onClick={() => handleExport(option.action)}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            option.icon
          )}
          <span className="text-sm font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Simple single export button (no dropdown)
 */
export function SingleExportButton({
  label = 'Export',
  icon,
  onClick,
  className = ''
}: {
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void | Promise<void>;
  className?: string;
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleClick = async () => {
    setIsExporting(true);
    try {
      await onClick();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isExporting}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon || <Download className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

