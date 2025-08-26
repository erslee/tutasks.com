import type { NextApiRequest, NextApiResponse } from "next";
import { getSpreadsheetProvider, handleAuthError } from "../../../lib/auth-utils";
import { addTaskSchema, validateRequestBody, sendValidationError } from "../../../lib/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const providerResult = await getSpreadsheetProvider(req, res);
  if (!providerResult.success) {
    return handleAuthError(res, providerResult.error || "Authentication failed");
  }

  const validation = validateRequestBody(addTaskSchema, req);
  if (!validation.success) {
    return sendValidationError(res, validation.error!);
  }

  const { sheetId, monthSheetName, number, description, date, time, uid } = validation.data!;

  try {
    const result = await providerResult.provider!.addTask({
      sheetId,
      monthSheetName,
      number,
      description,
      date,
      time,
      uid
    });
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error("Spreadsheet add-task API error:", error);
    res.status(500).json({ error: "Failed to add task", details: error instanceof Error ? error.message : String(error) });
  }
} 
