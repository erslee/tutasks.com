import { Client } from "@microsoft/microsoft-graph-client";
import type {
  SpreadsheetProvider,
  SpreadsheetMetadata,
  CreateSpreadsheetRequest,
  AddTaskRequest,
  UpdateTaskRequest,
  DeleteTaskRequest,
  BatchAppendRequest,
  CheckIdentifierResult,
  Task
} from "./types";

const APP_VERSION = "1.0.0";

export class ExcelProvider implements SpreadsheetProvider {
  constructor(private graphClient: Client) {}

  async listSpreadsheets(): Promise<SpreadsheetMetadata[]> {
    const response = await this.graphClient
      .api('/me/drive/root/search(q=\'*.xlsx\')')
      .get();
    
    return (response.value || [])
      .filter((file: unknown) => {
        const fileObj = file as { file?: object; name?: string }
        return fileObj.file && fileObj.name?.endsWith('.xlsx')
      })
      .map((file: unknown) => {
        const fileObj = file as { id: string; name: string }
        return {
          id: fileObj.id,
          name: fileObj.name.replace('.xlsx', '')
        }
      });
  }

  async createSpreadsheet(request: CreateSpreadsheetRequest): Promise<SpreadsheetMetadata> {
    const sheetTitle = request.name.trim() || "New Task Sheet";
    
    // Create a new workbook
    const workbook = await this.graphClient
      .api('/me/drive/root/children')
      .post({
        name: `${sheetTitle}.xlsx`,
        file: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      });

    // Get the workbook and add our identifier to cell A1
    await this.graphClient
      .api(`/me/drive/items/${workbook.id}/workbook/worksheets/Sheet1/range(address='A1')`)
      .patch({
        values: [[`created:tutasks.com version:${APP_VERSION}`]]
      });
    
    return {
      id: workbook.id,
      name: sheetTitle
    };
  }

  async checkIdentifier(sheetId: string): Promise<CheckIdentifierResult> {
    try {
      // Check if this looks like a Google Sheets ID (no exclamation marks, no hyphens, all alphanumeric)
      if (sheetId && sheetId.length > 30 && !sheetId.includes('!') && !sheetId.includes('-') && /^[a-zA-Z0-9_]+$/.test(sheetId)) {
        return { hasIdentifier: false };
      }

      const response = await this.graphClient
        .api(`/me/drive/items/${sheetId}/workbook/worksheets/Sheet1/range(address='A1')`)
        .get();
      
      const value = response.values?.[0]?.[0] || "";
      const match = value.match(/^created:tutasks\.com version:(.+)$/);
      
      if (match) {
        return { hasIdentifier: true, version: match[1] };
      } else {
        return { hasIdentifier: false };
      }
    } catch {
      return { hasIdentifier: false };
    }
  }

  async addTask(request: AddTaskRequest): Promise<{ success: boolean; uid: string }> {
    const taskUID = request.uid || this.generateUID();
    
    // 1. Check if the worksheet exists, create if not
    await this.ensureWorksheetExists(request.sheetId, request.monthSheetName);
    
    // 2. Find the next empty row and add the task
    // First, get the used range to find the last row
    let lastRow = 1; // Start after header row
    try {
      const usedRangeResponse = await this.graphClient
        .api(`/me/drive/items/${request.sheetId}/workbook/worksheets/${request.monthSheetName}/usedRange`)
        .get();
      
      if (usedRangeResponse.rowCount) {
        lastRow = usedRangeResponse.rowCount;
      }
    } catch {
      // If no used range, start at row 2 (after header)
      lastRow = 1;
    }
    
    // Add the task to the next row
    const nextRow = lastRow + 1;
    const range = `A${nextRow}:E${nextRow}`;
    
    await this.graphClient
      .api(`/me/drive/items/${request.sheetId}/workbook/worksheets/${request.monthSheetName}/range(address='${range}')`)
      .patch({
        values: [[taskUID, request.number, request.description, request.date, request.time]]
      });
    
    return { success: true, uid: taskUID };
  }

  async updateTask(request: UpdateTaskRequest): Promise<{ success: boolean }> {
    // 1. Find the row with the matching UID
    const rowIndex = await this.findTaskRowIndex(request.sheetId, request.monthSheetName, request.uid);
    
    if (rowIndex === -1) {
      throw new Error("Task not found");
    }
    
    // 2. Update the row (Excel uses 1-based indexing)
    const range = `A${rowIndex + 1}:E${rowIndex + 1}`;
    await this.graphClient
      .api(`/me/drive/items/${request.sheetId}/workbook/worksheets/${request.monthSheetName}/range(address='${range}')`)
      .patch({
        values: [[request.uid, request.number, request.description, request.date, request.time]]
      });
    
    return { success: true };
  }

  async deleteTask(request: DeleteTaskRequest): Promise<{ success: boolean }> {
    // 1. Find the row with the matching UID
    const rowIndex = await this.findTaskRowIndex(request.sheetId, request.monthSheetName, request.uid);
    
    if (rowIndex === -1) {
      throw new Error("Task not found");
    }
    
    // 2. Delete the row by clearing its contents and then deleting the entire row
    // Excel uses 1-based indexing, so add 1 to the 0-based index
    const rowNumber = rowIndex + 1;
    
    // Delete the entire row using the deleteShift method
    await this.graphClient
      .api(`/me/drive/items/${request.sheetId}/workbook/worksheets/${request.monthSheetName}/range(address='${rowNumber}:${rowNumber}')/delete`)
      .post({
        shift: "Up"
      });
    
    return { success: true };
  }

  async batchAppend(request: BatchAppendRequest): Promise<{ success: boolean }> {
    // 1. Check if the worksheet exists, create if not
    await this.ensureWorksheetExists(request.sheetId, request.monthSheetName);
    
    // 2. Find the next empty row
    let lastRow = 1; // Start after header row
    try {
      const usedRangeResponse = await this.graphClient
        .api(`/me/drive/items/${request.sheetId}/workbook/worksheets/${request.monthSheetName}/usedRange`)
        .get();
      
      if (usedRangeResponse.rowCount) {
        lastRow = usedRangeResponse.rowCount;
      }
    } catch {
      // If no used range, start at row 2 (after header)
      lastRow = 1;
    }
    
    // 3. Batch append all rows starting from the next row
    const startRow = lastRow + 1;
    const endRow = startRow + request.values.length - 1;
    const range = `A${startRow}:E${endRow}`;
    
    await this.graphClient
      .api(`/me/drive/items/${request.sheetId}/workbook/worksheets/${request.monthSheetName}/range(address='${range}')`)
      .patch({
        values: request.values
      });
    
    return { success: true };
  }

  async getAllTasks(sheetId: string): Promise<{ tasks: Task[] }> {
    try {
      // Check if this looks like a Google Sheets ID (no exclamation marks, no hyphens, all alphanumeric)
      if (sheetId && sheetId.length > 30 && !sheetId.includes('!') && !sheetId.includes('-') && /^[a-zA-Z0-9_]+$/.test(sheetId)) {
        throw new Error(`Invalid Excel file ID: This appears to be a Google Sheets ID. Please select an Excel file instead.`);
      }

      // 1. Get all worksheets
      const worksheetsResponse = await this.graphClient
        .api(`/me/drive/items/${sheetId}/workbook/worksheets`)
        .get();
      
      const worksheets = worksheetsResponse.value || [];
      const monthWorksheets = worksheets.filter((ws: { name: string }) => /^\d{4}-\d{2}$/.test(ws.name));
      
      if (monthWorksheets.length === 0) {
        return { tasks: [] };
      }
      
      // 2. Get all tasks from month worksheets
      const tasks: Task[] = [];
      
      for (const worksheet of monthWorksheets) {
        try {
          const rangeResponse = await this.graphClient
            .api(`/me/drive/items/${sheetId}/workbook/worksheets/${worksheet.name}/usedRange`)
            .get();
          
          const rows = rangeResponse.values || [];
          const taskRows = rows.slice(1); // Skip header row
          
          taskRows.forEach((row: unknown[]) => {
            tasks.push({
              uid: String(row[0] || ""),
              number: String(row[1] || ""),
              description: String(row[2] || ""),
              date: this.excelDateToString(row[3]),
              time: this.excelTimeToString(row[4]),
            });
          });
        } catch {
          // Skip worksheets that might have errors
          continue;
        }
      }
      
      return { tasks };
    } catch (error) {
      console.error("Excel getAllTasks error:", error);
      throw error;
    }
  }

  private generateUID(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  /**
   * Converts Excel date serial number to YYYY-MM-DD format
   * Excel stores dates as the number of days since January 1, 1900
   */
  private excelDateToString(serialNumber: unknown): string {
    if (typeof serialNumber === 'string') {
      // If it's already a string, return as-is
      return serialNumber;
    }
    
    if (typeof serialNumber === 'number' && serialNumber > 1) {
      // Excel epoch: January 1, 1900 (but Excel incorrectly treats 1900 as a leap year)
      // So we need to subtract 2 days to get the correct date
      const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
      const date = new Date(excelEpoch.getTime() + (serialNumber * 24 * 60 * 60 * 1000));
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    }
    
    return String(serialNumber || '');
  }

  /**
   * Converts Excel time decimal to hours format
   * Excel stores time as decimal fraction of a day (e.g., 0.5 = 12 hours, 4 = 96 hours)
   */
  private excelTimeToString(timeDecimal: unknown): string {
    if (typeof timeDecimal === 'string') {
      // If it's already a string, return as-is
      return timeDecimal;
    }
    
    if (typeof timeDecimal === 'number') {
      // Convert decimal to hours (could be more than 24 for total time worked)
      return timeDecimal.toString();
    }
    
    return String(timeDecimal || '');
  }

  /**
   * Converts date string to Excel date format for writing
   */
  private stringToExcelDate(dateString: string): string | number {
    // If the string looks like a date (YYYY-MM-DD), keep it as string
    // Excel will auto-convert it to serial number
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    return dateString;
  }

  private async ensureWorksheetExists(sheetId: string, worksheetName: string): Promise<void> {
    try {
      // Check if worksheet exists
      await this.graphClient
        .api(`/me/drive/items/${sheetId}/workbook/worksheets/${worksheetName}`)
        .get();
    } catch {
      // Worksheet doesn't exist, create it
      await this.graphClient
        .api(`/me/drive/items/${sheetId}/workbook/worksheets`)
        .post({
          name: worksheetName
        });
      
      // Add header row
      await this.graphClient
        .api(`/me/drive/items/${sheetId}/workbook/worksheets/${worksheetName}/range(address='A1:E1')`)
        .patch({
          values: [["UID", "Task Number", "Description", "Date", "Time"]]
        });
    }
  }

  private async findTaskRowIndex(sheetId: string, worksheetName: string, uid: string): Promise<number> {
    try {
      const rangeResponse = await this.graphClient
        .api(`/me/drive/items/${sheetId}/workbook/worksheets/${worksheetName}/range(address='A:A')`)
        .get();
      
      const rows = rangeResponse.values || [];
      return rows.findIndex((row: unknown[]) => {
        const rowArray = row as string[]
        return rowArray[0] === uid
      });
    } catch {
      return -1;
    }
  }
}