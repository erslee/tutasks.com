import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, handleAuthError } from "../../../lib/auth-utils";
import { createSpreadsheetProvider } from "../../../lib/providers";
import { updateTaskSchema, validateRequestBody, sendValidationError } from "../../../lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await authenticateRequest(req, res);
  if (!authResult.success) {
    return handleAuthError(res, authResult.error || "Authentication failed");
  }

  const validation = validateRequestBody(updateTaskSchema, req);
  if (!validation.success) {
    return sendValidationError(res, validation.error!);
  }

  const { sheetId, monthSheetName, uid, number, description, date, time } = validation.data!;

  try {
    const provider = createSpreadsheetProvider("google-sheets", authResult.oauth2Client!);
    const result = await provider.updateTask({
      sheetId,
      monthSheetName,
      uid,
      number,
      description,
      date,
      time
    });
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error("Google Sheets update-task API error:", error);
    res.status(500).json({ error: "Failed to update task", details: error instanceof Error ? error.message : String(error) });
  }
} 
