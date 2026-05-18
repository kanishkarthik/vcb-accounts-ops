/**
 * Account Service Property-Based Tests
 * 
 * Property-based tests using fast-check to validate AccountService behavior
 * across a wide range of randomly generated inputs.
 * 
 * Feature: account-management
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import * as fc from 'fast-check';
import { AccountService } from './account.service';
import { Account, AccountType, AccountStatus } from '../models/account.model';

describe('AccountService - Property-Based Tests', () => {
  let service: AccountService;

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
  });

  /**
   * Property 10: Closed Account Visibility
   * 
   * **Validates: Requirements 4.6**
   * 
   * For any closed account, it should appear in the account list only if its 
   * closedDate is within 12 months from the current date.
   * 
   * This property test generates random arrays of accounts with various closed 
   * dates and verifies that filterClosedAccounts() correctly includes only 
   * accounts closed within 12 months.
   */
  describe('Property 10: Closed Account Visibility', () => {
    // Arbitrary for generating account types
    const accountTypeArb = fc.constantFrom<AccountType>(
      'current',
      'deposit',
      'loan',
      'virtual'
    );

    // Arbitrary for generating account status
    const accountStatusArb = fc.constantFrom<AccountStatus>(
      'active',
      'inactive',
      'closed'
    );

    // Arbitrary for generating dates within a reasonable range
    // Generate dates from 24 months ago to now
    const dateArb = fc.date({
      min: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000), // ~24 months ago
      max: new Date() // now
    });

    // Arbitrary for generating a single account
    const accountArb = fc.record({
      id: fc.uuid(),
      accountNumber: fc.stringMatching(/^[0-9]{10,16}$/),
      accountName: fc.string({ minLength: 5, maxLength: 50 }),
      accountAlias: fc.option(fc.string({ minLength: 3, maxLength: 30 }), { nil: undefined }),
      accountType: accountTypeArb,
      accountStatus: accountStatusArb,
      currentBalance: fc.double({ min: 0, max: 1000000000, noNaN: true }),
      availableBalance: fc.double({ min: 0, max: 1000000000, noNaN: true }),
      currency: fc.constantFrom('VND', 'USD', 'EUR', 'JPY'),
      isPrimaryCIF: fc.boolean(),
      openedDate: dateArb,
      closedDate: fc.option(dateArb, { nil: undefined }),
      lastTransactionDate: fc.option(dateArb, { nil: undefined })
    });

    // Arbitrary for generating arrays of accounts
    const accountsArrayArb = fc.array(accountArb, { minLength: 0, maxLength: 100 });

    it('should only include closed accounts if closedDate is within 12 months', () => {
      fc.assert(
        fc.property(accountsArrayArb, (accounts) => {
          const now = new Date();
          const twelveMonthsAgo = new Date(now);
          twelveMonthsAgo.setMonth(now.getMonth() - 12);

          const filtered = service.filterClosedAccounts(accounts);

          // Verify all filtered accounts meet the criteria
          for (const account of filtered) {
            if (account.accountStatus === 'closed') {
              // Closed accounts must have a closedDate within 12 months
              expect(account.closedDate).toBeDefined();
              if (account.closedDate) {
                const closedDate = new Date(account.closedDate);
                expect(closedDate.getTime()).toBeGreaterThanOrEqual(twelveMonthsAgo.getTime());
              }
            } else {
              // Non-closed accounts should always be included
              expect(['active', 'inactive']).toContain(account.accountStatus);
            }
          }

          // Verify no valid accounts were incorrectly excluded
          for (const account of accounts) {
            const isInFiltered = filtered.some(f => f.id === account.id);

            if (account.accountStatus !== 'closed') {
              // All non-closed accounts should be included
              expect(isInFiltered).toBe(true);
            } else if (account.closedDate) {
              const closedDate = new Date(account.closedDate);
              const shouldBeIncluded = closedDate >= twelveMonthsAgo;
              expect(isInFiltered).toBe(shouldBeIncluded);
            } else {
              // Closed accounts without closedDate should be excluded
              expect(isInFiltered).toBe(false);
            }
          }
        }),
        { numRuns: 100 } // Run 100 test cases with different random inputs
      );
    });

    it('should preserve all non-closed accounts regardless of dates', () => {
      fc.assert(
        fc.property(accountsArrayArb, (accounts) => {
          const filtered = service.filterClosedAccounts(accounts);
          const nonClosedAccounts = accounts.filter(a => a.accountStatus !== 'closed');

          // All non-closed accounts should be in the filtered result
          for (const account of nonClosedAccounts) {
            const isInFiltered = filtered.some(f => f.id === account.id);
            expect(isInFiltered).toBe(true);
          }

          // Count should match
          const filteredNonClosed = filtered.filter(a => a.accountStatus !== 'closed');
          expect(filteredNonClosed.length).toBe(nonClosedAccounts.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should exclude closed accounts without closedDate', () => {
      fc.assert(
        fc.property(accountsArrayArb, (accounts) => {
          const filtered = service.filterClosedAccounts(accounts);

          // Find all closed accounts without closedDate in original array
          const closedWithoutDate = accounts.filter(
            a => a.accountStatus === 'closed' && !a.closedDate
          );

          // None of these should be in the filtered result
          for (const account of closedWithoutDate) {
            const isInFiltered = filtered.some(f => f.id === account.id);
            expect(isInFiltered).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain account order for included accounts', () => {
      fc.assert(
        fc.property(accountsArrayArb, (accounts) => {
          const filtered = service.filterClosedAccounts(accounts);

          // Build a map of original indices
          const originalIndices = new Map<string, number>();
          accounts.forEach((account, index) => {
            originalIndices.set(account.id, index);
          });

          // Verify filtered accounts maintain relative order
          for (let i = 1; i < filtered.length; i++) {
            const prevIndex = originalIndices.get(filtered[i - 1].id)!;
            const currIndex = originalIndices.get(filtered[i].id)!;
            expect(currIndex).toBeGreaterThan(prevIndex);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle edge case: exactly 12 months ago', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 23 }), (hoursOffset) => {
          const now = new Date();
          const exactlyTwelveMonthsAgo = new Date(now);
          exactlyTwelveMonthsAgo.setMonth(now.getMonth() - 12);
          exactlyTwelveMonthsAgo.setHours(exactlyTwelveMonthsAgo.getHours() + hoursOffset);

          const account: Account = {
            id: '1',
            accountNumber: '1234567890',
            accountName: 'Test Account',
            accountType: 'current',
            accountStatus: 'closed',
            currentBalance: 0,
            availableBalance: 0,
            currency: 'VND',
            isPrimaryCIF: false,
            openedDate: new Date('2023-01-01'),
            closedDate: exactlyTwelveMonthsAgo
          };

          const filtered = service.filterClosedAccounts([account]);

          // Account closed exactly 12 months ago should be included
          expect(filtered.length).toBe(1);
          expect(filtered[0].id).toBe('1');
        }),
        { numRuns: 24 }
      );
    });

    it('should handle empty arrays', () => {
      const filtered = service.filterClosedAccounts([]);
      expect(filtered).toEqual([]);
    });

    it('should not mutate the original array', () => {
      fc.assert(
        fc.property(accountsArrayArb, (accounts) => {
          // Create a deep copy for comparison
          const originalCopy = JSON.parse(JSON.stringify(accounts));

          service.filterClosedAccounts(accounts);

          // Original array should remain unchanged
          expect(JSON.stringify(accounts)).toBe(JSON.stringify(originalCopy));
        }),
        { numRuns: 50 }
      );
    });
  });
});
