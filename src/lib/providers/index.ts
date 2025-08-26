import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";
import { GoogleSheetsProvider } from "./google-sheets-provider";
import { ExcelProvider } from "./excel-provider";
import type { SpreadsheetProvider } from "./types";

export type ProviderType = "google-sheets" | "excel-online";

export function createSpreadsheetProvider(
  type: ProviderType,
  authClient: InstanceType<typeof google.auth.OAuth2> | Client
): SpreadsheetProvider {
  switch (type) {
    case "google-sheets":
      if (!(authClient instanceof google.auth.OAuth2)) {
        throw new Error("Google Sheets provider requires OAuth2 client");
      }
      return new GoogleSheetsProvider(authClient);
    case "excel-online":
      if (!(authClient instanceof Client)) {
        throw new Error("Excel provider requires Microsoft Graph Client");
      }
      return new ExcelProvider(authClient);
    default:
      throw new Error(`Unsupported provider type: ${type}`);
  }
}

export * from "./types";
export { GoogleSheetsProvider, ExcelProvider };