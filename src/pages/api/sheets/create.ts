import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

const APP_VERSION = "1.0.0";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { name } = req.body;
  const sheetTitle = typeof name === "string" && name.trim() ? name.trim() : "New Task Sheet";

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: sheetTitle },
      },
    });
    const spreadsheet = response.data;
    // Write identifier to the first tab (cell A1)
    const firstTabName = spreadsheet.sheets?.[0]?.properties?.title || "Sheet1";
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet.spreadsheetId!,
      range: `${firstTabName}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[`created:tutasks.com version:${APP_VERSION}`]],
      },
    });
    res.status(200).json({ id: spreadsheet.spreadsheetId, name: spreadsheet.properties?.title });
  } catch (error: unknown) {
    console.error("Google Sheets Create API error:", error);
    res.status(500).json({ error: "Failed to create sheet", details: error instanceof Error ? error.message : String(error) });
  }
} 
