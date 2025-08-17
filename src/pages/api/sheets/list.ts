import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, handleAuthError } from "../../../lib/auth-utils";
import { createSpreadsheetProvider } from "../../../lib/providers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await authenticateRequest(req, res);
  if (!authResult.success) {
    return handleAuthError(res, authResult.error || "Authentication failed");
  }

  try {
    const provider = createSpreadsheetProvider("google-sheets", authResult.oauth2Client!);
    const sheets = await provider.listSpreadsheets();
    res.status(200).json({ sheets });
  } catch (error: unknown) {
    console.error("Google Sheets API error:", error);
    res.status(500).json({ error: "Failed to fetch sheets", details: error instanceof Error ? error.message : String(error) });
  }
} 
