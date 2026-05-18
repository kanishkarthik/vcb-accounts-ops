/**
 * Account Management System - Currency Service
 * 
 * This service handles currency conversion and formatting.
 * Supports requirements: 4.2, 12.1
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * CurrencyService
 * 
 * Handles currency conversion to VND and currency formatting.
 * This is a placeholder implementation that will be fully implemented later.
 */
@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  // Exchange rates to VND (placeholder values)
  private exchangeRates = new Map<string, number>([
    ['VND', 1],
    ['USD', 25000],
    ['EUR', 27000],
    ['JPY', 170],
    ['CNY', 3500]
  ]);

  /**
   * Convert an amount from a given currency to VND
   * 
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency code
   * @returns Converted amount in VND
   */
  convertToVND(amount: number, fromCurrency: string): number {
    const rate = this.exchangeRates.get(fromCurrency) || 1;
    return amount * rate;
  }

  /**
   * Format a currency amount with appropriate symbols and formatting
   * 
   * @param amount - Amount to format
   * @param currency - Currency code
   * @param locale - Locale for formatting (default: 'vi-VN')
   * @returns Formatted currency string
   */
  formatCurrency(amount: number, currency: string, locale: string = 'vi-VN'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get the exchange rate for a currency to VND
   * 
   * @param currency - Currency code
   * @returns Observable of exchange rate
   */
  getExchangeRate(currency: string): Observable<number> {
    return of(this.exchangeRates.get(currency) || 1);
  }

  /**
   * Refresh exchange rates from API (placeholder)
   * 
   * @returns Observable of exchange rates map
   */
  refreshExchangeRates(): Observable<Map<string, number>> {
    // TODO: Implement API call to fetch latest exchange rates
    return of(this.exchangeRates);
  }
}
