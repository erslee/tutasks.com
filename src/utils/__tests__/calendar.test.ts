import { getYears, getYearStats, getMonthStats, getDayStats, months } from '../calendar'
import type { Task } from '../../types/task'

const mockTasks: Task[] = [
  {
    uid: '1',
    number: 'T-001',
    description: 'Task 1',
    date: '2024-01-15',
    time: '2.5',
  },
  {
    uid: '2', 
    number: 'T-002',
    description: 'Task 2',
    date: '2024-01-20',
    time: '3.0',
  },
  {
    uid: '3',
    number: 'T-003', 
    description: 'Task 3',
    date: '2023-12-10',
    time: '1.5',
  },
]

describe('Calendar utilities', () => {
  describe('getYears', () => {
    it('should return unique years from tasks plus current year', () => {
      const years = getYears(mockTasks)
      const currentYear = new Date().getFullYear()
      
      expect(years).toContain(2024)
      expect(years).toContain(2023)
      expect(years).toContain(currentYear)
      expect(years).toEqual(expect.arrayContaining([2023, 2024, currentYear]))
    })

    it('should return sorted years', () => {
      const years = getYears(mockTasks)
      const sortedYears = [...years].sort((a, b) => a - b)
      expect(years).toEqual(sortedYears)
    })

    it('should handle empty tasks array', () => {
      const years = getYears([])
      const currentYear = new Date().getFullYear()
      expect(years).toEqual([currentYear])
    })
  })

  describe('months', () => {
    it('should contain 12 months', () => {
      expect(months).toHaveLength(12)
    })

    it('should start with Jan and end with Dec', () => {
      expect(months[0]).toBe('Jan')
      expect(months[11]).toBe('Dec')
    })
  })

  describe('getYearStats', () => {
    it('should calculate correct stats for 2024', () => {
      const stats = getYearStats(mockTasks, 2024)
      expect(stats.count).toBe(2)
      expect(stats.hours).toBe(5.5) // 2.5 + 3.0
    })

    it('should calculate correct stats for 2023', () => {
      const stats = getYearStats(mockTasks, 2023)
      expect(stats.count).toBe(1)
      expect(stats.hours).toBe(1.5)
    })

    it('should return zero stats for year with no tasks', () => {
      const stats = getYearStats(mockTasks, 2022)
      expect(stats.count).toBe(0)
      expect(stats.hours).toBe(0)
    })
  })

  describe('getMonthStats', () => {
    it('should calculate correct stats for January 2024', () => {
      const stats = getMonthStats(mockTasks, 2024, 0) // January is month 0
      expect(stats.count).toBe(2)
      expect(stats.hours).toBe(5.5)
    })

    it('should calculate correct stats for December 2023', () => {
      const stats = getMonthStats(mockTasks, 2023, 11) // December is month 11
      expect(stats.count).toBe(1)
      expect(stats.hours).toBe(1.5)
    })

    it('should return zero stats for month with no tasks', () => {
      const stats = getMonthStats(mockTasks, 2024, 1) // February
      expect(stats.count).toBe(0)
      expect(stats.hours).toBe(0)
    })
  })

  describe('getDayStats', () => {
    it('should calculate correct stats for specific day', () => {
      const stats = getDayStats(mockTasks, 2024, 0, 15) // January 15, 2024
      expect(stats.count).toBe(1)
      expect(stats.hours).toBe(2.5)
    })

    it('should return zero stats for day with no tasks', () => {
      const stats = getDayStats(mockTasks, 2024, 0, 1) // January 1, 2024
      expect(stats.count).toBe(0)
      expect(stats.hours).toBe(0)
    })
  })
})