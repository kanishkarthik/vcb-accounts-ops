/**
 * Account Management System - Transfer and Action Models
 * 
 * This file contains TypeScript interfaces for transfer operations and account actions.
 * These models support requirements: 7.1, 7.2
 */

import { Account } from './account.model';

// ============================================================================
// Transfer Interfaces
// ============================================================================

/**
 * Transfer Request
 * Represents a domestic transfer request from one account to another
 */
export interface TransferRequest {
  sourceAccountId: string;
  destinationAccountNumber: string;
  amount: number;
  currency: string;
  description: string;
  transferDate?: Date;
}

/**
 * Transfer Response
 * Contains the result of a transfer operation
 */
export interface TransferResponse {
  transactionId: string;
  status: 'success' | 'pending' | 'failed';
  message: string;
  timestamp: Date;
}

// ============================================================================
// Account Actions
// ============================================================================

/**
 * Account Action Type Union
 * Represents all possible actions that can be performed on an account
 */
export type AccountAction = 
  | { type: 'view-details'; account: Account }
  | { type: 'view-transactions'; account: Account }
  | { type: 'create-transfer'; account: Account }
  | { type: 'generate-qr'; account: Account }
  | { type: 'print-account-confirmation'; account: Account }
  | { type: 'print-balance-confirmation'; account: Account };
