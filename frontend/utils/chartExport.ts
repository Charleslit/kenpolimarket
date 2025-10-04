/**
 * Chart Export Utilities
 * Provides functions to export charts as PNG images or PDF documents
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Convert lab() color to rgb() fallback
 */
const convertLabToRgb = (cssValue: string): string => {
  if (!cssValue || !cssValue.includes('lab(')) {
    return cssValue;
  }

  // Replace lab() with rgb() fallback
  // This is a simple replacement - actual color may differ slightly
  return cssValue.replace(/lab\([^)]+\)/g, 'rgb(128, 128, 128)');
};

/**
 * Default html2canvas options that work around common issues
 */
const DEFAULT_HTML2CANVAS_OPTIONS = {
  backgroundColor: '#ffffff',
  scale: 2, // Higher quality
  logging: false,
  useCORS: true,
  allowTaint: true,
  // Override styles that might cause issues
  onclone: (clonedDoc: Document) => {
    const win = clonedDoc.defaultView || window;

    // Helper: does a string contain lab()?
    const hasLab = (v?: string | null) => !!v && typeof v === 'string' && v.includes('lab(');

    // Helper: replace any lab(...) with a safe rgb fallback
    const replaceLabWithRgb = (v: string, rgb = 'rgb(128, 128, 128)') => v.replace(/lab\([^)]*\)/g, rgb);

    // Sanitize a single element's styles and attributes
    const sanitizeElement = (el: Element) => {
      const elem = el as HTMLElement;
      const cs = win.getComputedStyle(el);

      // Common color properties
      if (hasLab(cs.color)) elem.style.color = 'rgb(0, 0, 0)';
      if (hasLab(cs.backgroundColor)) elem.style.backgroundColor = 'rgb(255, 255, 255)';
      if (hasLab((cs as any).borderColor)) elem.style.borderColor = 'rgb(200, 200, 200)';

      // Background images (e.g., linear-gradient with lab())
      const bgImage = cs.backgroundImage;
      if (hasLab(bgImage)) {
        elem.style.backgroundImage = 'none';
        if (!elem.style.backgroundColor || elem.style.backgroundColor === 'transparent') {
          elem.style.backgroundColor = 'rgb(255, 255, 255)';
        }
      }

      // Border images
      const borderImage = (cs as any).borderImage;
      if (hasLab(borderImage)) {
        (elem.style as any).borderImage = 'none';
      }

      // Hyphenated CSS properties that may appear in SVG computed styles
      const hyphenProps = [
        'fill',
        'stroke',
        'stop-color',
        'flood-color',
        'lighting-color',
        'outline-color',
        'text-decoration-color',
        'column-rule-color',
      ];
      hyphenProps.forEach((prop) => {
        const val = cs.getPropertyValue(prop);
        if (hasLab(val)) {
          // Set inline style fallback (affects SVG/CSS)
          elem.style.setProperty(prop, 'rgb(128, 128, 128)');
        }
      });

      // Also sanitize SVG-specific attributes directly (when present)
      const svgAttrProps = ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'];
      svgAttrProps.forEach((attr) => {
        const attrVal = el.getAttribute(attr);
        if (attrVal && hasLab(attrVal)) {
          el.setAttribute(attr, replaceLabWithRgb(attrVal, 'rgb(128, 128, 128)'));
        }
      });

      // If inline style attribute itself contains lab(), neutralize it
      if (el.hasAttribute('style')) {
        const styleAttr = el.getAttribute('style') || '';
        if (hasLab(styleAttr)) {
          el.setAttribute('style', replaceLabWithRgb(styleAttr));
        }
      }
    };

    // Find and sanitize all elements in the cloned document
    const all = clonedDoc.querySelectorAll('*');
    all.forEach((node) => sanitizeElement(node));
  },
};

/**
 * Export a chart element as PNG image
 * @param elementId - The ID of the HTML element to export
 * @param filename - The name of the file to download (without extension)
 */
export const exportChartAsPNG = async (elementId: string, filename: string = 'chart'): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Create canvas from the element
    const canvas = await html2canvas(element, DEFAULT_HTML2CANVAS_OPTIONS);

    // Convert to blob using Promise wrapper
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve);
    });

    if (!blob) {
      throw new Error('Failed to create image blob');
    }

    // Download the blob
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting chart as PNG:', error);
    throw error;
  }
};

/**
 * Export a chart element as PDF document
 * @param elementId - The ID of the HTML element to export
 * @param filename - The name of the file to download (without extension)
 * @param orientation - PDF orientation ('portrait' or 'landscape')
 */
export const exportChartAsPDF = async (
  elementId: string,
  filename: string = 'chart',
  orientation: 'portrait' | 'landscape' = 'landscape'
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Create canvas from the element
    const canvas = await html2canvas(element, DEFAULT_HTML2CANVAS_OPTIONS);

    const imgData = canvas.toDataURL('image/png');

    // Create PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
    });

    // Calculate dimensions to fit the page
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting chart as PDF:', error);
    throw error;
  }
};

/**
 * Export multiple charts as a single PDF document
 * @param elementIds - Array of element IDs to export
 * @param filename - The name of the file to download (without extension)
 * @param title - Optional title for the document
 */
export const exportMultipleChartsAsPDF = async (
  elementIds: string[],
  filename: string = 'charts',
  title?: string
): Promise<void> => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    let currentY = 20;

    // Add title if provided
    if (title) {
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, pdfWidth / 2, 15, { align: 'center' });
      currentY = 25;
    }

    // Add each chart
    for (let i = 0; i < elementIds.length; i++) {
      const element = document.getElementById(elementIds[i]);
      if (!element) {
        console.warn(`Element with ID "${elementIds[i]}" not found, skipping...`);
        continue;
      }

      // Create canvas from the element
      const canvas = await html2canvas(element, DEFAULT_HTML2CANVAS_OPTIONS);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate dimensions to fit the page width
      const ratio = (pdfWidth - 20) / imgWidth;
      const scaledHeight = imgHeight * ratio;

      // Add new page if needed
      if (i > 0 && currentY + scaledHeight > pdfHeight - 10) {
        pdf.addPage();
        currentY = 20;
      }

      pdf.addImage(imgData, 'PNG', 10, currentY, pdfWidth - 20, scaledHeight);
      currentY += scaledHeight + 10;
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting multiple charts as PDF:', error);
    throw error;
  }
};

/**
 * Copy chart as image to clipboard
 * @param elementId - The ID of the HTML element to copy
 */
export const copyChartToClipboard = async (elementId: string): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Create canvas from the element
    const canvas = await html2canvas(element, DEFAULT_HTML2CANVAS_OPTIONS);

    // Convert to blob using Promise wrapper
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve);
    });

    if (!blob) {
      throw new Error('Failed to create image blob');
    }

    // Copy to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ]);

    console.log('Chart copied to clipboard!');
  } catch (error) {
    console.error('Error copying chart to clipboard:', error);
    throw error;
  }
};

/**
 * Generate a filename with timestamp
 * @param prefix - Prefix for the filename
 * @param extension - File extension (without dot)
 */
export const generateFilename = (prefix: string, extension: string = 'png'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
};

/**
 * Export data as CSV file
 * @param data - Array of objects to export
 * @param filename - The name of the file to download (without extension)
 */
export const exportDataAsCSV = (data: any[], filename: string = 'data'): void => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data as CSV:', error);
    throw error;
  }
};

/**
 * Export data as JSON file
 * @param data - Data to export
 * @param filename - The name of the file to download (without extension)
 */
export const exportDataAsJSON = (data: any, filename: string = 'data'): void => {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data as JSON:', error);
    throw error;
  }
};

