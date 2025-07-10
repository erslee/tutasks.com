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

  const { sheetId } = req.query;
  if (!sheetId) {
    return res.status(400).json({ error: "Missing sheetId" });
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId as string });
    const sheetNames = (spreadsheet.data.sheets || []).map(s => s.properties?.title || '');

    const monthSheetNames = sheetNames.filter(name => /^\d{4}-\d{2}$/.test(name));

    if (monthSheetNames.length === 0) {
      return res.status(200).json({ tasks: [] });
    }

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId as string,
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

    res.status(200).json({ tasks });
  } catch (error: unknown) {
    console.error("Google Sheets get-all-tasks API error:", error);
    res.status(500).json({ error: "Failed to fetch tasks", details: error instanceof Error ? error.message : String(error) });
  }
}
