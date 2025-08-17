import { z } from "zod";

// Base schemas
export const sheetIdSchema = z.string().min(1, "Sheet ID is required");
export const monthSheetNameSchema = z.string().min(1, "Month sheet name is required");
export const uidSchema = z.string().min(1, "UID is required");
export const taskNumberSchema = z.string().min(1, "Task number is required");
export const taskDescriptionSchema = z.string().min(1, "Task description is required");
export const taskDateSchema = z.string().min(1, "Task date is required");
export const taskTimeSchema = z.string().min(1, "Task time is required");

// Request schemas for API endpoints

// POST /api/sheets/add-task
export const addTaskSchema = z.object({
  sheetId: sheetIdSchema,
  monthSheetName: monthSheetNameSchema,
  number: taskNumberSchema,
  description: taskDescriptionSchema,
  date: taskDateSchema,
  time: taskTimeSchema,
  uid: z.string().optional(),
});

// POST /api/sheets/batch-append
export const batchAppendSchema = z.object({
  sheetId: sheetIdSchema,
  monthSheetName: monthSheetNameSchema,
  values: z.array(z.array(z.string())).min(1, "Values array cannot be empty"),
});

// GET /api/sheets/check-identifier (query params)
export const checkIdentifierSchema = z.object({
  sheetId: sheetIdSchema,
});

// POST /api/sheets/create
export const createSheetSchema = z.object({
  name: z.string().min(1, "Sheet name is required"),
});

// POST /api/sheets/delete-task
export const deleteTaskSchema = z.object({
  sheetId: sheetIdSchema,
  monthSheetName: monthSheetNameSchema,
  uid: uidSchema,
});

// GET /api/sheets/get-all-tasks (query params)
export const getAllTasksSchema = z.object({
  sheetId: sheetIdSchema,
});

// GET /api/sheets/list (no parameters needed)
export const listSheetsSchema = z.object({});

// POST /api/sheets/update-task
export const updateTaskSchema = z.object({
  sheetId: sheetIdSchema,
  monthSheetName: monthSheetNameSchema,
  uid: uidSchema,
  number: taskNumberSchema,
  description: taskDescriptionSchema,
  date: taskDateSchema,
  time: taskTimeSchema,
});

// Types derived from schemas
export type AddTaskRequest = z.infer<typeof addTaskSchema>;
export type BatchAppendRequest = z.infer<typeof batchAppendSchema>;
export type CheckIdentifierRequest = z.infer<typeof checkIdentifierSchema>;
export type CreateSheetRequest = z.infer<typeof createSheetSchema>;
export type DeleteTaskRequest = z.infer<typeof deleteTaskSchema>;
export type GetAllTasksRequest = z.infer<typeof getAllTasksSchema>;
export type UpdateTaskRequest = z.infer<typeof updateTaskSchema>;