/**
 * Account Management System - User Preferences Model
 * 
 * This file contains the UserPreferences interface for managing user-specific
 * display and behavior preferences in the Account Management System.
 * 
 * Requirements: 14.1, 14.3, 14.4
 */

import { AccountType } from './account.model';

// ============================================================================
// User Preferences Interface
// ============================================================================

/**
 * User Preferences Interface
 * 
 * Stores user-specific preferences for the account management interface,
 * including column visibility, display formats, and default values.
 * 
 * **Validates: Requirements 14.1, 14.3, 14.4**
 * - 14.1: Column visibility and width customization
 * - 14.3: Default currency and account type preferences
 * - 14.4: Display format preferences (date, number, pagination)
 */
export interface UserPreferences {
  /**
   * List of column identifiers that should be visible in the account table
   * Example: ['accountNumber', 'accountName', 'currentBalance', 'currency']
   */
  visibleColumns: string[];

  /**
   * Map of column identifiers to their custom widths in pixels
   * Allows users to resize columns and persist their preferences
   */
  columnWidths: Map<string, number>;

  /**
   * Default currency to use for display and conversions
   * Example: 'VND', 'USD', 'EUR'
   */
  defaultCurrency: string;

  /**
   * Default account type to filter by when loading the account list
   * Can be 'current', 'deposit', 'loan', or 'virtual'
   */
  defaultAccountType: AccountType;

  /**
   * Number of rows to display per page in the account table
   * Common values: 10, 25, 50, 100
   */
  rowsPerPage: number;

  /**
   * Date format string for displaying dates throughout the application
   * Examples: 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'
   */
  dateFormat: string;

  /**
   * Number format string for displaying numeric values
   * Examples: '1.2-2' (min 1 decimal, max 2), '1.0-0' (no decimals)
   */
  numberFormat: string;
}
