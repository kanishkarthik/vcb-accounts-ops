/**
 * Account Service Unit Tests
 * 
 * Tests for AccountService covering:
 * - API calls and error handling
 * - Closed account filtering (12-month rule)
 * - HTTP error scenarios
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { AccountService } from './account.service';
import { Account, AccountDetails, AccountType, TransactionPage } from '../models/account.model';
import { TransferRequest, TransferResponse } from '../models/transfer.model';

describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AccountService,
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAccountsByType', () => {
    it('should fetch accounts by type and filter closed accounts', (done) => {
      const mockType: AccountType = 'current';
      const now = new Date();
      const elevenMonthsAgo = new Date(now);
      elevenMonthsAgo.setMonth(now.getMonth() - 11);
      const thirteenMonthsAgo = new Date(now);
      thirteenMonthsAgo.setMonth(now.getMonth() - 13);

      const mockResponse = {
        accounts: [
          {
            id: '1',
            accountNumber: '1234567890',
            accountName: 'Active Account',
            accountType: 'current' as AccountType,
            accountStatus: 'active' as const,
            currentBalance: 10000,
            availableBalance: 10000,
            currency: 'VND',
            isPrimaryCIF: true,
            openedDate: new Date('2023-01-01')
          },
          {
            id: '2',
            accountNumber: '2234567890',
            accountName: 'Recently Closed',
            accountType: 'current' as AccountType,
            accountStatus: 'closed' as const,
            currentBalance: 0,
            availableBalance: 0,
            currency: 'VND',
            isPrimaryCIF: false,
            openedDate: new Date('2023-01-01'),
            closedDate: elevenMonthsAgo
          },
          {
            id: '3',
            accountNumber: '3234567890',
            accountName: 'Old Closed',
            accountType: 'current' as AccountType,
            accountStatus: 'closed' as const,
            currentBalance: 0,
            availableBalance: 0,
            currency: 'VND',
            isPrimaryCIF: false,
            openedDate: new Date('2022-01-01'),
            closedDate: thirteenMonthsAgo
          }
        ],
        totalCount: 3,
        page: 1,
        pageSize: 50,
        hasMore: false
      };

      service.getAccountsByType(mockType).subscribe(accounts => {
        expect(accounts.length).toBe(2);
        expect(accounts[0].id).toBe('1');
        expect(accounts[1].id).toBe('2');
        expect(accounts.find(a => a.id === '3')).toBeUndefined();
        done();
      });

      const req = httpMock.expectOne('/api/accounts?type=current&page=1&pageSize=50');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle network errors', (done) => {
      service.getAccountsByType('current').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Unable to connect');
          done();
        }
      });

      const req = httpMock.expectOne('/api/accounts?type=current&page=1&pageSize=50');
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Network error' });
    });
  });

  describe('getAccountDetails', () => {
    it('should fetch account details by ID', (done) => {
      const mockDetails: AccountDetails = {
        id: '1',
        accountNumber: '1234567890',
        accountName: 'Test Account',
        accountType: 'current',
        accountStatus: 'active',
        currentBalance: 10000,
        availableBalance: 10000,
        currency: 'VND',
        isPrimaryCIF: true,
        openedDate: new Date('2023-01-01'),
        cifNumber: 'CIF123',
        branchCode: 'BR001',
        branchName: 'Main Branch',
        productCode: 'PROD001',
        productName: 'Current Account',
        linkedAccounts: []
      };

      service.getAccountDetails('1').subscribe(details => {
        expect(details).toEqual(mockDetails);
        expect(details.cifNumber).toBe('CIF123');
        done();
      });

      const req = httpMock.expectOne('/api/accounts/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockDetails);
    });

    it('should handle 404 errors', (done) => {
      service.getAccountDetails('999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('not found');
          done();
        }
      });

      const req = httpMock.expectOne('/api/accounts/999');
      req.flush({ message: 'Account not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getTransactionHistory', () => {
    it('should fetch transaction history with pagination', (done) => {
      const mockTransactionPage: TransactionPage = {
        transactions: [
          {
            id: 'txn1',
            accountId: '1',
            transactionDate: new Date('2024-01-20'),
            valueDate: new Date('2024-01-20'),
            description: 'Test transaction',
            creditAmount: 1000,
            balance: 11000,
            currency: 'VND',
            referenceNumber: 'REF123',
            transactionType: 'CREDIT'
          }
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20,
        hasMore: false
      };

      const params = { page: 1, pageSize: 20, sortBy: 'transactionDate', sortOrder: 'desc' as const };

      service.getTransactionHistory('1', params).subscribe(page => {
        expect(page.transactions.length).toBe(1);
        expect(page.totalCount).toBe(1);
        done();
      });

      const req = httpMock.expectOne(
        '/api/accounts/1/transactions?page=1&pageSize=20&sortBy=transactionDate&sortOrder=desc'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTransactionPage);
    });
  });

  describe('createDomesticTransfer', () => {
    it('should create a domestic transfer', (done) => {
      const transferRequest: TransferRequest = {
        sourceAccountId: '1',
        destinationAccountNumber: '9876543210',
        amount: 1000000,
        currency: 'VND',
        description: 'Test transfer'
      };

      const mockResponse: TransferResponse = {
        transactionId: 'txn123',
        status: 'success',
        message: 'Transfer completed successfully',
        timestamp: new Date()
      };

      service.createDomesticTransfer(transferRequest).subscribe(response => {
        expect(response.status).toBe('success');
        expect(response.transactionId).toBe('txn123');
        done();
      });

      const req = httpMock.expectOne('/api/transfers/domestic');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(transferRequest);
      req.flush(mockResponse);
    });

    it('should handle validation errors', (done) => {
      const transferRequest: TransferRequest = {
        sourceAccountId: '1',
        destinationAccountNumber: 'invalid',
        amount: -100,
        currency: 'VND',
        description: ''
      };

      service.createDomesticTransfer(transferRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Invalid request');
          done();
        }
      });

      const req = httpMock.expectOne('/api/transfers/domestic');
      req.flush({ message: 'Invalid transfer data' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('generateAccountQRCode', () => {
    it('should generate QR code for account', (done) => {
      const mockResponse = {
        qrCodeData: 'base64-encoded-data',
        accountNumber: '1234567890',
        accountName: 'Test Account'
      };

      service.generateAccountQRCode('1').subscribe(qrCode => {
        expect(qrCode).toBe('base64-encoded-data');
        done();
      });

      const req = httpMock.expectOne('/api/accounts/1/qr-code');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('generateAccountConfirmation', () => {
    it('should generate account confirmation PDF', (done) => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.generateAccountConfirmation('1').subscribe(blob => {
        expect(blob.type).toBe('application/pdf');
        done();
      });

      const req = httpMock.expectOne('/api/accounts/1/confirmation');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('generateBalanceConfirmation', () => {
    it('should generate balance confirmation PDF', (done) => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.generateBalanceConfirmation('1').subscribe(blob => {
        expect(blob.type).toBe('application/pdf');
        done();
      });

      const req = httpMock.expectOne('/api/accounts/1/balance-confirmation');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('filterClosedAccounts', () => {
    it('should keep active accounts', () => {
      const accounts: Account[] = [
        {
          id: '1',
          accountNumber: '1234567890',
          accountName: 'Active Account',
          accountType: 'current',
          accountStatus: 'active',
          currentBalance: 10000,
          availableBalance: 10000,
          currency: 'VND',
          isPrimaryCIF: true,
          openedDate: new Date('2023-01-01')
        }
      ];

      const filtered = service.filterClosedAccounts(accounts);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should keep closed accounts within 12 months', () => {
      const now = new Date();
      const elevenMonthsAgo = new Date(now);
      elevenMonthsAgo.setMonth(now.getMonth() - 11);

      const accounts: Account[] = [
        {
          id: '1',
          accountNumber: '1234567890',
          accountName: 'Recently Closed',
          accountType: 'current',
          accountStatus: 'closed',
          currentBalance: 0,
          availableBalance: 0,
          currency: 'VND',
          isPrimaryCIF: false,
          openedDate: new Date('2023-01-01'),
          closedDate: elevenMonthsAgo
        }
      ];

      const filtered = service.filterClosedAccounts(accounts);
      expect(filtered.length).toBe(1);
    });

    it('should exclude closed accounts older than 12 months', () => {
      const now = new Date();
      const thirteenMonthsAgo = new Date(now);
      thirteenMonthsAgo.setMonth(now.getMonth() - 13);

      const accounts: Account[] = [
        {
          id: '1',
          accountNumber: '1234567890',
          accountName: 'Old Closed',
          accountType: 'current',
          accountStatus: 'closed',
          currentBalance: 0,
          availableBalance: 0,
          currency: 'VND',
          isPrimaryCIF: false,
          openedDate: new Date('2022-01-01'),
          closedDate: thirteenMonthsAgo
        }
      ];

      const filtered = service.filterClosedAccounts(accounts);
      expect(filtered.length).toBe(0);
    });

    it('should exclude closed accounts without closedDate', () => {
      const accounts: Account[] = [
        {
          id: '1',
          accountNumber: '1234567890',
          accountName: 'Closed No Date',
          accountType: 'current',
          accountStatus: 'closed',
          currentBalance: 0,
          availableBalance: 0,
          currency: 'VND',
          isPrimaryCIF: false,
          openedDate: new Date('2023-01-01')
        }
      ];

      const filtered = service.filterClosedAccounts(accounts);
      expect(filtered.length).toBe(0);
    });
  });

  describe('handleApiError', () => {
    it('should redirect to login on 401 error', (done) => {
      service.getAccountsByType('current').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Session expired');
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
          done();
        }
      });

      const req = httpMock.expectOne('/api/accounts?type=current&page=1&pageSize=50');
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 403 forbidden error', (done) => {
      service.getAccountsByType('current').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('permission');
          done();
        }
      });

      const req = httpMock.expectOne('/api/accounts?type=current&page=1&pageSize=50');
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 500 server error', (done) => {
      service.getAccountsByType('current').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Server error');
          done();
        }
      });

      const req = httpMock.expectOne('/api/accounts?type=current&page=1&pageSize=50');
      req.flush({ message: 'Internal error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
