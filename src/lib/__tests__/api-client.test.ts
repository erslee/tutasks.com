import { ApiClient } from '../api-client'
import type { Task } from '../../types/task'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('ApiClient', () => {
  let apiClient: ApiClient

  beforeEach(() => {
    jest.clearAllMocks()
    apiClient = new ApiClient()
  })

  describe('request method', () => {
    it('should make successful API requests', async () => {
      const mockResponse = { success: true, data: 'test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient['request']('/test-endpoint')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-endpoint', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle HTTP errors', async () => {
      const mockErrorResponse = { error: 'Not found' }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve(mockErrorResponse),
      })

      await expect(apiClient['request']('/test-endpoint')).rejects.toThrow('Not found')
    })

    it('should handle HTTP errors without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      })

      await expect(apiClient['request']('/test-endpoint')).rejects.toThrow('HTTP 500: Internal Server Error')
    })

    it('should pass custom headers and options', async () => {
      const mockResponse = { success: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await apiClient['request']('/test-endpoint', {
        method: 'POST',
        headers: { 'Custom-Header': 'value' },
        body: '{"test": "data"}',
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/test-endpoint', {
        method: 'POST',
        headers: {
          'Custom-Header': 'value',
        },
        credentials: 'include',
        body: '{"test": "data"}',
      })
    })
  })

  describe('listSheets', () => {
    it('should list spreadsheets successfully', async () => {
      const mockSheets = {
        sheets: [
          { id: 'sheet1', name: 'Sheet 1' },
          { id: 'sheet2', name: 'Sheet 2' },
        ],
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSheets),
      })

      const result = await apiClient.listSheets()

      expect(mockFetch).toHaveBeenCalledWith('/api/sheets/list', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      expect(result).toEqual(mockSheets)
    })
  })

  describe('createSheet', () => {
    it('should create a new sheet successfully', async () => {
      const request = { name: 'New Sheet' }
      const mockResponse = { id: 'new-sheet-123', name: 'New Sheet' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.createSheet(request)

      expect(mockFetch).toHaveBeenCalledWith('/api/sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('checkIdentifier', () => {
    it('should check identifier successfully', async () => {
      const mockResponse = { hasIdentifier: true, version: '1.0.0' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.checkIdentifier('sheet123')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sheets/check-identifier?sheetId=sheet123',
        {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should encode sheetId in URL', async () => {
      const mockResponse = { hasIdentifier: false }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await apiClient.checkIdentifier('sheet with spaces')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sheets/check-identifier?sheetId=sheet%20with%20spaces',
        expect.any(Object)
      )
    })
  })

  describe('getAllTasks', () => {
    it('should get all tasks successfully', async () => {
      const mockTasks: Task[] = [
        {
          uid: 'task1',
          number: 'T-001',
          description: 'Task 1',
          date: '2024-01-15',
          time: '2.5',
        },
        {
          uid: 'task2',
          number: 'T-002',
          description: 'Task 2',
          date: '2024-01-16',
          time: '3.0',
        },
      ]
      const mockResponse = { tasks: mockTasks }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.getAllTasks('sheet123')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sheets/get-all-tasks?sheetId=sheet123',
        {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should encode sheetId in URL', async () => {
      const mockResponse = { tasks: [] }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await apiClient.getAllTasks('sheet/with/slashes')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sheets/get-all-tasks?sheetId=sheet%2Fwith%2Fslashes',
        expect.any(Object)
      )
    })
  })

  describe('addTask', () => {
    it('should add task successfully', async () => {
      const request = {
        sheetId: 'sheet123',
        monthSheetName: '2024-01',
        number: 'T-001',
        description: 'New task',
        date: '2024-01-15',
        time: '2.5',
        uid: 'task-uid-123',
      }
      const mockResponse = { success: true, uid: 'task-uid-123' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.addTask(request)

      expect(mockFetch).toHaveBeenCalledWith('/api/sheets/add-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const request = {
        sheetId: 'sheet123',
        monthSheetName: '2024-01',
        uid: 'task-uid-123',
        number: 'T-001',
        description: 'Updated task',
        date: '2024-01-15',
        time: '3.0',
      }
      const mockResponse = { success: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.updateTask(request)

      expect(mockFetch).toHaveBeenCalledWith('/api/sheets/update-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const request = {
        sheetId: 'sheet123',
        monthSheetName: '2024-01',
        uid: 'task-uid-123',
      }
      const mockResponse = { success: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.deleteTask(request)

      expect(mockFetch).toHaveBeenCalledWith('/api/sheets/delete-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('batchAppend', () => {
    it('should batch append tasks successfully', async () => {
      const request = {
        sheetId: 'sheet123',
        monthSheetName: '2024-01',
        values: [
          ['uid1', 'T-001', 'Task 1', '2024-01-15', '2.5'],
          ['uid2', 'T-002', 'Task 2', '2024-01-16', '3.0'],
        ],
      }
      const mockResponse = { success: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.batchAppend(request)

      expect(mockFetch).toHaveBeenCalledWith('/api/sheets/batch-append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.listSheets()).rejects.toThrow('Network error')
    })

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(apiClient.listSheets()).rejects.toThrow('Invalid JSON')
    })

    it('should handle API errors with custom error messages', async () => {
      const mockErrorResponse = { error: 'Custom validation error', details: 'Missing required field' }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve(mockErrorResponse),
      })

      await expect(apiClient.listSheets()).rejects.toThrow('Custom validation error')
    })

    it('should handle empty error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({}),
      })

      await expect(apiClient.listSheets()).rejects.toThrow('HTTP 403: Forbidden')
    })
  })

  describe('request configuration', () => {
    it('should use correct base URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await apiClient.listSheets()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sheets/list',
        expect.any(Object)
      )
    })

    it('should include credentials in all requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await apiClient.listSheets()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
        })
      )
    })

    it('should include Content-Type header in all requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await apiClient.listSheets()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })
  })
})