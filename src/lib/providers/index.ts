import { google } from "googleapis";
import { GoogleSheetsProvider } from "./google-sheets-provider";
import type { SpreadsheetProvider } from "./types";

export type ProviderType = "google-sheets";

export function createSpreadsheetProvider(
  type: ProviderType,
  oauth2Client: InstanceType<typeof google.auth.OAuth2>
): SpreadsheetProvider {
  switch (type) {
    case "google-sheets":
      return new GoogleSheetsProvider(oauth2Client);
    default:
      throw new Error(`Unsupported provider type: ${type}`);
  }
}

export * from "./types";
export { GoogleSheetsProvider };