/**
 * Account Management System - Print Service
 * 
 * This service handles document printing operations.
 * Supports requirements: 10.1, 11.1, 8.1
 */

import { Injectable, inject } from '@angular/core';
import { Account } from '../models/account.model';
import { AccountService } from './account.service';

/**
 * PrintService
 * 
 * Handles printing of account confirmations, balance confirmations, and QR codes.
 * This is a placeholder implementation that will be fully implemented later.
 */
@Injectable({
  providedIn: 'root'
})
export class PrintService {
  private readonly accountService = inject(AccountService);

  /**
   * Print account confirmation document
   * 
   * @param account - Account to print confirmation for
   */
  printAccountConfirmation(account: Account): void {
    console.log('Printing account confirmation for:', account.accountNumber);
    
    // TODO: Implement actual printing logic
    this.accountService.generateAccountConfirmation(account.id).subscribe({
      next: (blob) => {
        this.openPrintDialog(blob, `Account Confirmation - ${account.accountNumber}`);
      },
      error: (error) => {
        console.error('Error generating account confirmation:', error);
      }
    });
  }

  /**
   * Print balance confirmation document
   * 
   * @param account - Account to print balance confirmation for
   */
  printBalanceConfirmation(account: Account): void {
    console.log('Printing balance confirmation for:', account.accountNumber);
    
    // TODO: Implement actual printing logic
    this.accountService.generateBalanceConfirmation(account.id).subscribe({
      next: (blob) => {
        this.openPrintDialog(blob, `Balance Confirmation - ${account.accountNumber}`);
      },
      error: (error) => {
        console.error('Error generating balance confirmation:', error);
      }
    });
  }

  /**
   * Print QR code
   * 
   * @param qrCodeData - Base64-encoded QR code image data
   * @param account - Account associated with the QR code
   */
  printQRCode(qrCodeData: string, account: Account): void {
    console.log('Printing QR code for:', account.accountNumber);
    
    // Create a simple HTML content with the QR code
    const content = `
      <html>
        <head>
          <title>QR Code - ${account.accountNumber}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0;
              font-family: Arial, sans-serif;
            }
            img { 
              max-width: 400px; 
              max-height: 400px; 
            }
            .info {
              margin-top: 20px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <img src="${qrCodeData}" alt="QR Code" />
          <div class="info">
            <h2>${account.accountName}</h2>
            <p>Account Number: ${account.accountNumber}</p>
          </div>
        </body>
      </html>
    `;
    
    this.openPrintDialogFromHTML(content, `QR Code - ${account.accountNumber}`);
  }

  /**
   * Open print dialog with PDF blob content
   * 
   * @param blob - PDF blob to print
   * @param title - Document title
   */
  private openPrintDialog(blob: Blob, title: string): void {
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.document.title = title;
        printWindow.print();
      };
    } else {
      console.error('Failed to open print window. Please check popup blocker settings.');
    }
  }

  /**
   * Open print dialog with HTML content
   * 
   * @param content - HTML content to print
   * @param title - Document title
   */
  private openPrintDialogFromHTML(content: string, title: string): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.document.title = title;
      
      // Wait for content to load before printing
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      console.error('Failed to open print window. Please check popup blocker settings.');
    }
  }
}
