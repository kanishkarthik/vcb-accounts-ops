/**
 * Account Management System - Account Service
 * 
 * This service manages all account-related API calls and business logic.
 * Supports requirements: 1.2, 4.6, 5.1, 5.2, 6.1, 6.2, 7.1, 8.1, 10.1, 11.1, 18.1, 18.2
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { 
  Account, 
  AccountDetails, 
  AccountType,
  Transaction,
  TransactionPage,
  PaginationParams
} from '../models/account.model';
import { TransferRequest, TransferResponse } from '../models/transfer.model';

/**
 * Response interface for accounts list API
 */
interface AccountsResponse {
  accounts: Account[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Response interface for QR code generation API
 */
interface QRCodeResponse {
  qrCodeData: string;
  accountNumber: string;
  accountName: string;
}

/**
 * AccountService
 * 
 * Core service for managing account operations including:
 * - Fetching accounts by type
 * - Retrieving account details
 * - Managing transaction history
 * - Creating domestic transfers
 * - Generating QR codes and confirmations
 * - Filtering closed accounts (12-month rule)
 */
@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);

  // API base URL - should be configured via environment or runtime config
  private readonly apiBaseUrl = '/api';

  /**
   * Get accounts by type with pagination
   * 
   * Requirement 1.2: Fetch accounts of specific type
   * Requirement 4.6: Support closed accounts within 12 months
   * 
   * @param type - Account type to filter by
   * @param page - Page number (default: 1)
   * @param pageSize - Number of items per page (default: 50)
   * @returns Observable of filtered accounts array
   */
  getAccountsByType(
    type: AccountType, 
    page: number = 1, 
    pageSize: number = 50
  ): Observable<Account[]> {
    const params = new HttpParams()
      .set('type', type)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.httpClient
      .get<AccountsResponse>(`${this.apiBaseUrl}/accounts`, { params })
      .pipe(
        map(response => this.filterClosedAccounts(response.accounts)),
        catchError(error => this.handleApiError(error))
      );
  }

  /**
   * Get detailed information for a specific account
   * 
   * Requirement 5.1: Retrieve comprehensive account details
   * 
   * @param accountId - Unique account identifier
   * @returns Observable of account details
   */
  getAccountDetails(accountId: string): Observable<AccountDetails> {
    return this.httpClient
      .get<AccountDetails>(`${this.apiBaseUrl}/accounts/${accountId}`)
      .pipe(
        catchError(error => this.handleApiError(error))
      );
  }

  /**
   * Get transaction history for an account with pagination
   * 
   * Requirement 6.1: Fetch paginated transaction history
   * Requirement 6.2: Support sorting and filtering
   * 
   * @param accountId - Account identifier
   * @param params - Pagination and sorting parameters
   * @returns Observable of transaction page
   */
  getTransactionHistory(
    accountId: string, 
    params: PaginationParams
  ): Observable<TransactionPage> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('pageSize', params.pageSize.toString());

    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }

    if (params.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.httpClient
      .get<TransactionPage>(
        `${this.apiBaseUrl}/accounts/${accountId}/transactions`,
        { params: httpParams }
      )
      .pipe(
        catchError(error => this.handleApiError(error))
      );
  }

  /**
   * Create a domestic transfer between accounts
   * 
   * Requirement 7.1: Initiate domestic transfer with validation
   * 
   * @param transfer - Transfer request details
   * @returns Observable of transfer response
   */
  createDomesticTransfer(transfer: TransferRequest): Observable<TransferResponse> {
    return this.httpClient
      .post<TransferResponse>(`${this.apiBaseUrl}/transfers/domestic`, transfer)
      .pipe(
        catchError(error => this.handleApiError(error))
      );
  }

  /**
   * Generate QR code for an account
   * 
   * Requirement 8.1: Generate QR code containing account information
   * 
   * @param accountId - Account identifier
   * @returns Observable of base64-encoded QR code data
   */
  generateAccountQRCode(accountId: string): Observable<string> {
    return this.httpClient
      .post<QRCodeResponse>(`${this.apiBaseUrl}/accounts/${accountId}/qr-code`, {})
      .pipe(
        map(response => response.qrCodeData),
        catchError(error => this.handleApiError(error))
      );
  }

  /**
   * Generate account confirmation document
   * 
   * Requirement 10.1: Generate printable account confirmation
   * 
   * @param accountId - Account identifier
   * @returns Observable of PDF blob
   */
  generateAccountConfirmation(accountId: string): Observable<Blob> {
    return this.httpClient
      .get(`${this.apiBaseUrl}/accounts/${accountId}/confirmation`, {
        responseType: 'blob'
      })
      .pipe(
        catchError(error => this.handleApiError(error))
      );
  }

  /**
   * Generate balance confirmation document
   * 
   * Requirement 11.1: Generate printable balance confirmation
   * 
   * @param accountId - Account identifier
   * @returns Observable of PDF blob
   */
  generateBalanceConfirmation(accountId: string): Observable<Blob> {
    return this.httpClient
      .get(`${this.apiBaseUrl}/accounts/${accountId}/balance-confirmation`, {
        responseType: 'blob'
      })
      .pipe(
        catchError(error => this.handleApiError(error))
      );
  }

  /**
   * Filter closed accounts based on 12-month rule
   * 
   * Requirement 4.6: Only show closed accounts if closed within 12 months
   * 
   * @param accounts - Array of accounts to filter
   * @returns Filtered array excluding accounts closed more than 12 months ago
   */
  filterClosedAccounts(accounts: Account[]): Account[] {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    return accounts.filter(account => {
      // Keep all non-closed accounts
      if (account.accountStatus !== 'closed') {
        return true;
      }

      // For closed accounts, only keep if closed within 12 months
      if (account.closedDate) {
        const closedDate = new Date(account.closedDate);
        return closedDate >= twelveMonthsAgo;
      }

      // If closed but no closedDate, exclude for safety
      return false;
    });
  }

  /**
   * Handle API errors with appropriate user messages
   * 
   * Requirement 18.1: Display user-friendly error messages
   * Requirement 18.2: Handle different error scenarios
   * 
   * @param error - HTTP error response
   * @returns Observable that throws formatted error
   */
  private handleApiError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred.';

    // Network error (status 0 means no response from server)
    if (error.status === 0) {
      errorMessage = 'Unable to connect. Please check your internet connection.';
      console.error('Network error:', error);
      return throwError(() => new Error(errorMessage));
    }

    // Parse error message from response if available
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else {
      // Handle specific HTTP status codes
      switch (error.status) {
        case 401:
          errorMessage = 'Session expired. Please log in again.';
          // Redirect to login page
          this.router.navigate(['/login']);
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'The requested account was not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please contact support if the problem persists.';
          break;
        case 400:
          errorMessage = 'Invalid request. Please check your input and try again.';
          break;
        default:
          errorMessage = `Error: ${error.statusText || 'Unknown error occurred'}`;
      }
    }

    console.error('API Error:', {
      status: error.status,
      message: errorMessage,
      error: error.error
    });

    return throwError(() => new Error(errorMessage));
  }
}
