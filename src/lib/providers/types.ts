export interface Task {
  uid: string;
  number: string;
  description: string;
  date: string;
  time: string;
}

export interface SpreadsheetMetadata {
  id: string;
  name: string;
}

import type {
  CreateSheetRequest,
  AddTaskRequest as ZodAddTaskRequest,
  UpdateTaskRequest as ZodUpdateTaskRequest,
  DeleteTaskRequest as ZodDeleteTaskRequest,
  BatchAppendRequest as ZodBatchAppendRequest,
} from "../validation";

export type CreateSpreadsheetRequest = CreateSheetRequest

export type AddTaskRequest = ZodAddTaskRequest

export type UpdateTaskRequest = ZodUpdateTaskRequest

export type DeleteTaskRequest = ZodDeleteTaskRequest

export type BatchAppendRequest = ZodBatchAppendRequest

export interface CheckIdentifierResult {
  hasIdentifier: boolean;
  version?: string;
}

export interface SpreadsheetProvider {
  listSpreadsheets(): Promise<SpreadsheetMetadata[]>;
  createSpreadsheet(request: CreateSpreadsheetRequest): Promise<SpreadsheetMetadata>;
  checkIdentifier(sheetId: string): Promise<CheckIdentifierResult>;
  addTask(request: AddTaskRequest): Promise<{ success: boolean; uid: string }>;
  updateTask(request: UpdateTaskRequest): Promise<{ success: boolean }>;
  deleteTask(request: DeleteTaskRequest): Promise<{ success: boolean }>;
  batchAppend(request: BatchAppendRequest): Promise<{ success: boolean }>;
  getAllTasks(sheetId: string): Promise<{ tasks: Task[] }>;
}
