import type { NextApiRequest, NextApiResponse } from "next";
import { getSpreadsheetProvider, handleAuthError } from "../../../lib/auth-utils";
import { createSheetSchema, validateRequestBody, sendValidationError } from "../../../lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const providerResult = await getSpreadsheetProvider(req, res);
  if (!providerResult.success) {
    return handleAuthError(res, providerResult.error || "Authentication failed");
  }

  const validation = validateRequestBody(createSheetSchema, req);
  if (!validation.success) {
    return sendValidationError(res, validation.error!);
  }

  const { name } = validation.data!;
  const sheetTitle = name.trim() || "New Task Sheet";

  try {
    const result = await providerResult.provider!.createSpreadsheet({ name: sheetTitle });
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error("Spreadsheet Create API error:", error);
    res.status(500).json({ 
      error: "Failed to create spreadsheet", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
} 
