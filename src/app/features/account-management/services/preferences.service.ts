/**
 * Account Management System - Preferences Service
 * 
 * This service manages user preferences persistence using localStorage.
 * Supports requirements: 14.1, 14.2, 14.3, 14.4
 */

import { Injectable } from '@angular/core';
import { UserPreferences } from '../models/preferences.model';
import { AccountType } from '../models/account.model';

/**
 * PreferencesService
 * 
 * Handles loading, saving, and resetting user preferences.
 * Preferences are stored in localStorage for persistence across sessions.
 */
@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private readonly STORAGE_KEY = 'account-management-preferences';

  /**
   * Load user preferences from localStorage
   * If no preferences exist, returns default preferences
   * 
   * @returns UserPreferences object
   */
  loadPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert columnWidths from object to Map
        if (parsed.columnWidths) {
          parsed.columnWidths = new Map(Object.entries(parsed.columnWidths));
        }
        return parsed;
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
    
    return this.getDefaultPreferences();
  }

  /**
   * Save user preferences to localStorage
   * 
   * @param preferences - UserPreferences object to save
   */
  savePreferences(preferences: UserPreferences): void {
    try {
      // Convert Map to object for JSON serialization
      const toSave = {
        ...preferences,
        columnWidths: Object.fromEntries(preferences.columnWidths)
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  /**
   * Reset preferences to default values
   * 
   * @returns Default UserPreferences object
   */
  resetToDefaults(): UserPreferences {
    const defaults = this.getDefaultPreferences();
    this.savePreferences(defaults);
    return defaults;
  }

  /**
   * Get default preferences
   * 
   * @returns Default UserPreferences object
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      visibleColumns: [
        'isPrimaryCIF',
        'accountNumber',
        'accountName',
        'accountAlias',
        'accountStatus',
        'currentBalance',
        'availableBalance',
        'currency'
      ],
      columnWidths: new Map<string, number>([
        ['isPrimaryCIF', 50],
        ['accountNumber', 150],
        ['accountName', 200],
        ['accountAlias', 150],
        ['accountStatus', 100],
        ['currentBalance', 150],
        ['availableBalance', 150],
        ['currency', 100]
      ]),
      defaultCurrency: 'VND',
      defaultAccountType: 'current' as AccountType,
      rowsPerPage: 50,
      dateFormat: 'dd/MM/yyyy',
      numberFormat: '1.2-2'
    };
  }
}
