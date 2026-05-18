/**
 * Account Management Component - Unit Tests
 * 
 * Tests for the AccountManagementComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AccountManagementComponent } from './account-management.component';
import { AccountService } from './services/account.service';
import { CurrencyService } from './services/currency.service';
import { ExportService } from './services/export.service';
import { PreferencesService } from './services/preferences.service';
import { PrintService } from './services/print.service';

import { Account, AccountType } from './models/account.model';
import { UserPreferences } from './models/preferences.model';

describe('AccountManagementComponent', () => {
  let component: AccountManagementComponent;
  let fixture: ComponentFixture<AccountManagementComponent>;
  let accountService: jasmine.SpyObj<AccountService>;
  let currencyService: jasmine.SpyObj<CurrencyService>;
  let exportService: jasmine.SpyObj<ExportService>;
  let preferencesService: jasmine.SpyObj<PreferencesService>;
  let printService: jasmine.SpyObj<PrintService>;

  const mockAccounts: Account[] = [
    {
      id: '1',
      accountNumber: '1234567890',
      accountName: 'Test Account 1',
      accountAlias: 'Test Alias 1',
      accountType: 'current',
      accountStatus: 'active',
      currentBalance: 10000,
      availableBalance: 9500,
      currency: 'VND',
      isPrimaryCIF: true,
      openedDate: new Date('2023-01-01')
    },
    {
      id: '2',
      accountNumber: '0987654321',
      accountName: 'Test Account 2',
      accountAlias: 'Test Alias 2',
      accountType: 'current',
      accountStatus: 'active',
      currentBalance: 5000,
      availableBalance: 5000,
      currency: 'USD',
      isPrimaryCIF: false,
      openedDate: new Date('2023-02-01')
    }
  ];

  const mockPreferences: UserPreferences = {
    visibleColumns: ['accountNumber', 'accountName', 'currentBalance'],
    columnWidths: new Map([['accountNumber', 150]]),
    defaultCurrency: 'VND',
    defaultAccountType: 'current',
    rowsPerPage: 50,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: '1.2-2'
  };

  beforeEach(async () => {
    // Create spy objects for services
    const accountServiceSpy = jasmine.createSpyObj('AccountService', [
      'getAccountsByType',
      'getAccountDetails',
      'generateAccountQRCode',
      'generateAccountConfirmation',
      'generateBalanceConfirmation'
    ]);

    const currencyServiceSpy = jasmine.createSpyObj('CurrencyService', [
      'convertToVND',
      'formatCurrency'
    ]);

    const exportServiceSpy = jasmine.createSpyObj('ExportService', [
      'exportToCSV',
      'exportToExcel'
    ]);

    const preferencesServiceSpy = jasmine.createSpyObj('PreferencesService', [
      'loadPreferences',
      'savePreferences',
      'resetToDefaults'
    ]);

    const printServiceSpy = jasmine.createSpyObj('PrintService', [
      'printAccountConfirmation',
      'printBalanceConfirmation',
      'printQRCode'
    ]);

    // Set up default return values
    accountServiceSpy.getAccountsByType.and.returnValue(of(mockAccounts));
    currencyServiceSpy.convertToVND.and.returnValue(10000);
    preferencesServiceSpy.loadPreferences.and.returnValue(mockPreferences);

    await TestBed.configureTestingModule({
      imports: [AccountManagementComponent],
      providers: [
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: CurrencyService, useValue: currencyServiceSpy },
        { provide: ExportService, useValue: exportServiceSpy },
        { provide: PreferencesService, useValue: preferencesServiceSpy },
        { provide: PrintService, useValue: printServiceSpy }
      ]
    }).compileComponents();

    accountService = TestBed.inject(AccountService) as jasmine.SpyObj<AccountService>;
    currencyService = TestBed.inject(CurrencyService) as jasmine.SpyObj<CurrencyService>;
    exportService = TestBed.inject(ExportService) as jasmine.SpyObj<ExportService>;
    preferencesService = TestBed.inject(PreferencesService) as jasmine.SpyObj<PreferencesService>;
    printService = TestBed.inject(PrintService) as jasmine.SpyObj<PrintService>;

    fixture = TestBed.createComponent(AccountManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load preferences and initial accounts', () => {
      fixture.detectChanges(); // Triggers ngOnInit

      expect(preferencesService.loadPreferences).toHaveBeenCalled();
      expect(accountService.getAccountsByType).toHaveBeenCalledWith('current');
      expect(component.accounts().length).toBe(2);
    });

    it('should use default account type from preferences', () => {
      const customPrefs = { ...mockPreferences, defaultAccountType: 'deposit' as AccountType };
      preferencesService.loadPreferences.and.returnValue(customPrefs);

      fixture.detectChanges();

      expect(accountService.getAccountsByType).toHaveBeenCalledWith('deposit');
    });
  });

  describe('onTabChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update selected account type', () => {
      component.onTabChange('deposit');

      expect(component.selectedAccountType()).toBe('deposit');
    });

    it('should load accounts for the new tab', () => {
      accountService.getAccountsByType.calls.reset();

      component.onTabChange('loan');

      expect(accountService.getAccountsByType).toHaveBeenCalledWith('loan');
    });

    it('should preserve search filters when switching tabs', () => {
      const filters = { accountNumber: '1234' };
      component.onSearchChange(filters);

      component.onTabChange('deposit');

      expect(component.searchFilters()).toEqual(filters);
    });
  });

  describe('onSearchChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update search filters', () => {
      const filters = { accountNumber: '1234' };

      component.onSearchChange(filters);

      expect(component.searchFilters()).toEqual(filters);
    });

    it('should filter accounts by account number', () => {
      component.onSearchChange({ accountNumber: '1234' });

      expect(component.filteredAccounts().length).toBe(1);
      expect(component.filteredAccounts()[0].accountNumber).toBe('1234567890');
    });

    it('should filter accounts by account name (case-insensitive)', () => {
      component.onSearchChange({ accountName: 'test account 2' });

      expect(component.filteredAccounts().length).toBe(1);
      expect(component.filteredAccounts()[0].accountName).toBe('Test Account 2');
    });

    it('should filter accounts by currency', () => {
      component.onSearchChange({ currency: 'USD' });

      expect(component.filteredAccounts().length).toBe(1);
      expect(component.filteredAccounts()[0].currency).toBe('USD');
    });

    it('should apply multiple filters with AND logic', () => {
      component.onSearchChange({ 
        accountName: 'test',
        currency: 'USD'
      });

      expect(component.filteredAccounts().length).toBe(1);
      expect(component.filteredAccounts()[0].accountNumber).toBe('0987654321');
    });

    it('should show all accounts when filters are cleared', () => {
      component.onSearchChange({ accountNumber: '1234' });
      expect(component.filteredAccounts().length).toBe(1);

      component.onSearchChange({});

      expect(component.filteredAccounts().length).toBe(2);
    });
  });

  describe('onActionTriggered', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle view-details action', () => {
      const account = mockAccounts[0];

      component.onActionTriggered({ type: 'view-details', account });

      expect(component.selectedAccount()).toBe(account);
      expect(component.modals().accountDetails).toBe(true);
    });

    it('should handle view-transactions action', () => {
      const account = mockAccounts[0];

      component.onActionTriggered({ type: 'view-transactions', account });

      expect(component.selectedAccount()).toBe(account);
      expect(component.modals().transactionHistory).toBe(true);
    });

    it('should handle create-transfer action', () => {
      const account = mockAccounts[0];

      component.onActionTriggered({ type: 'create-transfer', account });

      expect(component.selectedAccount()).toBe(account);
      expect(component.modals().transfer).toBe(true);
    });

    it('should handle generate-qr action', () => {
      const account = mockAccounts[0];
      accountService.generateAccountQRCode.and.returnValue(of('qr-code-data'));

      component.onActionTriggered({ type: 'generate-qr', account });

      expect(component.selectedAccount()).toBe(account);
      expect(component.modals().qrCode).toBe(true);
      expect(accountService.generateAccountQRCode).toHaveBeenCalledWith(account.id);
    });

    it('should handle print-account-confirmation action', () => {
      const account = mockAccounts[0];

      component.onActionTriggered({ type: 'print-account-confirmation', account });

      expect(printService.printAccountConfirmation).toHaveBeenCalledWith(account);
    });

    it('should handle print-balance-confirmation action', () => {
      const account = mockAccounts[0];

      component.onActionTriggered({ type: 'print-balance-confirmation', account });

      expect(printService.printBalanceConfirmation).toHaveBeenCalledWith(account);
    });
  });

  describe('balance calculations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should calculate balance summary by currency', () => {
      const summary = component.balanceSummary();

      expect(summary.get('VND')).toBe(10000);
      expect(summary.get('USD')).toBe(5000);
    });

    it('should calculate total VND balance', () => {
      currencyService.convertToVND.and.callFake((amount, currency) => {
        if (currency === 'VND') return amount;
        if (currency === 'USD') return amount * 25000;
        return amount;
      });

      const total = component.totalVNDBalance();

      expect(total).toBe(10000 + (5000 * 25000));
    });
  });

  describe('error handling', () => {
    it('should handle account loading errors', () => {
      const errorMessage = 'Failed to load accounts';
      accountService.getAccountsByType.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      fixture.detectChanges();

      expect(component.error()).toBe(errorMessage);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle QR code generation errors', () => {
      fixture.detectChanges();
      const errorMessage = 'Failed to generate QR code';
      accountService.generateAccountQRCode.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      component.onActionTriggered({ 
        type: 'generate-qr', 
        account: mockAccounts[0] 
      });

      expect(component.error()).toBe(errorMessage);
    });
  });

  describe('export functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should export to CSV with visible columns', () => {
      component.exportToCSV();

      expect(exportService.exportToCSV).toHaveBeenCalledWith(
        mockAccounts,
        mockPreferences.visibleColumns
      );
    });

    it('should export to Excel with visible columns', () => {
      component.exportToExcel();

      expect(exportService.exportToExcel).toHaveBeenCalledWith(
        mockAccounts,
        mockPreferences.visibleColumns,
        jasmine.any(String)
      );
    });
  });

  describe('modal management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close all modals', () => {
      // Open a modal first
      component.onActionTriggered({ 
        type: 'view-details', 
        account: mockAccounts[0] 
      });
      expect(component.modals().accountDetails).toBe(true);

      // Close modals
      component.closeModals();

      expect(component.modals().accountDetails).toBe(false);
      expect(component.modals().transactionHistory).toBe(false);
      expect(component.modals().qrCode).toBe(false);
      expect(component.modals().transfer).toBe(false);
      expect(component.selectedAccount()).toBeNull();
    });
  });
});
