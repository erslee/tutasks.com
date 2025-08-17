import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, handleAuthError } from "../../../lib/auth-utils";
import { createSpreadsheetProvider } from "../../../lib/providers";
import { createSheetSchema, validateRequestBody, sendValidationError } from "../../../lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await authenticateRequest(req, res);
  if (!authResult.success) {
    return handleAuthError(res, authResult.error || "Authentication failed");
  }

  const validation = validateRequestBody(createSheetSchema, req);
  if (!validation.success) {
    return sendValidationError(res, validation.error!);
  }

  const { name } = validation.data!;
  const sheetTitle = name.trim() || "New Task Sheet";

  try {
    const provider = createSpreadsheetProvider("google-sheets", authResult.oauth2Client!);
    const result = await provider.createSpreadsheet({ name: sheetTitle });
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error("Google Sheets Create API error:", error);
    res.status(500).json({ error: "Failed to create sheet", details: error instanceof Error ? error.message : String(error) });
  }
} 
