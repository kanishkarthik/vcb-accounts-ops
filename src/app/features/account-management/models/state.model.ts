/**
 * Account Management System - State Model
 * 
 * This file contains the state management interfaces for the AccountManagementComponent.
 * Uses Angular Signals for reactive state management.
 */

import { Account, AccountType, SearchFilters } from './account.model';

/**
 * AccountManagementState
 * 
 * Represents the complete state of the Account Management feature.
 * This state is managed using Angular Signals for reactive updates.
 */
export interface AccountManagementState {
  /**
   * Currently selected account type tab
   */
  selectedAccountType: AccountType;

  /**
   * Accounts for the currently selected account type
   */
  accounts: Account[];

  /**
   * Filtered accounts based on current search filters
   */
  filteredAccounts: Account[];

  /**
   * Current search filter values
   */
  searchFilters: SearchFilters;

  /**
   * Loading state for account data
   */
  isLoading: boolean;

  /**
   * Error message if an error occurred
   */
  error: string | null;

  /**
   * Currently selected account (for details view)
   */
  selectedAccount: Account | null;

  /**
   * Modal visibility states
   */
  modals: {
    accountDetails: boolean;
    transactionHistory: boolean;
    qrCode: boolean;
    transfer: boolean;
    preferences: boolean;
  };
}

/**
 * Initial state factory function
 * 
 * @param defaultAccountType - Default account type to display
 * @returns Initial AccountManagementState
 */
export function createInitialState(defaultAccountType: AccountType = 'current'): AccountManagementState {
  return {
    selectedAccountType: defaultAccountType,
    accounts: [],
    filteredAccounts: [],
    searchFilters: {},
    isLoading: false,
    error: null,
    selectedAccount: null,
    modals: {
      accountDetails: false,
      transactionHistory: false,
      qrCode: false,
      transfer: false,
      preferences: false
    }
  };
}
