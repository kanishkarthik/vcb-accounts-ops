/**
 * Account Management System - Main Container Component
 * 
 * This is the root container component that orchestrates the entire account management feature.
 * It manages state, handles user interactions, and coordinates between child components and services.
 * 
 * Requirements: 1.1, 1.2, 1.3, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1, 14.1
 */

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@vcb/shared-libs';

import { AccountService } from './services/account.service';
import { CurrencyService } from './services/currency.service';
import { ExportService } from './services/export.service';
import { PreferencesService } from './services/preferences.service';
import { PrintService } from './services/print.service';

import { Account, AccountType, SearchFilters } from './models/account.model';
import { AccountAction } from './models/transfer.model';
import { UserPreferences } from './models/preferences.model';
import { AccountManagementState, createInitialState } from './models/state.model';

/**
 * AccountManagementComponent
 * 
 * Main container component for the Account Management feature.
 * Uses Angular Signals for reactive state management.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1, 14.1**
 */
@Component({
  selector: 'app-account-management',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './account-management.component.html',
  styleUrl: './account-management.component.scss'
})
export class AccountManagementComponent implements OnInit {
  // ============================================================================
  // Service Injection
  // ============================================================================

  private readonly accountService = inject(AccountService);
  private readonly currencyService = inject(CurrencyService);
  private readonly exportService = inject(ExportService);
  private readonly preferencesService = inject(PreferencesService);
  private readonly printService = inject(PrintService);

  // ============================================================================
  // State Management with Signals
  // ============================================================================

  /**
   * User preferences loaded from localStorage
   */
  protected readonly preferences = signal<UserPreferences>(
    this.preferencesService.loadPreferences()
  );

  /**
   * Main application state
   */
  private readonly state = signal<AccountManagementState>(
    createInitialState(this.preferences().defaultAccountType)
  );

  // ============================================================================
  // Computed Signals for Derived State
  // ============================================================================

  /**
   * Currently selected account type
   */
  readonly selectedAccountType = computed(() => 
    this.state().selectedAccountType
  );

  /**
   * Accounts for the current tab
   */
  readonly accounts = computed(() => 
    this.state().accounts
  );

  /**
   * Filtered accounts based on search filters
   */
  readonly filteredAccounts = computed(() => 
    this.state().filteredAccounts
  );

  /**
   * Current search filters
   */
  readonly searchFilters = computed(() => 
    this.state().searchFilters
  );

  /**
   * Loading state
   */
  readonly isLoading = computed(() => 
    this.state().isLoading
  );

  /**
   * Error state
   */
  readonly error = computed(() => 
    this.state().error
  );

  /**
   * Currently selected account
   */
  readonly selectedAccount = computed(() => 
    this.state().selectedAccount
  );

  /**
   * Modal visibility states
   */
  readonly modals = computed(() => 
    this.state().modals
  );

  /**
   * Balance summary by currency
   */
  readonly balanceSummary = computed(() => {
    const accounts = this.filteredAccounts();
    const summary = new Map<string, number>();

    accounts.forEach(account => {
      const current = summary.get(account.currency) || 0;
      summary.set(account.currency, current + account.currentBalance);
    });

    return summary;
  });

  /**
   * Total balance converted to VND
   */
  readonly totalVNDBalance = computed(() => {
    const accounts = this.filteredAccounts();
    return accounts.reduce((total, account) => {
      return total + this.currencyService.convertToVND(
        account.currentBalance,
        account.currency
      );
    }, 0);
  });

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================

  /**
   * Initialize component
   * Load initial data and preferences
   * 
   * **Validates: Requirements 1.1, 14.1**
   */
  ngOnInit(): void {
    // Load user preferences
    const prefs = this.preferencesService.loadPreferences();
    this.preferences.set(prefs);

    // Load accounts for the default account type
    this.loadAccounts(prefs.defaultAccountType);
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle tab change event
   * Load accounts for the selected account type
   * 
   * **Validates: Requirements 1.2, 1.3**
   * 
   * @param accountType - The account type to switch to
   */
  onTabChange(accountType: AccountType): void {
    // Update selected account type
    this.updateState({
      selectedAccountType: accountType
    });

    // Load accounts for the new tab
    this.loadAccounts(accountType);
  }

  /**
   * Handle search filter changes
   * Apply filters to the current account list
   * 
   * **Validates: Requirements 2.2, 2.3, 2.4**
   * 
   * @param filters - Search filter values
   */
  onSearchChange(filters: SearchFilters): void {
    // Update search filters in state
    this.updateState({
      searchFilters: filters
    });

    // Apply filters to accounts
    this.applyFilters();
  }

  /**
   * Handle account action events
   * Dispatch actions to appropriate handlers
   * 
   * **Validates: Requirements 5.1, 6.1, 7.1, 8.1, 10.1, 11.1**
   * 
   * @param action - Account action to perform
   */
  onActionTriggered(action: AccountAction): void {
    switch (action.type) {
      case 'view-details':
        this.handleViewDetails(action.account);
        break;

      case 'view-transactions':
        this.handleViewTransactions(action.account);
        break;

      case 'create-transfer':
        this.handleCreateTransfer(action.account);
        break;

      case 'generate-qr':
        this.handleGenerateQR(action.account);
        break;

      case 'print-account-confirmation':
        this.handlePrintAccountConfirmation(action.account);
        break;

      case 'print-balance-confirmation':
        this.handlePrintBalanceConfirmation(action.account);
        break;

      default:
        console.warn('Unknown action type:', action);
    }
  }

  // ============================================================================
  // Action Handlers
  // ============================================================================

  /**
   * Handle view account details action
   * 
   * **Validates: Requirement 5.1**
   * 
   * @param account - Account to view details for
   */
  private handleViewDetails(account: Account): void {
    this.updateState({
      selectedAccount: account,
      modals: {
        ...this.state().modals,
        accountDetails: true
      }
    });
  }

  /**
   * Handle view transaction history action
   * 
   * **Validates: Requirement 6.1**
   * 
   * @param account - Account to view transactions for
   */
  private handleViewTransactions(account: Account): void {
    this.updateState({
      selectedAccount: account,
      modals: {
        ...this.state().modals,
        transactionHistory: true
      }
    });
  }

  /**
   * Handle create transfer action
   * 
   * **Validates: Requirement 7.1**
   * 
   * @param account - Source account for transfer
   */
  private handleCreateTransfer(account: Account): void {
    this.updateState({
      selectedAccount: account,
      modals: {
        ...this.state().modals,
        transfer: true
      }
    });
  }

  /**
   * Handle generate QR code action
   * 
   * **Validates: Requirement 8.1**
   * 
   * @param account - Account to generate QR code for
   */
  private handleGenerateQR(account: Account): void {
    this.updateState({
      selectedAccount: account,
      modals: {
        ...this.state().modals,
        qrCode: true
      }
    });

    // Generate QR code
    this.accountService.generateAccountQRCode(account.id).subscribe({
      next: (qrCodeData) => {
        console.log('QR code generated successfully');
        // QR code data will be used by the modal component
      },
      error: (error) => {
        this.updateState({
          error: error.message
        });
      }
    });
  }

  /**
   * Handle print account confirmation action
   * 
   * **Validates: Requirement 10.1**
   * 
   * @param account - Account to print confirmation for
   */
  private handlePrintAccountConfirmation(account: Account): void {
    this.printService.printAccountConfirmation(account);
  }

  /**
   * Handle print balance confirmation action
   * 
   * **Validates: Requirement 11.1**
   * 
   * @param account - Account to print balance confirmation for
   */
  private handlePrintBalanceConfirmation(account: Account): void {
    this.printService.printBalanceConfirmation(account);
  }

  // ============================================================================
  // Data Loading
  // ============================================================================

  /**
   * Load accounts for a specific account type
   * 
   * **Validates: Requirement 1.2**
   * 
   * @param accountType - Account type to load
   */
  private loadAccounts(accountType: AccountType): void {
    // Set loading state
    this.updateState({
      isLoading: true,
      error: null
    });

    // Fetch accounts from service
    this.accountService.getAccountsByType(accountType).subscribe({
      next: (accounts) => {
        this.updateState({
          accounts,
          filteredAccounts: accounts,
          isLoading: false
        });

        // Apply any existing filters
        this.applyFilters();
      },
      error: (error) => {
        this.updateState({
          isLoading: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Apply search filters to the current account list
   * 
   * **Validates: Requirements 2.2, 2.3, 2.4**
   */
  private applyFilters(): void {
    const filters = this.state().searchFilters;
    const accounts = this.state().accounts;

    // If no filters, show all accounts
    if (Object.keys(filters).length === 0 || 
        Object.values(filters).every(v => !v)) {
      this.updateState({
        filteredAccounts: accounts
      });
      return;
    }

    // Apply filters
    const filtered = accounts.filter(account => {
      // Account number filter (partial match, case-insensitive)
      if (filters.accountNumber && 
          !account.accountNumber.toLowerCase().includes(filters.accountNumber.toLowerCase())) {
        return false;
      }

      // Account name filter (partial match, case-insensitive)
      if (filters.accountName && 
          !account.accountName.toLowerCase().includes(filters.accountName.toLowerCase())) {
        return false;
      }

      // Account alias filter (partial match, case-insensitive)
      if (filters.accountAlias && account.accountAlias &&
          !account.accountAlias.toLowerCase().includes(filters.accountAlias.toLowerCase())) {
        return false;
      }

      // Currency filter (exact match)
      if (filters.currency && account.currency !== filters.currency) {
        return false;
      }

      // Status filter (exact match)
      if (filters.status && account.accountStatus !== filters.status) {
        return false;
      }

      return true;
    });

    this.updateState({
      filteredAccounts: filtered
    });
  }

  // ============================================================================
  // State Update Helper
  // ============================================================================

  /**
   * Update state with partial state object
   * 
   * @param partialState - Partial state to merge with current state
   */
  updateState(partialState: Partial<AccountManagementState>): void {
    this.state.update(current => ({
      ...current,
      ...partialState
    }));
  }

  // ============================================================================
  // Public Methods for Template
  // ============================================================================

  /**
   * Close all modals
   */
  closeModals(): void {
    this.updateState({
      modals: {
        accountDetails: false,
        transactionHistory: false,
        qrCode: false,
        transfer: false,
        preferences: false
      },
      selectedAccount: null
    });
  }

  /**
   * Export current filtered accounts to CSV
   * 
   * **Validates: Requirement 9.1**
   */
  exportToCSV(): void {
    const accounts = this.filteredAccounts();
    const visibleColumns = this.preferences().visibleColumns;
    this.exportService.exportToCSV(accounts, visibleColumns);
  }

  /**
   * Export current filtered accounts to Excel
   * 
   * **Validates: Requirement 9.1**
   */
  exportToExcel(): void {
    const accounts = this.filteredAccounts();
    const visibleColumns = this.preferences().visibleColumns;
    const filename = `accounts_${this.selectedAccountType()}_${new Date().toISOString()}`;
    this.exportService.exportToExcel(accounts, visibleColumns, filename);
  }

  /**
   * Clear all search filters
   * 
   * **Validates: Requirement 2.5**
   */
  clearFilters(): void {
    this.onSearchChange({});
  }

  /**
   * Refresh accounts for current tab
   */
  refreshAccounts(): void {
    this.loadAccounts(this.selectedAccountType());
  }

  // ============================================================================
  // Template Helper Methods
  // ============================================================================

  /**
   * Update account number filter
   */
  updateAccountNumberFilter(value: string): void {
    this.onSearchChange({
      ...this.searchFilters(),
      accountNumber: value
    });
  }

  /**
   * Update account name filter
   */
  updateAccountNameFilter(value: string): void {
    this.onSearchChange({
      ...this.searchFilters(),
      accountName: value
    });
  }

  /**
   * Update account alias filter
   */
  updateAccountAliasFilter(value: string): void {
    this.onSearchChange({
      ...this.searchFilters(),
      accountAlias: value
    });
  }

  /**
   * Update currency filter
   */
  updateCurrencyFilter(value: string): void {
    this.onSearchChange({
      ...this.searchFilters(),
      currency: value
    });
  }

  /**
   * Update status filter
   */
  updateStatusFilter(value: any): void {
    this.onSearchChange({
      ...this.searchFilters(),
      status: value
    });
  }
}
