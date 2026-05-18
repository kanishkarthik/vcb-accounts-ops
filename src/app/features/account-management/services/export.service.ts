/**
 * Account Management System - Export Service
 * 
 * This service handles data export to various formats (CSV, Excel).
 * Supports requirements: 9.1, 9.2
 */

import { Injectable } from '@angular/core';
import { Account } from '../models/account.model';

/**
 * ExportService
 * 
 * Handles exporting account data to CSV and Excel formats.
 * This is a placeholder implementation that will be fully implemented later.
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {
  /**
   * Export account data to CSV format
   * 
   * @param data - Array of accounts to export
   * @param columns - Column identifiers to include in export
   */
  exportToCSV(data: Account[], columns: string[]): void {
    // TODO: Implement CSV export using file-saver library
    console.log('Exporting to CSV:', { data, columns });
    
    // Placeholder implementation
    const csvContent = this.prepareCSVContent(data, columns);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `accounts_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export account data to Excel format
   * 
   * @param data - Array of accounts to export
   * @param columns - Column identifiers to include in export
   * @param filename - Name of the exported file
   */
  exportToExcel(data: Account[], columns: string[], filename: string): void {
    // TODO: Implement Excel export using a library like xlsx or file-saver
    console.log('Exporting to Excel:', { data, columns, filename });
    
    // Placeholder: For now, export as CSV
    this.exportToCSV(data, columns);
  }

  /**
   * Prepare export data by selecting visible columns
   * 
   * @param accounts - Array of accounts
   * @param visibleColumns - Column identifiers to include
   * @returns Array of objects with only visible columns
   */
  prepareExportData(accounts: Account[], visibleColumns: string[]): any[] {
    return accounts.map(account => {
      const exportRow: any = {};
      visibleColumns.forEach(column => {
        if (column in account) {
          exportRow[column] = (account as any)[column];
        }
      });
      return exportRow;
    });
  }

  /**
   * Prepare CSV content from account data
   * 
   * @param data - Array of accounts
   * @param columns - Column identifiers to include
   * @returns CSV string content
   */
  private prepareCSVContent(data: Account[], columns: string[]): string {
    const exportData = this.prepareExportData(data, columns);
    
    // Create header row
    const header = columns.join(',');
    
    // Create data rows
    const rows = exportData.map(row => {
      return columns.map(col => {
        const value = row[col];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',');
    });
    
    return [header, ...rows].join('\n');
  }
}
