import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

function generateUID() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { sheetId, monthSheetName, number, description, date, time, uid } = req.body;
  if (!sheetId || !monthSheetName || !number || !description || !date || !time) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const taskUID = uid || generateUID();

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const sheetsApi = google.sheets({ version: "v4", auth: oauth2Client });
    // 1. List all sheet/tab names
    const spreadsheet = await sheetsApi.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetNames = (spreadsheet.data.sheets || []).map(s => s.properties?.title);
    // 2. If the month tab does not exist, create it with headers
    if (!sheetNames.includes(monthSheetName)) {
      await sheetsApi.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: monthSheetName },
              },
            },
          ],
        },
      });
      // Add header row
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${monthSheetName}!A1:E1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [["UID", "Task Number", "Description", "Date", "Time"]],
        },
      });
    }
    // 3. Append the new task as a row (UID, Task Number, Description, Date, Time)
    await sheetsApi.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${monthSheetName}!A:E`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[taskUID, number, description, date, time]],
      },
    });
    res.status(200).json({ success: true, uid: taskUID });
  } catch (error: unknown) {
    console.error("Google Sheets add-task API error:", error);
    res.status(500).json({ error: "Failed to add task", details: error instanceof Error ? error.message : String(error) });
  }
} 
