/**
 * Account Management System - Core Data Models
 * 
 * This file contains all TypeScript interfaces for the Account Management System.
 * These models support requirements: 1.1, 2.1, 4.1, 6.2, 12.1
 */

// ============================================================================
// Account Types and Status
// ============================================================================

/**
 * Supported account types in the system
 */
export type AccountType = 'current' | 'deposit' | 'loan' | 'virtual';

/**
 * Possible account status values
 */
export type AccountStatus = 'active' | 'inactive' | 'closed';

// ============================================================================
// Core Account Interfaces
// ============================================================================

/**
 * Main Account Interface
 * Represents the core account information displayed in the account list
 */
export interface Account {
  id: string;
  accountNumber: string;
  accountName: string;
  accountAlias?: string;
  accountType: AccountType;
  accountStatus: AccountStatus;
  currentBalance: number;
  availableBalance: number;
  currency: string;
  isPrimaryCIF: boolean;
  openedDate: Date;
  closedDate?: Date;
  lastTransactionDate?: Date;
}

/**
 * Extended Account Details
 * Contains additional information shown in the account details view
 */
export interface AccountDetails extends Account {
  cifNumber: string;
  branchCode: string;
  branchName: string;
  productCode: string;
  productName: string;
  interestRate?: number;
  maturityDate?: Date;
  overdraftLimit?: number;
  linkedAccounts: string[];
}

// ============================================================================
// Transaction Interfaces
// ============================================================================

/**
 * Transaction Interface
 * Represents a single transaction in an account's history
 */
export interface Transaction {
  id: string;
  accountId: string;
  transactionDate: Date;
  valueDate: Date;
  description: string;
  debitAmount?: number;
  creditAmount?: number;
  balance: number;
  currency: string;
  referenceNumber: string;
  transactionType: string;
}

/**
 * Paginated Transaction Response
 * Contains a page of transactions with pagination metadata
 */
export interface TransactionPage {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Pagination and Search
// ============================================================================

/**
 * Pagination Parameters
 * Used for paginated API requests
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search Filters
 * Defines available filters for account search functionality
 */
export interface SearchFilters {
  accountNumber?: string;
  accountName?: string;
  accountAlias?: string;
  currency?: string;
  status?: AccountStatus;
}

// ============================================================================
// Balance Summary
// ============================================================================

/**
 * Balance Summary
 * Aggregated balance information for a group of accounts
 */
export interface BalanceSummary {
  currency: string;
  totalCurrentBalance: number;
  totalAvailableBalance: number;
  accountCount: number;
  convertedToVND?: number;
}
