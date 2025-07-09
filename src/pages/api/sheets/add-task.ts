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
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    // Append the new task as a row (UID, Task Number, Description, Date, Time)
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${monthSheetName}!A:E`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[taskUID, number, description, date, time]],
      },
    });
    res.status(200).json({ success: true, uid: taskUID });
  } catch (error) {
    console.error("Google Sheets add-task API error:", error);
    res.status(500).json({ error: "Failed to add task", details: error instanceof Error ? error.message : error });
  }
} 
