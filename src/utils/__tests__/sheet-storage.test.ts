import {
  getSelectedSheetId,
  getSelectedSheetName,
  setSelectedSheet,
  clearSelectedSheet,
  migrateLegacySheetStorage,
} from '../sheet-storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Sheet Storage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('getSelectedSheetId', () => {
    it('should return null when no sheet is stored', () => {
      const result = getSelectedSheetId('google');
      expect(result).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedSheetId_google');
    });

    it('should return stored sheet ID for provider', () => {
      localStorageMock.setItem('selectedSheetId_google', 'sheet123');
      const result = getSelectedSheetId('google');
      expect(result).toBe('sheet123');
    });

    it('should return different IDs for different providers', () => {
      localStorageMock.setItem('selectedSheetId_google', 'googleSheet123');
      localStorageMock.setItem('selectedSheetId_azure-ad', 'excelSheet456');

      expect(getSelectedSheetId('google')).toBe('googleSheet123');
      expect(getSelectedSheetId('azure-ad')).toBe('excelSheet456');
    });
  });

  describe('getSelectedSheetName', () => {
    it('should return null when no sheet name is stored', () => {
      const result = getSelectedSheetName('azure-ad');
      expect(result).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedSheetName_azure-ad');
    });

    it('should return stored sheet name for provider', () => {
      localStorageMock.setItem('selectedSheetName_azure-ad', 'My Excel Sheet');
      const result = getSelectedSheetName('azure-ad');
      expect(result).toBe('My Excel Sheet');
    });
  });

  describe('setSelectedSheet', () => {
    it('should store both ID and name for provider', () => {
      const sheet = { id: 'sheet123', name: 'Test Sheet' };
      setSelectedSheet('google', sheet);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetId_google', 'sheet123');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetName_google', 'Test Sheet');
    });

    it('should store different sheets for different providers', () => {
      const googleSheet = { id: 'google123', name: 'Google Sheet' };
      const excelSheet = { id: 'excel456', name: 'Excel Sheet' };

      setSelectedSheet('google', googleSheet);
      setSelectedSheet('azure-ad', excelSheet);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetId_google', 'google123');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetName_google', 'Google Sheet');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetId_azure-ad', 'excel456');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetName_azure-ad', 'Excel Sheet');
    });
  });

  describe('clearSelectedSheet', () => {
    it('should remove both ID and name for provider', () => {
      clearSelectedSheet('google');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedSheetId_google');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedSheetName_google');
    });
  });

  describe('migrateLegacySheetStorage', () => {
    it('should migrate legacy storage to provider-specific storage', () => {
      // Setup legacy data
      localStorageMock.setItem('selectedSheetId', 'legacySheet123');
      localStorageMock.setItem('selectedSheetName', 'Legacy Sheet');

      migrateLegacySheetStorage('google');

      // Should set provider-specific keys
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetId_google', 'legacySheet123');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetName_google', 'Legacy Sheet');

      // Should remove legacy keys
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedSheetId');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedSheetName');
    });

    it('should not migrate when provider-specific data already exists', () => {
      // Setup legacy data and existing provider data
      localStorageMock.setItem('selectedSheetId', 'legacySheet123');
      localStorageMock.setItem('selectedSheetName', 'Legacy Sheet');
      localStorageMock.setItem('selectedSheetId_google', 'existingSheet456');

      migrateLegacySheetStorage('google');

      // Should not overwrite existing provider-specific data
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('selectedSheetId_google', 'legacySheet123');

      // Should still remove legacy keys
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedSheetId');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedSheetName');
    });

    it('should do nothing when no legacy data exists', () => {
      migrateLegacySheetStorage('google');

      // Should not add or remove anything
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it('should not migrate partial legacy data', () => {
      // Only sheet ID, no sheet name
      localStorageMock.setItem('selectedSheetId', 'legacySheet123');

      migrateLegacySheetStorage('google');

      // Should not migrate incomplete data
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('selectedSheetId_google', 'legacySheet123');
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('provider key generation', () => {
    it('should generate correct keys for different providers', () => {
      setSelectedSheet('google', { id: 'test', name: 'test' });
      setSelectedSheet('azure-ad', { id: 'test', name: 'test' });
      setSelectedSheet('custom-provider', { id: 'test', name: 'test' });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetId_google', 'test');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetName_google', 'test');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetId_azure-ad', 'test');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetName_azure-ad', 'test');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetId_custom-provider', 'test');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedSheetName_custom-provider', 'test');
    });
  });
});