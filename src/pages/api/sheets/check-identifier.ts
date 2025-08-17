import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, handleAuthError } from "../../../lib/auth-utils";
import { createSpreadsheetProvider } from "../../../lib/providers";
import { checkIdentifierSchema, validateRequestQuery, sendValidationError } from "../../../lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await authenticateRequest(req, res);
  if (!authResult.success) {
    return handleAuthError(res, authResult.error || "Authentication failed");
  }

  const validation = validateRequestQuery(checkIdentifierSchema, req);
  if (!validation.success) {
    return sendValidationError(res, validation.error!);
  }

  const { sheetId } = validation.data!;

  try {
    const provider = createSpreadsheetProvider("google-sheets", authResult.oauth2Client!);
    const result = await provider.checkIdentifier(sheetId as string);
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error("Google Sheets check-identifier API error:", error);
    res.status(500).json({ error: "Failed to check identifier", details: error instanceof Error ? error.message : String(error) });
  }
} 
