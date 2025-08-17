import { renderHook, act } from '@testing-library/react'
import { useCalendar } from '../useCalendar'

describe('useCalendar', () => {
  beforeEach(() => {
    // Mock Date to a fixed date for consistent testing
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should initialize with current date', () => {
    const { result } = renderHook(() => useCalendar())
    
    expect(result.current.selectedYear).toBe(2024)
    expect(result.current.selectedMonth).toBe(0) // January
    expect(result.current.selectedDay).toBe(15)
    expect(result.current.today).toEqual(new Date('2024-01-15'))
  })

  it('should handle year selection', () => {
    const { result } = renderHook(() => useCalendar())
    
    act(() => {
      result.current.handleYearSelect(2023)
    })
    
    expect(result.current.selectedYear).toBe(2023)
    expect(result.current.selectedMonth).toBe(0) // Should reset to January
    expect(result.current.selectedDay).toBe(1) // Should reset to 1st
  })

  it('should handle month selection', () => {
    const { result } = renderHook(() => useCalendar())
    
    act(() => {
      result.current.handleMonthSelect(5) // June
    })
    
    expect(result.current.selectedMonth).toBe(5)
    expect(result.current.selectedDay).toBe(1) // Should reset to 1st
    expect(result.current.selectedYear).toBe(2024) // Year unchanged
  })

  it('should handle day selection', () => {
    const { result } = renderHook(() => useCalendar())
    
    act(() => {
      result.current.handleDaySelect(25)
    })
    
    expect(result.current.selectedDay).toBe(25)
    expect(result.current.selectedMonth).toBe(0) // Month unchanged
    expect(result.current.selectedYear).toBe(2024) // Year unchanged
  })

  it('should handle today navigation', () => {
    const { result } = renderHook(() => useCalendar())
    
    // First change to different date
    act(() => {
      result.current.handleYearSelect(2022)
      result.current.handleMonthSelect(5)
      result.current.handleDaySelect(10)
    })
    
    // Then navigate back to today
    act(() => {
      result.current.handleToday()
    })
    
    expect(result.current.selectedYear).toBe(2024)
    expect(result.current.selectedMonth).toBe(0)
    expect(result.current.selectedDay).toBe(15)
  })

  it('should provide consistent today value', () => {
    const { result } = renderHook(() => useCalendar())
    
    const initialToday = result.current.today
    
    // Change some selections
    act(() => {
      result.current.handleYearSelect(2023)
      result.current.handleMonthSelect(5)
    })
    
    // today should remain the same
    expect(result.current.today).toEqual(initialToday)
  })
})