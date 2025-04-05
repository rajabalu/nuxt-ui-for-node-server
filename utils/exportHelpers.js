/**
 * Export data utilities for different file formats
 */

/**
 * Convert data to CSV format and trigger download
 */
export const exportToCSV = (data, filename = 'export') => {
  if (!data || !data.length) return;
  
  // Get headers from the first item
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  // Add rows
  csvContent += data.map(item => {
    return headers.map(key => {
      let value = item[key] === null || item[key] === undefined ? '' : item[key];
      
      // Handle strings with commas or quotes
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
      }
      
      return value;
    }).join(',');
  }).join('\n');
  
  // Create Blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create download link
  downloadFile(url, `${filename}.csv`);
};

/**
 * Export to Excel format
 * Uses CSV format with Excel-specific header
 */
export const exportToExcel = (data, filename = 'export') => {
  if (!data || !data.length) return;
  
  // Get headers from the first item
  const headers = Object.keys(data[0]);
  
  // Create CSV content with Excel header
  let excelContent = 'sep=,\n' + headers.join(',') + '\n';
  
  // Add rows
  excelContent += data.map(item => {
    return headers.map(key => {
      let value = item[key] === null || item[key] === undefined ? '' : item[key];
      
      // Handle strings with commas or quotes
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
      }
      
      return value;
    }).join(',');
  }).join('\n');
  
  // Create Blob and download link
  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create download link
  downloadFile(url, `${filename}.xls`);
};

/**
 * Export to JSON format
 */
export const exportToJSON = (data, filename = 'export') => {
  if (!data || !data.length) return;
  
  // Convert to JSON string with formatting
  const jsonContent = JSON.stringify(data, null, 2);
  
  // Create Blob and download link
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create download link
  downloadFile(url, `${filename}.json`);
};

/**
 * Helper function to trigger file download
 */
const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}; 