import type { NextApiRequest, NextApiResponse } from "next";
import { getSpreadsheetProvider, handleAuthError } from "../../../lib/auth-utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const providerResult = await getSpreadsheetProvider(req, res);
  if (!providerResult.success) {
    return handleAuthError(res, providerResult.error || "Authentication failed");
  }

  try {
    const sheets = await providerResult.provider!.listSpreadsheets();
    res.status(200).json({ sheets });
  } catch (error: unknown) {
    console.error("Spreadsheet API error:", error);
    res.status(500).json({ 
      error: "Failed to fetch spreadsheets", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
} 
