import { generateUID, formatDate, getMonthSheetName, isGoogleSheetsId } from '../common'

describe('Common utilities', () => {
  describe('generateUID', () => {
    it('should generate a unique ID', () => {
      const uid1 = generateUID()
      const uid2 = generateUID()
      
      expect(uid1).toBeDefined()
      expect(uid2).toBeDefined()
      expect(uid1).not.toBe(uid2)
    })

    it('should generate a string', () => {
      const uid = generateUID()
      expect(typeof uid).toBe('string')
    })

    it('should generate a non-empty string', () => {
      const uid = generateUID()
      expect(uid.length).toBeGreaterThan(0)
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const formatted = formatDate(2024, 0, 15) // January 15, 2024
      expect(formatted).toBe('2024-01-15')
    })

    it('should pad single digits with zeros', () => {
      const formatted = formatDate(2024, 1, 5) // February 5, 2024
      expect(formatted).toBe('2024-02-05')
    })

    it('should handle December correctly', () => {
      const formatted = formatDate(2024, 11, 31) // December 31, 2024
      expect(formatted).toBe('2024-12-31')
    })

    it('should handle edge cases', () => {
      const formatted = formatDate(2024, 0, 1) // January 1, 2024
      expect(formatted).toBe('2024-01-01')
    })
  })

  describe('getMonthSheetName', () => {
    it('should format month sheet name correctly', () => {
      const sheetName = getMonthSheetName(2024, 0) // January 2024
      expect(sheetName).toBe('2024-01')
    })

    it('should pad single digit months', () => {
      const sheetName = getMonthSheetName(2024, 8) // September 2024
      expect(sheetName).toBe('2024-09')
    })

    it('should handle December correctly', () => {
      const sheetName = getMonthSheetName(2024, 11) // December 2024
      expect(sheetName).toBe('2024-12')
    })

    it('should handle different years', () => {
      const sheetName = getMonthSheetName(2023, 5) // June 2023
      expect(sheetName).toBe('2023-06')
    })
  })

  describe('isGoogleSheetsId', () => {
    it('should identify typical Google Sheets IDs as Google Sheets', () => {
      // Real Google Sheets ID format (long alphanumeric with underscores)
      const googleId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
      expect(isGoogleSheetsId(googleId)).toBe(true)
    })

    it('should identify Excel file IDs as NOT Google Sheets', () => {
      // Excel file IDs typically contain hyphens
      const excelId = '01ABCDEF123456789-ABCD-EFGH-IJKL-123456789012'
      expect(isGoogleSheetsId(excelId)).toBe(false)
    })

    it('should reject IDs with exclamation marks', () => {
      const idWithExclamation = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74!Sheet1'
      expect(isGoogleSheetsId(idWithExclamation)).toBe(false)
    })

    it('should reject IDs with hyphens', () => {
      const idWithHyphen = '1BxiMVs0XRA5nFMdKv-BdBZjgmUUqptlbs74OgvE2upms'
      expect(isGoogleSheetsId(idWithHyphen)).toBe(false)
    })

    it('should reject short IDs', () => {
      const shortId = 'shortid123'
      expect(isGoogleSheetsId(shortId)).toBe(false)
    })

    it('should reject empty strings', () => {
      expect(isGoogleSheetsId('')).toBe(false)
    })

    it('should reject null/undefined values', () => {
      expect(isGoogleSheetsId(null as unknown as string)).toBe(false)
      expect(isGoogleSheetsId(undefined as unknown as string)).toBe(false)
    })

    it('should reject non-string values', () => {
      expect(isGoogleSheetsId(123 as unknown as string)).toBe(false)
      expect(isGoogleSheetsId({} as unknown as string)).toBe(false)
      expect(isGoogleSheetsId([] as unknown as string)).toBe(false)
    })

    it('should reject IDs with special characters', () => {
      const idWithSpecialChars = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74@#$%'
      expect(isGoogleSheetsId(idWithSpecialChars)).toBe(false)
    })

    it('should accept IDs with underscores', () => {
      const idWithUnderscore = '1BxiMVs0XRA5nFMdKv_BdBZjgmUUqptlbs74OgvE2upms'
      expect(isGoogleSheetsId(idWithUnderscore)).toBe(true)
    })

    it('should accept long alphanumeric IDs', () => {
      const longAlphanumericId = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      expect(isGoogleSheetsId(longAlphanumericId)).toBe(true)
    })
  })
})