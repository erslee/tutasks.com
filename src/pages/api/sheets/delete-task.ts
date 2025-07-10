import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { sheetId, monthSheetName, uid } = req.body;
  if (!sheetId || !monthSheetName || !uid) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    // 1. Get all rows to find the row index with the matching UID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${monthSheetName}!A:A`, // Only fetch UID column
    });
    const rows = response.data.values || [];
    // Find the row index (1-based, including header)
    const rowIndex = rows.findIndex(row => row[0] === uid);
    if (rowIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }
    // 2. Delete the row (rowIndex+1 because Sheets API is 1-based)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: (await getSheetIdByName(sheets, sheetId, monthSheetName)),
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
    res.status(200).json({ success: true });
  } catch (error: unknown) {
    console.error("Google Sheets delete-task API error:", error);
    res.status(500).json({ error: "Failed to delete task", details: error instanceof Error ? error.message : String(error) });
  }
}

// Helper to get the sheetId (number) by sheet/tab name
async function getSheetIdByName(sheets: any, spreadsheetId: string, sheetName: string): Promise<number> {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = (spreadsheet.data.sheets || []).find((s: any) => s.properties?.title === sheetName);
  if (!sheet) throw new Error("Sheet not found");
  return sheet.properties.sheetId;
} 
