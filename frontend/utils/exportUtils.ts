/**
 * Export Utilities for KenPoliMarket
 * Provides PDF, CSV, and Image export functionality
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

/**
 * Generate timestamp for filenames
 */
export const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * Add KenPoliMarket branding header to PDF
 */
const addPDFHeader = (doc: jsPDF, title: string) => {
  // Add logo/branding
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235); // Blue color
  doc.text('🇰🇪 KenPoliMarket', 14, 20);
  
  // Add title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 32);
  
  // Add timestamp
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
  
  // Add separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 44, 196, 44);
  
  return 50; // Return Y position for content start
};

/**
 * Add footer to PDF
 */
const addPDFFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount} | KenPoliMarket - Kenya Political Forecasting Platform`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      'Data Source: IEBC, KNBS Census 2019',
      doc.internal.pageSize.width - 14,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }
};

/**
 * Export data table to PDF
 */
export const exportTableToPDF = (
  title: string,
  headers: string[],
  data: any[][],
  filename?: string
) => {
  const doc = new jsPDF();
  const startY = addPDFHeader(doc, title);
  
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: startY + 5,
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235], // Blue
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    }
  });
  
  addPDFFooter(doc);
  
  const pdfFilename = filename || `KenPoliMarket_${title.replace(/\s+/g, '_')}_${getTimestamp()}.pdf`;
  doc.save(pdfFilename);
};

/**
 * Export complex report to PDF with multiple sections
 */
export const exportReportToPDF = (
  title: string,
  sections: Array<{
    heading: string;
    content?: string;
    table?: { headers: string[]; data: any[][] };
  }>,
  filename?: string
) => {
  const doc = new jsPDF();
  let currentY = addPDFHeader(doc, title);
  
  sections.forEach((section, index) => {
    // Check if we need a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    // Add section heading
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(section.heading, 14, currentY);
    currentY += 8;
    
    // Add content if present
    if (section.content) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(section.content, 180);
      doc.text(lines, 14, currentY);
      currentY += lines.length * 5 + 5;
    }
    
    // Add table if present
    if (section.table) {
      autoTable(doc, {
        head: [section.table.headers],
        body: section.table.data,
        startY: currentY,
        theme: 'grid',
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255
        },
        styles: {
          fontSize: 8,
          cellPadding: 2
        }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
  });
  
  addPDFFooter(doc);
  
  const pdfFilename = filename || `KenPoliMarket_Report_${getTimestamp()}.pdf`;
  doc.save(pdfFilename);
};

/**
 * Export data to CSV
 */
export const exportToCSV = (
  headers: string[],
  data: any[][],
  filename?: string
) => {
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      row.map(cell => {
        // Handle cells with commas or quotes
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    )
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `KenPoliMarket_Export_${getTimestamp()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export object array to CSV (auto-detect headers)
 */
export const exportObjectsToCSV = <T extends Record<string, any>>(
  data: T[],
  filename?: string
) => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }
  
  // Extract headers from first object
  const headers = Object.keys(data[0]);
  
  // Convert objects to arrays
  const rows = data.map(obj => headers.map(header => obj[header]));
  
  exportToCSV(headers, rows, filename);
};

/**
 * Capture element as image and download
 */
export const exportElementAsImage = async (
  elementId: string,
  filename?: string,
  options?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
  }
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }
  
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: options?.backgroundColor || '#ffffff',
      scale: 2, // Higher quality
      logging: false,
      width: options?.width,
      height: options?.height
    });
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename || `KenPoliMarket_Chart_${getTimestamp()}.png`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    });
  } catch (error) {
    console.error('Failed to export image:', error);
  }
};

/**
 * Export element as social media optimized image (1200x630px for Twitter/Facebook)
 */
export const exportAsSocialImage = async (
  elementId: string,
  filename?: string
) => {
  await exportElementAsImage(elementId, filename, {
    width: 1200,
    height: 630,
    backgroundColor: '#f3f4f6'
  });
};

/**
 * Copy data to clipboard as formatted text
 */
export const copyTableToClipboard = (headers: string[], data: any[][]) => {
  const text = [
    headers.join('\t'),
    ...data.map(row => row.join('\t'))
  ].join('\n');
  
  navigator.clipboard.writeText(text).then(
    () => {
      console.log('Data copied to clipboard');
    },
    (err) => {
      console.error('Failed to copy to clipboard:', err);
    }
  );
};

