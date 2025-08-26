import { ExcelProvider } from '../excel-provider'
import { Client } from '@microsoft/microsoft-graph-client'

// Mock Microsoft Graph Client
jest.mock('@microsoft/microsoft-graph-client')

// Keep MockedClient for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MockedClient = Client as jest.MockedClass<typeof Client>

// Lightweight mock shapes for the parts of Graph API we use in tests
type GraphApiMock = {
  api: jest.Mock
}

type ApiResponseMock = {
  get: jest.Mock
  post: jest.Mock
  patch: jest.Mock
  delete: jest.Mock
}

describe('ExcelProvider', () => {
  let provider: ExcelProvider
  let mockGraphClient: GraphApiMock
  let mockApiResponse: ApiResponseMock

  beforeEach(() => {
    jest.clearAllMocks()

    mockApiResponse = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    }

    mockGraphClient = {
      api: jest.fn().mockReturnValue(mockApiResponse),
    }

    provider = new ExcelProvider(mockGraphClient as unknown as Client)
  })

  describe('listSpreadsheets', () => {
    it('should list Excel files successfully', async () => {
      const mockFiles = {
        value: [
          { id: 'file1', name: 'Task Sheet 1.xlsx', file: {} },
          { id: 'file2', name: 'Task Sheet 2.xlsx', file: {} },
          { id: 'file3', name: 'NotAnExcel.txt', file: {} }, // Should be filtered out
        ]
      }

      mockApiResponse.get.mockResolvedValue(mockFiles)

      const result = await provider.listSpreadsheets()

      expect(result).toEqual([
        { id: 'file1', name: 'Task Sheet 1' },
        { id: 'file2', name: 'Task Sheet 2' },
      ])

      expect(mockGraphClient.api).toHaveBeenCalledWith("/me/drive/root/search(q='*.xlsx')")
      expect(mockApiResponse.get).toHaveBeenCalled()
    })

    it('should handle empty files list', async () => {
      mockApiResponse.get.mockResolvedValue({ value: [] })

      const result = await provider.listSpreadsheets()

      expect(result).toEqual([])
    })

    it('should handle undefined value', async () => {
      mockApiResponse.get.mockResolvedValue({})

      const result = await provider.listSpreadsheets()

      expect(result).toEqual([])
    })

    it('should filter out non-Excel files', async () => {
      const mockFiles = {
        value: [
          { id: 'file1', name: 'Document.docx', file: {} },
          { id: 'file2', name: 'Spreadsheet.xlsx', file: {} },
          { id: 'file3', name: 'Text.txt', file: {} },
        ]
      }

      mockApiResponse.get.mockResolvedValue(mockFiles)

      const result = await provider.listSpreadsheets()

      expect(result).toEqual([
        { id: 'file2', name: 'Spreadsheet' },
      ])
    })
  })

  describe('createSpreadsheet', () => {
    it('should create spreadsheet with identifier', async () => {
      const mockWorkbook = {
        id: 'new-workbook-123',
        name: 'Test Sheet.xlsx',
      }

      mockApiResponse.post.mockResolvedValue(mockWorkbook)
      mockApiResponse.patch.mockResolvedValue({})

      const result = await provider.createSpreadsheet({ name: 'Test Sheet' })

      expect(result).toEqual({
        id: 'new-workbook-123',
        name: 'Test Sheet',
      })

      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/drive/root/children')
      expect(mockApiResponse.post).toHaveBeenCalledWith({
        name: 'Test Sheet.xlsx',
        file: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      })

      expect(mockGraphClient.api).toHaveBeenCalledWith("/me/drive/items/new-workbook-123/workbook/worksheets/Sheet1/range(address='A1')")
      expect(mockApiResponse.patch).toHaveBeenCalledWith({
        values: [['created:tutasks.com version:1.0.0']],
      })
    })

    it('should use default name for empty string', async () => {
      const mockWorkbook = {
        id: 'new-workbook-123',
        name: 'New Task Sheet.xlsx',
      }

      mockApiResponse.post.mockResolvedValue(mockWorkbook)
      mockApiResponse.patch.mockResolvedValue({})

      await provider.createSpreadsheet({ name: '   ' })

      expect(mockApiResponse.post).toHaveBeenCalledWith({
        name: 'New Task Sheet.xlsx',
        file: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      })
    })
  })

  describe('checkIdentifier', () => {
    it('should return identifier found with version', async () => {
      mockApiResponse.get.mockResolvedValue({
        values: [['created:tutasks.com version:1.0.0']],
      })

      const result = await provider.checkIdentifier('workbook123')

      expect(result).toEqual({
        hasIdentifier: true,
        version: '1.0.0',
      })

      expect(mockGraphClient.api).toHaveBeenCalledWith("/me/drive/items/workbook123/workbook/worksheets/Sheet1/range(address='A1')")
      expect(mockApiResponse.get).toHaveBeenCalled()
    })

    it('should return identifier not found for invalid format', async () => {
      mockApiResponse.get.mockResolvedValue({
        values: [['some other value']],
      })

      const result = await provider.checkIdentifier('workbook123')

      expect(result).toEqual({
        hasIdentifier: false,
      })
    })

    it('should return identifier not found for empty cell', async () => {
      mockApiResponse.get.mockResolvedValue({
        values: [],
      })

      const result = await provider.checkIdentifier('workbook123')

      expect(result).toEqual({
        hasIdentifier: false,
      })
    })

    it('should handle API errors', async () => {
      mockApiResponse.get.mockRejectedValue(new Error('API Error'))

      const result = await provider.checkIdentifier('workbook123')

      expect(result).toEqual({
        hasIdentifier: false,
      })
    })
  })

  describe('addTask', () => {
    it('should add task to existing worksheet', async () => {
      // Mock ensureWorksheetExists - worksheet exists
      mockApiResponse.get.mockResolvedValueOnce({}) // Worksheet exists
      mockApiResponse.get.mockResolvedValueOnce({ rowCount: 1 }) // Used range
      mockApiResponse.patch.mockResolvedValue({})

      const request = {
        sheetId: 'workbook123',
        monthSheetName: '2024-01',
        number: 'T-001',
        description: 'Test task',
        date: '2024-01-15',
        time: '2.5',
        uid: 'custom-uid',
      }

      const result = await provider.addTask(request)

      expect(result).toEqual({
        success: true,
        uid: 'custom-uid',
      })

      expect(mockGraphClient.api).toHaveBeenCalledWith("/me/drive/items/workbook123/workbook/worksheets/2024-01/range(address='A2:E2')")
      expect(mockApiResponse.patch).toHaveBeenCalledWith({
        values: [['custom-uid', 'T-001', 'Test task', '2024-01-15', '2.5']],
      })
    })

    it('should create new worksheet and add headers', async () => {
      // Mock ensureWorksheetExists - worksheet doesn't exist
      mockApiResponse.get.mockRejectedValueOnce(new Error('Not found'))
      mockApiResponse.post.mockResolvedValueOnce({}) // Create worksheet
      mockApiResponse.patch.mockResolvedValueOnce({}) // Add headers
      mockApiResponse.post.mockResolvedValueOnce({}) // Add task

      const request = {
        sheetId: 'workbook123',
        monthSheetName: '2024-01',
        number: 'T-001',
        description: 'Test task',
        date: '2024-01-15',
        time: '2.5',
      }

      const result = await provider.addTask(request)

      expect(result.success).toBe(true)
      expect(result.uid).toBeDefined()

      // Verify worksheet creation
      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/drive/items/workbook123/workbook/worksheets')
      expect(mockApiResponse.post).toHaveBeenCalledWith({
        name: '2024-01'
      })

      // Verify headers added
      expect(mockGraphClient.api).toHaveBeenCalledWith("/me/drive/items/workbook123/workbook/worksheets/2024-01/range(address='A1:E1')")
      expect(mockApiResponse.patch).toHaveBeenCalledWith({
        values: [['UID', 'Task Number', 'Description', 'Date', 'Time']],
      })
    })

    it('should generate UID when not provided', async () => {
      mockApiResponse.get.mockResolvedValueOnce({}) // Worksheet exists
      mockApiResponse.post.mockResolvedValue({})

      const request = {
        sheetId: 'workbook123',
        monthSheetName: '2024-01',
        number: 'T-001',
        description: 'Test task',
        date: '2024-01-15',
        time: '2.5',
      }

      const result = await provider.addTask(request)

      expect(result.success).toBe(true)
      expect(result.uid).toBeDefined()
      expect(typeof result.uid).toBe('string')
      expect(result.uid.length).toBeGreaterThan(0)
    })
  })

  describe('updateTask', () => {
    it('should update existing task', async () => {
      // Mock findTaskRowIndex
      mockApiResponse.get.mockResolvedValue({
        values: [['uid1'], ['target-uid'], ['uid3']],
      })

      mockApiResponse.patch.mockResolvedValue({})

      const request = {
        sheetId: 'workbook123',
        monthSheetName: '2024-01',
        uid: 'target-uid',
        number: 'T-001',
        description: 'Updated task',
        date: '2024-01-15',
        time: '3.0',
      }

      const result = await provider.updateTask(request)

      expect(result).toEqual({ success: true })

      expect(mockGraphClient.api).toHaveBeenCalledWith("/me/drive/items/workbook123/workbook/worksheets/2024-01/range(address='A2:E2')")
      expect(mockApiResponse.patch).toHaveBeenCalledWith({
        values: [['target-uid', 'T-001', 'Updated task', '2024-01-15', '3.0']],
      })
    })

    it('should throw error when task not found', async () => {
      mockApiResponse.get.mockResolvedValue({
        values: [['uid1'], ['uid2'], ['uid3']],
      })

      const request = {
        sheetId: 'workbook123',
        monthSheetName: '2024-01',
        uid: 'non-existent-uid',
        number: 'T-001',
        description: 'Updated task',
        date: '2024-01-15',
        time: '3.0',
      }

      await expect(provider.updateTask(request)).rejects.toThrow('Task not found')
    })

    it('should handle empty rows', async () => {
      mockApiResponse.get.mockResolvedValue({
        values: [],
      })

      const request = {
        sheetId: 'workbook123',
        monthSheetName: '2024-01',
        uid: 'target-uid',
        number: 'T-001',
        description: 'Updated task',
        date: '2024-01-15',
        time: '3.0',
      }

      await expect(provider.updateTask(request)).rejects.toThrow('Task not found')
    })
  })

  describe('deleteTask', () => {
    it('should delete existing task', async () => {
      // Mock findTaskRowIndex
      mockApiResponse.get.mockResolvedValue({
        values: [['uid1'], ['target-uid'], ['uid3']],
      })

      mockApiResponse.post.mockResolvedValue({})

      const request = {
        sheetId: 'workbook123',
        monthSheetName: '2024-01',
        uid: 'target-uid',
      }

      const result = await provider.deleteTask(request)

      expect(result).toEqual({ success: true })

      expect(mockGraphClient.api).toHaveBeenCalledWith("/me/drive/items/workbook123/workbook/worksheets/2024-01/range(address='2:2')/delete")
      expect(mockApiResponse.post).toHaveBeenCalledWith({
        shift: "Up"
      })
    })

    it('should throw error when task not found', async () => {
      mockApiResponse.get.mockResolvedValue({
        values: [['uid1'], ['uid2'], ['uid3']],
      })

      const request = {
        sheetId: 'workbook123',
        monthSheetName: '2024-01',
        uid: 'non-existent-uid',
      }

      await expect(provider.deleteTask(request)).rejects.toThrow('Task not found')
    })
  })

  describe('batchAppend', () => {
    it('should batch append to existing worksheet', async () => {
      // Mock ensureWorksheetExists - worksheet exists
      mockApiResponse.get.mockResolvedValueOnce({}) // Worksheet exists
      mockApiResponse.get.mockResolvedValueOnce({ rowCount: 1 }) // Used range
      mockApiResponse.patch.mockResolvedValue({})

      const request = {
        sheetId: 'workbook123',
        monthSheetName: '2024-01',
        values: [
          ['uid1', 'T-001', 'Task 1', '2024-01-15', '2.5'],
          ['uid2', 'T-002', 'Task 2', '2024-01-16', '3.0'],
        ],
      }

      const result = await provider.batchAppend(request)

      expect(result).toEqual({ success: true })

      expect(mockGraphClient.api).toHaveBeenCalledWith("/me/drive/items/workbook123/workbook/worksheets/2024-01/range(address='A2:E3')")
      expect(mockApiResponse.patch).toHaveBeenCalledWith({
        values: request.values,
      })
    })

    it('should create new worksheet for batch append', async () => {
      // Mock ensureWorksheetExists - worksheet doesn't exist
      mockApiResponse.get.mockRejectedValueOnce(new Error('Not found'))
      mockApiResponse.post.mockResolvedValueOnce({}) // Create worksheet
      mockApiResponse.patch.mockResolvedValueOnce({}) // Add headers
      mockApiResponse.post.mockResolvedValueOnce({}) // Batch append

      const request = {
        sheetId: 'workbook123',
        monthSheetName: '2024-01',
        values: [['uid1', 'T-001', 'Task 1', '2024-01-15', '2.5']],
      }

      const result = await provider.batchAppend(request)

      expect(result).toEqual({ success: true })

      // Verify worksheet creation
      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/drive/items/workbook123/workbook/worksheets')
      expect(mockApiResponse.post).toHaveBeenCalledWith({
        name: '2024-01'
      })
    })
  })

  describe('getAllTasks', () => {
    it('should get all tasks from month worksheets', async () => {
      // Mock get all worksheets
      mockApiResponse.get.mockResolvedValueOnce({
        value: [
          { name: 'Sheet1' },
          { name: '2024-01' },
          { name: '2024-02' },
          { name: 'Settings' },
        ],
      } as { value: Array<{ name: string }> })

      // Mock get data from each month worksheet
      mockApiResponse.get
        .mockResolvedValueOnce({
          values: [
            ['UID', 'Task Number', 'Description', 'Date', 'Time'],
            ['uid1', 'T-001', 'Task 1', '2024-01-15', '2.5'],
            ['uid2', 'T-002', 'Task 2', '2024-01-16', '3.0'],
          ],
        })
        .mockResolvedValueOnce({
          values: [
            ['UID', 'Task Number', 'Description', 'Date', 'Time'],
            ['uid3', 'T-003', 'Task 3', '2024-02-01', '1.5'],
          ],
        })

      const result = await provider.getAllTasks('workbook123')

      expect(result).toEqual({
        tasks: [
          { uid: 'uid1', number: 'T-001', description: 'Task 1', date: '2024-01-15', time: '2.5' },
          { uid: 'uid2', number: 'T-002', description: 'Task 2', date: '2024-01-16', time: '3.0' },
          { uid: 'uid3', number: 'T-003', description: 'Task 3', date: '2024-02-01', time: '1.5' },
        ],
      })

      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/drive/items/workbook123/workbook/worksheets')
      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/drive/items/workbook123/workbook/worksheets/2024-01/usedRange')
      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/drive/items/workbook123/workbook/worksheets/2024-02/usedRange')
    })

    it('should return empty tasks when no month worksheets exist', async () => {
      mockApiResponse.get.mockResolvedValue({
        value: [
          { name: 'Sheet1' },
          { name: 'Settings' },
        ],
      } as { value: Array<{ name: string }> })

      const result = await provider.getAllTasks('workbook123')

      expect(result).toEqual({ tasks: [] })
    })

    it('should handle empty value ranges', async () => {
      mockApiResponse.get.mockResolvedValueOnce({
        value: [{ name: '2024-01' }],
      } as { value: Array<{ name: string }> }).mockResolvedValueOnce({
        values: [],
      })

      const result = await provider.getAllTasks('workbook123')

      expect(result).toEqual({ tasks: [] })
    })

    it('should handle missing data in rows', async () => {
      mockApiResponse.get.mockResolvedValueOnce({
        value: [{ name: '2024-01' }],
      } as { value: Array<{ name: string }> }).mockResolvedValueOnce({
        values: [
          ['UID', 'Task Number', 'Description', 'Date', 'Time'],
          ['uid1', 'T-001'], // Missing description, date, time
          ['uid2'], // Missing everything except uid
        ],
      })

      const result = await provider.getAllTasks('workbook123')

      expect(result).toEqual({
        tasks: [
          { uid: 'uid1', number: 'T-001', description: '', date: '', time: '' },
          { uid: 'uid2', number: '', description: '', date: '', time: '' },
        ],
      })
    })

    it('should convert Excel date/time serial numbers to strings', async () => {
      mockApiResponse.get.mockResolvedValueOnce({
        value: [{ name: '2024-01' }],
      } as { value: Array<{ name: string }> }).mockResolvedValueOnce({
        values: [
          ['UID', 'Task Number', 'Description', 'Date', 'Time'],
          ['uid1', 'T-001', 'Task 1', 45895, 2.5], // Excel serial date and decimal time
          ['uid2', 'T-002', 'Task 2', '2024-01-16', '3.0'], // String formats (already converted)
        ],
      })

      const result = await provider.getAllTasks('workbook123')

      expect(result.tasks).toHaveLength(2)
      // Check that Excel serial number 45895 gets converted to a proper date
      expect(result.tasks[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/) // Should be YYYY-MM-DD format
      expect(result.tasks[0].time).toBe('2.5') // Should be converted to string
      // Check that string formats are preserved
      expect(result.tasks[1].date).toBe('2024-01-16')
      expect(result.tasks[1].time).toBe('3.0')
    })

    it('should skip worksheets with errors', async () => {
      mockApiResponse.get.mockResolvedValueOnce({
        value: [
          { name: '2024-01' },
          { name: '2024-02' },
        ],
      } as { value: Array<{ name: string }> })

      // First worksheet succeeds, second fails
      mockApiResponse.get
        .mockResolvedValueOnce({
          values: [
            ['UID', 'Task Number', 'Description', 'Date', 'Time'],
            ['uid1', 'T-001', 'Task 1', '2024-01-15', '2.5'],
          ],
        })
        .mockRejectedValueOnce(new Error('Worksheet error'))

      const result = await provider.getAllTasks('workbook123')

      expect(result).toEqual({
        tasks: [
          { uid: 'uid1', number: 'T-001', description: 'Task 1', date: '2024-01-15', time: '2.5' },
        ],
      })
    })
  })

  describe('findTaskRowIndex', () => {
    it('should return correct row index', async () => {
      mockApiResponse.get.mockResolvedValue({
        values: [['uid1'], ['target-uid'], ['uid3']],
      })

      const result = await (provider as ExcelProvider & { findTaskRowIndex: (sheetId: string, worksheetName: string, uid: string) => Promise<number> }).findTaskRowIndex('workbook123', '2024-01', 'target-uid')

      expect(result).toBe(1) // Zero-based index
      expect(mockGraphClient.api).toHaveBeenCalledWith("/me/drive/items/workbook123/workbook/worksheets/2024-01/range(address='A:A')")
    })

    it('should return -1 when task not found', async () => {
      mockApiResponse.get.mockResolvedValue({
        values: [['uid1'], ['uid2'], ['uid3']],
      })

      const result = await (provider as ExcelProvider & { findTaskRowIndex: (sheetId: string, worksheetName: string, uid: string) => Promise<number> }).findTaskRowIndex('workbook123', '2024-01', 'non-existent')

      expect(result).toBe(-1)
    })

    it('should return -1 on API error', async () => {
      mockApiResponse.get.mockRejectedValue(new Error('API Error'))

      const result = await (provider as ExcelProvider & { findTaskRowIndex: (sheetId: string, worksheetName: string, uid: string) => Promise<number> }).findTaskRowIndex('workbook123', '2024-01', 'target-uid')

      expect(result).toBe(-1)
    })
  })

  describe('ensureWorksheetExists', () => {
    it('should not create worksheet if it exists', async () => {
      mockApiResponse.get.mockResolvedValue({}) // Worksheet exists

      await (provider as ExcelProvider & { ensureWorksheetExists: (sheetId: string, worksheetName: string) => Promise<void> }).ensureWorksheetExists('workbook123', '2024-01')

      expect(mockApiResponse.get).toHaveBeenCalledWith()
      expect(mockApiResponse.post).not.toHaveBeenCalled()
    })

    it('should create worksheet if it does not exist', async () => {
      mockApiResponse.get.mockRejectedValue(new Error('Not found'))
      mockApiResponse.post.mockResolvedValue({})
      mockApiResponse.patch.mockResolvedValue({})

      await (provider as ExcelProvider & { ensureWorksheetExists: (sheetId: string, worksheetName: string) => Promise<void> }).ensureWorksheetExists('workbook123', '2024-01')

      expect(mockApiResponse.post).toHaveBeenCalledWith({
        name: '2024-01'
      })
      expect(mockApiResponse.patch).toHaveBeenCalledWith({
        values: [['UID', 'Task Number', 'Description', 'Date', 'Time']],
      })
    })
  })

  describe('generateUID', () => {
    it('should generate unique UIDs', async () => {
      // Mock ensureWorksheetExists
      mockApiResponse.get.mockResolvedValue({}) // Worksheet exists
      mockApiResponse.post.mockResolvedValue({})

      const request = {
        sheetId: 'workbook123',
        monthSheetName: '2024-01',
        number: 'T-001',
        description: 'Test task',
        date: '2024-01-15',
        time: '2.5',
      }

      const result1 = await provider.addTask(request)
      const result2 = await provider.addTask(request)

      expect(result1.uid).not.toBe(result2.uid)
      expect(result1.uid).toBeDefined()
      expect(result2.uid).toBeDefined()
    })
  })
})