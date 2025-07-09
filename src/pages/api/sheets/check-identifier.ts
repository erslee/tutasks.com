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
    const firstTabName = spreadsheet.data.sheets?.[0]?.properties?.title || "Sheet1";
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId as string,
      range: `${firstTabName}!A1`,
    });
    const value = response.data.values?.[0]?.[0] || "";
    const match = value.match(/^created:tutasks\.com version:(.+)$/);
    if (match) {
      res.status(200).json({ hasIdentifier: true, version: match[1] });
    } else {
      res.status(200).json({ hasIdentifier: false });
    }
  } catch (error) {
    console.error("Google Sheets check-identifier API error:", error);
    res.status(500).json({ error: "Failed to check identifier", details: error instanceof Error ? error.message : error });
  }
} 
