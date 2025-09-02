/**
 * Utility functions for managing provider-specific sheet storage in localStorage
 */

export type SheetProvider = 'google' | 'azure-ad' | string;

/**
 * Gets the localStorage key for a specific provider and data type
 */
function getProviderStorageKey(provider: SheetProvider, dataType: 'sheetId' | 'sheetName'): string {
  return `selectedSheet${dataType === 'sheetId' ? 'Id' : 'Name'}_${provider}`;
}

/**
 * Gets the selected sheet ID for a specific provider
 */
export function getSelectedSheetId(provider: SheetProvider): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(getProviderStorageKey(provider, 'sheetId'));
}

/**
 * Gets the selected sheet name for a specific provider
 */
export function getSelectedSheetName(provider: SheetProvider): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(getProviderStorageKey(provider, 'sheetName'));
}

/**
 * Sets the selected sheet for a specific provider
 */
export function setSelectedSheet(provider: SheetProvider, sheet: { id: string; name: string }): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(getProviderStorageKey(provider, 'sheetId'), sheet.id);
  localStorage.setItem(getProviderStorageKey(provider, 'sheetName'), sheet.name);
}

/**
 * Clears the selected sheet for a specific provider
 */
export function clearSelectedSheet(provider: SheetProvider): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(getProviderStorageKey(provider, 'sheetId'));
  localStorage.removeItem(getProviderStorageKey(provider, 'sheetName'));
}

/**
 * Migrates legacy localStorage keys to provider-specific keys
 * This helps with backward compatibility
 */
export function migrateLegacySheetStorage(defaultProvider: SheetProvider): void {
  if (typeof window === 'undefined') return;
  
  const legacySheetId = localStorage.getItem('selectedSheetId');
  const legacySheetName = localStorage.getItem('selectedSheetName');
  
  if (legacySheetId && legacySheetName) {
    // Only migrate if there's no existing provider-specific data
    const existingProviderId = getSelectedSheetId(defaultProvider);
    
    if (!existingProviderId) {
      setSelectedSheet(defaultProvider, { id: legacySheetId, name: legacySheetName });
    }
    
    // Remove legacy keys
    localStorage.removeItem('selectedSheetId');
    localStorage.removeItem('selectedSheetName');
  }
}