import { google, sheets_v4 } from "googleapis";
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

export class GoogleSheetsProvider implements SpreadsheetProvider {
  constructor(private oauth2Client: InstanceType<typeof google.auth.OAuth2>) {}

  async listSpreadsheets(): Promise<SpreadsheetMetadata[]> {
    const drive = google.drive({ version: "v3", auth: this.oauth2Client });
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: "files(id, name)",
    });
    
    return (response.data.files || []).map(file => ({
      id: file.id!,
      name: file.name!
    }));
  }

  async createSpreadsheet(request: CreateSpreadsheetRequest): Promise<SpreadsheetMetadata> {
    const sheets = google.sheets({ version: "v4", auth: this.oauth2Client });
    const sheetTitle = request.name.trim() || "New Task Sheet";
    
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: sheetTitle },
      },
    });
    
    const spreadsheet = response.data;
    const firstTabName = spreadsheet.sheets?.[0]?.properties?.title || "Sheet1";
    
    // Write identifier to the first tab (cell A1)
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet.spreadsheetId!,
      range: `${firstTabName}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[`created:tutasks.com version:${APP_VERSION}`]],
      },
    });
    
    return {
      id: spreadsheet.spreadsheetId!,
      name: spreadsheet.properties?.title || ''
    };
  }

  async checkIdentifier(sheetId: string): Promise<CheckIdentifierResult> {
    const sheets = google.sheets({ version: "v4", auth: this.oauth2Client });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const firstTabName = spreadsheet.data.sheets?.[0]?.properties?.title || "Sheet1";
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${firstTabName}!A1`,
    });
    
    const value = response.data.values?.[0]?.[0] || "";
    const match = value.match(/^created:tutasks\.com version:(.+)$/);
    
    if (match) {
      return { hasIdentifier: true, version: match[1] };
    } else {
      return { hasIdentifier: false };
    }
  }

  async addTask(request: AddTaskRequest): Promise<{ success: boolean; uid: string }> {
    const sheets = google.sheets({ version: "v4", auth: this.oauth2Client });
    const taskUID = request.uid || this.generateUID();
    
    // 1. List all sheet/tab names
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: request.sheetId });
    const sheetNames = (spreadsheet.data.sheets || []).map(s => s.properties?.title);
    
    // 2. If the month tab does not exist, create it with headers
    if (!sheetNames.includes(request.monthSheetName)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: request.sheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: request.monthSheetName },
              },
            },
          ],
        },
      });
      
      // Add header row
      await sheets.spreadsheets.values.update({
        spreadsheetId: request.sheetId,
        range: `${request.monthSheetName}!A1:E1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [["UID", "Task Number", "Description", "Date", "Time"]],
        },
      });
    }
    
    // 3. Append the new task as a row
    await sheets.spreadsheets.values.append({
      spreadsheetId: request.sheetId,
      range: `${request.monthSheetName}!A:E`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[taskUID, request.number, request.description, request.date, request.time]],
      },
    });
    
    return { success: true, uid: taskUID };
  }

  async updateTask(request: UpdateTaskRequest): Promise<{ success: boolean }> {
    const sheets = google.sheets({ version: "v4", auth: this.oauth2Client });
    
    // 1. Get all rows to find the row index with the matching UID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: request.sheetId,
      range: `${request.monthSheetName}!A:A`,
    });
    
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === request.uid);
    
    if (rowIndex === -1) {
      throw new Error("Task not found");
    }
    
    // 2. Update the row
    await sheets.spreadsheets.values.update({
      spreadsheetId: request.sheetId,
      range: `${request.monthSheetName}!A${rowIndex + 1}:E${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[request.uid, request.number, request.description, request.date, request.time]],
      },
    });
    
    return { success: true };
  }

  async deleteTask(request: DeleteTaskRequest): Promise<{ success: boolean }> {
    const sheets = google.sheets({ version: "v4", auth: this.oauth2Client });
    
    // 1. Get all rows to find the row index with the matching UID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: request.sheetId,
      range: `${request.monthSheetName}!A:A`,
    });
    
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === request.uid);
    
    if (rowIndex === -1) {
      throw new Error("Task not found");
    }
    
    // 2. Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: request.sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: await this.getSheetIdByName(sheets, request.sheetId, request.monthSheetName),
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
    
    return { success: true };
  }

  async batchAppend(request: BatchAppendRequest): Promise<{ success: boolean }> {
    const sheets = google.sheets({ version: "v4", auth: this.oauth2Client });
    
    // 1. List all sheet/tab names
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: request.sheetId });
    const sheetNames = (spreadsheet.data.sheets || []).map(s => s.properties?.title);
    
    // 2. If the month tab does not exist, create it with headers
    if (!sheetNames.includes(request.monthSheetName)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: request.sheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: request.monthSheetName },
              },
            },
          ],
        },
      });
      
      // Add header row
      await sheets.spreadsheets.values.update({
        spreadsheetId: request.sheetId,
        range: `${request.monthSheetName}!A1:E1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [["UID", "Task Number", "Description", "Date", "Time"]],
        },
      });
    }
    
    // 3. Batch append all rows
    await sheets.spreadsheets.values.append({
      spreadsheetId: request.sheetId,
      range: `${request.monthSheetName}!A:E`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: request.values,
      },
    });
    
    return { success: true };
  }

  async getAllTasks(sheetId: string): Promise<{ tasks: Task[] }> {
    const sheets = google.sheets({ version: "v4", auth: this.oauth2Client });
    
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetNames = (spreadsheet.data.sheets || []).map(s => s.properties?.title || '');
    
    const monthSheetNames = sheetNames.filter(name => /^\d{4}-\d{2}$/.test(name));
    
    if (monthSheetNames.length === 0) {
      return { tasks: [] };
    }
    
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges: monthSheetNames.map(name => `${name}!A:E`),
    });
    
    const valueRanges = response.data.valueRanges || [];
    const tasks = valueRanges.flatMap(range => {
      const rows = range.values || [];
      return rows.slice(1).map(row => ({
        uid: row[0] || "",
        number: row[1] || "",
        description: row[2] || "",
        date: row[3] || "",
        time: row[4] || "",
      }));
    });
    
    return { tasks };
  }

  private generateUID(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  private async getSheetIdByName(sheets: sheets_v4.Sheets, spreadsheetId: string, sheetName: string): Promise<number> {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = (spreadsheet.data.sheets || []).find((s) => s.properties?.title === sheetName);
    if (!sheet) throw new Error("Sheet not found");
    return sheet?.properties?.sheetId || 0;
  }
}
