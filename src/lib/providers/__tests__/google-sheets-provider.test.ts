import { GoogleSheetsProvider } from '../google-sheets-provider'
import { google } from 'googleapis'

// Mock googleapis
jest.mock('googleapis')

const mockGoogle = google as jest.Mocked<typeof google>

// Lightweight mock shapes for the parts of Google APIs we use in tests
type SheetsMock = {
  spreadsheets: {
    get: jest.Mock
    create: jest.Mock
    batchUpdate: jest.Mock
    values: {
      get: jest.Mock
      update: jest.Mock
      append: jest.Mock
      batchGet: jest.Mock
    }
  }
}

type DriveMock = {
  files: {
    list: jest.Mock
  }
}

type OAuth2ClientMock = {
  credentials: { access_token: string }
}

describe('GoogleSheetsProvider', () => {
  let provider: GoogleSheetsProvider
  let mockOAuth2Client: OAuth2ClientMock
  let mockSheets: SheetsMock
  let mockDrive: DriveMock

  beforeEach(() => {
    jest.clearAllMocks()

    mockOAuth2Client = {
      credentials: { access_token: 'mock-token' },
    }

    mockSheets = {
      spreadsheets: {
        get: jest.fn(),
        create: jest.fn(),
        batchUpdate: jest.fn(),
        values: {
          get: jest.fn(),
          update: jest.fn(),
          append: jest.fn(),
          batchGet: jest.fn(),
        },
      },
    }

    mockDrive = {
      files: {
        list: jest.fn(),
      },
    }

    // Cast our lightweight mocks to the return types expected by the mocked module
    mockGoogle.sheets.mockReturnValue(
      mockSheets as unknown as ReturnType<typeof google.sheets>
    )
    mockGoogle.drive.mockReturnValue(
      mockDrive as unknown as ReturnType<typeof google.drive>
    )

    provider = new GoogleSheetsProvider(
      mockOAuth2Client as unknown as InstanceType<typeof google.auth.OAuth2>
    )
  })

  describe('listSpreadsheets', () => {
    it('should list spreadsheets successfully', async () => {
      const mockFiles = [
        { id: 'sheet1', name: 'Task Sheet 1' },
        { id: 'sheet2', name: 'Task Sheet 2' },
      ]

      mockDrive.files.list.mockResolvedValue({
        data: { files: mockFiles },
      })

      const result = await provider.listSpreadsheets()

      expect(result).toEqual([
        { id: 'sheet1', name: 'Task Sheet 1' },
        { id: 'sheet2', name: 'Task Sheet 2' },
      ])

      expect(mockDrive.files.list).toHaveBeenCalledWith({
        q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
        fields: 'files(id, name)',
      })
    })

    it('should handle empty files list', async () => {
      mockDrive.files.list.mockResolvedValue({
        data: { files: [] },
      })

      const result = await provider.listSpreadsheets()

      expect(result).toEqual([])
    })

    it('should handle undefined files', async () => {
      mockDrive.files.list.mockResolvedValue({
        data: {},
      })

      const result = await provider.listSpreadsheets()

      expect(result).toEqual([])
    })
  })

  describe('createSpreadsheet', () => {
    it('should create spreadsheet with identifier', async () => {
      const mockSpreadsheet = {
        spreadsheetId: 'new-sheet-123',
        properties: { title: 'Test Sheet' },
        sheets: [{ properties: { title: 'Sheet1' } }],
      }

      mockSheets.spreadsheets.create.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.update.mockResolvedValue({})

      const result = await provider.createSpreadsheet({ name: 'Test Sheet' })

      expect(result).toEqual({
        id: 'new-sheet-123',
        name: 'Test Sheet',
      })

      expect(mockSheets.spreadsheets.create).toHaveBeenCalledWith({
        requestBody: {
          properties: { title: 'Test Sheet' },
        },
      })

      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: 'new-sheet-123',
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['created:tutasks.com version:1.0.0']],
        },
      })
    })

    it('should use default name for empty string', async () => {
      const mockSpreadsheet = {
        spreadsheetId: 'new-sheet-123',
        properties: { title: 'New Task Sheet' },
        sheets: [{ properties: { title: 'Sheet1' } }],
      }

      mockSheets.spreadsheets.create.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.update.mockResolvedValue({})

      await provider.createSpreadsheet({ name: '   ' })

      expect(mockSheets.spreadsheets.create).toHaveBeenCalledWith({
        requestBody: {
          properties: { title: 'New Task Sheet' },
        },
      })
    })

    it('should handle missing sheet title', async () => {
      const mockSpreadsheet = {
        spreadsheetId: 'new-sheet-123',
        properties: {},
        sheets: [{ properties: { title: 'Sheet1' } }],
      }

      mockSheets.spreadsheets.create.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.update.mockResolvedValue({})

      const result = await provider.createSpreadsheet({ name: 'Test Sheet' })

      expect(result.name).toBe('')
    })
  })

  describe('checkIdentifier', () => {
    it('should return identifier found with version', async () => {
      const mockSpreadsheet = {
        sheets: [{ properties: { title: 'Sheet1' } }],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [['created:tutasks.com version:1.0.0']],
        },
      })

      const result = await provider.checkIdentifier('sheet123')

      expect(result).toEqual({
        hasIdentifier: true,
        version: '1.0.0',
      })

      expect(mockSheets.spreadsheets.values.get).toHaveBeenCalledWith({
        spreadsheetId: 'sheet123',
        range: 'Sheet1!A1',
      })
    })

    it('should return identifier not found for invalid format', async () => {
      const mockSpreadsheet = {
        sheets: [{ properties: { title: 'Sheet1' } }],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [['some other value']],
        },
      })

      const result = await provider.checkIdentifier('sheet123')

      expect(result).toEqual({
        hasIdentifier: false,
      })
    })

    it('should return identifier not found for empty cell', async () => {
      const mockSpreadsheet = {
        sheets: [{ properties: { title: 'Sheet1' } }],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: [] },
      })

      const result = await provider.checkIdentifier('sheet123')

      expect(result).toEqual({
        hasIdentifier: false,
      })
    })
  })

  describe('addTask', () => {
    it('should add task to existing sheet', async () => {
      const mockSpreadsheet = {
        sheets: [
          { properties: { title: 'Sheet1' } },
          { properties: { title: '2024-01' } },
        ],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.append.mockResolvedValue({})

      const request = {
        sheetId: 'sheet123',
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

      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: 'sheet123',
        range: '2024-01!A:E',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [['custom-uid', 'T-001', 'Test task', '2024-01-15', '2.5']],
        },
      })
    })

    it('should create new month sheet and add headers', async () => {
      const mockSpreadsheet = {
        sheets: [{ properties: { title: 'Sheet1' } }],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.batchUpdate.mockResolvedValue({})
      mockSheets.spreadsheets.values.update.mockResolvedValue({})
      mockSheets.spreadsheets.values.append.mockResolvedValue({})

      const request = {
        sheetId: 'sheet123',
        monthSheetName: '2024-01',
        number: 'T-001',
        description: 'Test task',
        date: '2024-01-15',
        time: '2.5',
      }

      const result = await provider.addTask(request)

      expect(result.success).toBe(true)
      expect(result.uid).toBeDefined()

      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalledWith({
        spreadsheetId: 'sheet123',
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: '2024-01' },
              },
            },
          ],
        },
      })

      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: 'sheet123',
        range: '2024-01!A1:E1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['UID', 'Task Number', 'Description', 'Date', 'Time']],
        },
      })
    })

    it('should generate UID when not provided', async () => {
      const mockSpreadsheet = {
        sheets: [{ properties: { title: '2024-01' } }],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.append.mockResolvedValue({})

      const request = {
        sheetId: 'sheet123',
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
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [['uid1'], ['target-uid'], ['uid3']],
        },
      })

      mockSheets.spreadsheets.values.update.mockResolvedValue({})

      const request = {
        sheetId: 'sheet123',
        monthSheetName: '2024-01',
        uid: 'target-uid',
        number: 'T-001',
        description: 'Updated task',
        date: '2024-01-15',
        time: '3.0',
      }

      const result = await provider.updateTask(request)

      expect(result).toEqual({ success: true })

      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: 'sheet123',
        range: '2024-01!A2:E2',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['target-uid', 'T-001', 'Updated task', '2024-01-15', '3.0']],
        },
      })
    })

    it('should throw error when task not found', async () => {
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [['uid1'], ['uid2'], ['uid3']],
        },
      })

      const request = {
        sheetId: 'sheet123',
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
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: { values: [] },
      })

      const request = {
        sheetId: 'sheet123',
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
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [['uid1'], ['target-uid'], ['uid3']],
        },
      })

      const mockSpreadsheet = {
        sheets: [{ properties: { title: '2024-01', sheetId: 123 } }],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.batchUpdate.mockResolvedValue({})

      const request = {
        sheetId: 'sheet123',
        monthSheetName: '2024-01',
        uid: 'target-uid',
      }

      const result = await provider.deleteTask(request)

      expect(result).toEqual({ success: true })

      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalledWith({
        spreadsheetId: 'sheet123',
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 123,
                  dimension: 'ROWS',
                  startIndex: 1,
                  endIndex: 2,
                },
              },
            },
          ],
        },
      })
    })

    it('should throw error when task not found', async () => {
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [['uid1'], ['uid2'], ['uid3']],
        },
      })

      const request = {
        sheetId: 'sheet123',
        monthSheetName: '2024-01',
        uid: 'non-existent-uid',
      }

      await expect(provider.deleteTask(request)).rejects.toThrow('Task not found')
    })
  })

  describe('batchAppend', () => {
    it('should batch append to existing sheet', async () => {
      const mockSpreadsheet = {
        sheets: [{ properties: { title: '2024-01' } }],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.append.mockResolvedValue({})

      const request = {
        sheetId: 'sheet123',
        monthSheetName: '2024-01',
        values: [
          ['uid1', 'T-001', 'Task 1', '2024-01-15', '2.5'],
          ['uid2', 'T-002', 'Task 2', '2024-01-16', '3.0'],
        ],
      }

      const result = await provider.batchAppend(request)

      expect(result).toEqual({ success: true })

      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: 'sheet123',
        range: '2024-01!A:E',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: request.values,
        },
      })
    })

    it('should create new sheet for batch append', async () => {
      const mockSpreadsheet = {
        sheets: [{ properties: { title: 'Sheet1' } }],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.batchUpdate.mockResolvedValue({})
      mockSheets.spreadsheets.values.update.mockResolvedValue({})
      mockSheets.spreadsheets.values.append.mockResolvedValue({})

      const request = {
        sheetId: 'sheet123',
        monthSheetName: '2024-01',
        values: [['uid1', 'T-001', 'Task 1', '2024-01-15', '2.5']],
      }

      const result = await provider.batchAppend(request)

      expect(result).toEqual({ success: true })

      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalledWith({
        spreadsheetId: 'sheet123',
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: '2024-01' },
              },
            },
          ],
        },
      })
    })
  })

  describe('getAllTasks', () => {
    it('should get all tasks from month sheets', async () => {
      const mockSpreadsheet = {
        sheets: [
          { properties: { title: 'Sheet1' } },
          { properties: { title: '2024-01' } },
          { properties: { title: '2024-02' } },
          { properties: { title: 'Settings' } },
        ],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.batchGet.mockResolvedValue({
        data: {
          valueRanges: [
            {
              values: [
                ['UID', 'Task Number', 'Description', 'Date', 'Time'],
                ['uid1', 'T-001', 'Task 1', '2024-01-15', '2.5'],
                ['uid2', 'T-002', 'Task 2', '2024-01-16', '3.0'],
              ],
            },
            {
              values: [
                ['UID', 'Task Number', 'Description', 'Date', 'Time'],
                ['uid3', 'T-003', 'Task 3', '2024-02-01', '1.5'],
              ],
            },
          ],
        },
      })

      const result = await provider.getAllTasks('sheet123')

      expect(result).toEqual({
        tasks: [
          { uid: 'uid1', number: 'T-001', description: 'Task 1', date: '2024-01-15', time: '2.5' },
          { uid: 'uid2', number: 'T-002', description: 'Task 2', date: '2024-01-16', time: '3.0' },
          { uid: 'uid3', number: 'T-003', description: 'Task 3', date: '2024-02-01', time: '1.5' },
        ],
      })

      expect(mockSheets.spreadsheets.values.batchGet).toHaveBeenCalledWith({
        spreadsheetId: 'sheet123',
        ranges: ['2024-01!A:E', '2024-02!A:E'],
      })
    })

    it('should return empty tasks when no month sheets exist', async () => {
      const mockSpreadsheet = {
        sheets: [
          { properties: { title: 'Sheet1' } },
          { properties: { title: 'Settings' } },
        ],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      const result = await provider.getAllTasks('sheet123')

      expect(result).toEqual({ tasks: [] })
    })

    it('should handle empty value ranges', async () => {
      const mockSpreadsheet = {
        sheets: [{ properties: { title: '2024-01' } }],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.batchGet.mockResolvedValue({
        data: { valueRanges: [] },
      })

      const result = await provider.getAllTasks('sheet123')

      expect(result).toEqual({ tasks: [] })
    })

    it('should handle missing data in rows', async () => {
      const mockSpreadsheet = {
        sheets: [{ properties: { title: '2024-01' } }],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.batchGet.mockResolvedValue({
        data: {
          valueRanges: [
            {
              values: [
                ['UID', 'Task Number', 'Description', 'Date', 'Time'],
                ['uid1', 'T-001'], // Missing description, date, time
                ['uid2'], // Missing everything except uid
              ],
            },
          ],
        },
      })

      const result = await provider.getAllTasks('sheet123')

      expect(result).toEqual({
        tasks: [
          { uid: 'uid1', number: 'T-001', description: '', date: '', time: '' },
          { uid: 'uid2', number: '', description: '', date: '', time: '' },
        ],
      })
    })
  })

  describe('getSheetIdByName', () => {
    it('should throw error when sheet not found', async () => {
      // Mock the values.get call that happens before getSheetIdByName
      mockSheets.spreadsheets.values.get.mockResolvedValue({
        data: {
          values: [['target-uid']],
        },
      })

      // Mock the first spreadsheets.get call (for finding the task)
      const mockSpreadsheet = {
        sheets: [{ properties: { title: 'Sheet1', sheetId: 123 } }],
      }

      // The second get call (inside getSheetIdByName) should return sheets without the target sheet
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: mockSpreadsheet,
      }).mockResolvedValueOnce({
        data: mockSpreadsheet, // Same data, so 'non-existent' sheet won't be found
      })

      const request = {
        sheetId: 'sheet123',
        monthSheetName: 'non-existent',
        uid: 'target-uid',
      }

      await expect(provider.deleteTask(request)).rejects.toThrow('Sheet not found')
    })
  })

  describe('generateUID', () => {
    it('should generate unique UIDs', async () => {
      const mockSpreadsheet = {
        sheets: [{ properties: { title: '2024-01' } }],
      }

      mockSheets.spreadsheets.get.mockResolvedValue({
        data: mockSpreadsheet,
      })

      mockSheets.spreadsheets.values.append.mockResolvedValue({})

      const request = {
        sheetId: 'sheet123',
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
