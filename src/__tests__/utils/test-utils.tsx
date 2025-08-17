import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import type { Task } from '../../types/task'

// Mock session data
const mockSession = {
  user: {
    email: 'test@example.com',
    name: 'Test User',
  },
  accessToken: 'mock-access-token',
  expires: '2024-12-31',
}

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider session={mockSession}>
      {children}
    </SessionProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockTask = (overrides?: Partial<Task>): Task => ({
  uid: 'mock-uid-123',
  id: 'mock-id-123',
  number: 'T-001',
  description: 'Test task description',
  date: '2024-01-15',
  time: '2.5',
  ...overrides,
})

export const createMockTasks = (count: number = 3): Task[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockTask({
      uid: `mock-uid-${index + 1}`,
      id: `mock-id-${index + 1}`,
      number: `T-${String(index + 1).padStart(3, '0')}`,
      description: `Test task ${index + 1}`,
      date: `2024-01-${String(index + 15).padStart(2, '0')}`,
      time: String((index + 1) * 1.5),
    })
  )
}

// Mock fetch responses
export const mockFetchSuccess = (data: unknown) => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  })
}

export const mockFetchError = (error: string) => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error }),
  })
}

// Setup localStorage mock data
export const mockLocalStorage = (data: Record<string, string>) => {
  const localStorage = global.localStorage as jest.Mocked<Storage>
  localStorage.getItem.mockImplementation((key: string) => data[key] || null)
}

// Clear all mocks helper
export const clearAllMocks = () => {
  jest.clearAllMocks()
  const localStorage = global.localStorage as jest.Mocked<Storage>
  localStorage.getItem.mockClear()
  localStorage.setItem.mockClear()
}

// Dummy test to prevent "no tests" error
describe('test-utils', () => {
  it('should export testing utilities', () => {
    expect(createMockTask).toBeDefined()
    expect(createMockTasks).toBeDefined()
    expect(mockFetchSuccess).toBeDefined()
    expect(mockFetchError).toBeDefined()
  })
})