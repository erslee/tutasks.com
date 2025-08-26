import type { NextApiRequest, NextApiResponse } from "next";
import { getSpreadsheetProvider, handleAuthError } from "../../../lib/auth-utils";
import { checkIdentifierSchema, validateRequestQuery, sendValidationError } from "../../../lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const providerResult = await getSpreadsheetProvider(req, res);
  if (!providerResult.success) {
    return handleAuthError(res, providerResult.error || "Authentication failed");
  }

  const validation = validateRequestQuery(checkIdentifierSchema, req);
  if (!validation.success) {
    return sendValidationError(res, validation.error!);
  }

  const { sheetId } = validation.data!;

  try {
    const result = await providerResult.provider!.checkIdentifier(sheetId as string);
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error("Spreadsheet check-identifier API error:", error);
    res.status(500).json({ error: "Failed to check identifier", details: error instanceof Error ? error.message : String(error) });
  }
} 
