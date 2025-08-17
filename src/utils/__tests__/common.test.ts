import { generateUID, formatDate, getMonthSheetName } from '../common'

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
})