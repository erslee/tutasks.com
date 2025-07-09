import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { sheetId, monthSheetName } = req.query;
  if (!sheetId || !monthSheetName) {
    return res.status(400).json({ error: "Missing sheetId or monthSheetName" });
  }
  const monthSheet = Array.isArray(monthSheetName) ? monthSheetName[0] : monthSheetName;

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // 1. List all sheet/tab names
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId as string });
    const sheetNames = (spreadsheet.data.sheets || []).map(s => s.properties?.title);

    // 2. If the month tab does not exist, create it with headers
    if (!sheetNames.includes(monthSheet)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId as string,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: monthSheet },
              },
            },
          ],
        },
      });
      // Add header row
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId as string,
        range: `${monthSheet}!A1:E1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [["UID", "Task Number", "Description", "Date", "Time"]],
        },
      });
    }

    // 3. Read tasks as before
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId as string,
      range: `${monthSheet}!A:E`,
    });
    const rows = response.data.values || [];
    // Assume first row is header
    const tasks = rows.slice(1).map(row => ({
      uid: row[0] || "",
      number: row[1] || "",
      description: row[2] || "",
      date: row[3] || "",
      time: row[4] || "",
    }));
    res.status(200).json({ tasks });
  } catch (error) {
    console.error("Google Sheets get-tasks API error:", error);
    res.status(500).json({ error: "Failed to fetch tasks", details: error instanceof Error ? error.message : error });
  }
} 
