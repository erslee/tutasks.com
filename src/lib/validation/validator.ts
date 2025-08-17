import { z } from "zod";
import type { NextApiRequest, NextApiResponse } from "next";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  req: NextApiRequest
): ValidationResult<T> {
  try {
    const data = schema.parse(req.body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      return { success: false, error: errorMessages };
    }
    return { success: false, error: "Invalid request body" };
  }
}

export function validateRequestQuery<T>(
  schema: z.ZodSchema<T>,
  req: NextApiRequest
): ValidationResult<T> {
  try {
    const data = schema.parse(req.query);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      return { success: false, error: errorMessages };
    }
    return { success: false, error: "Invalid query parameters" };
  }
}

export function sendValidationError(res: NextApiResponse, error: string) {
  return res.status(400).json({ error: `Validation error: ${error}` });
}