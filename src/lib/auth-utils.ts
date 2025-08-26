import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";
import { createGraphClient } from "./microsoft-auth-utils";
import { createSpreadsheetProvider, type ProviderType, type SpreadsheetProvider } from "./providers";

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  provider?: string;
  oauth2Client?: InstanceType<typeof google.auth.OAuth2>;
  graphClient?: Client;
  error?: string;
}

export async function authenticateRequest(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthResult> {
  const session = await getServerSession(req, res, authOptions);
  const accessToken = session?.accessToken;
  const provider = session?.provider;

  if (!accessToken) {
    return {
      success: false,
      error: "Not authenticated"
    };
  }

  const result: AuthResult = {
    success: true,
    accessToken,
    provider
  };

  if (provider === "azure-ad") {
    // Microsoft provider
    result.graphClient = createGraphClient(accessToken);
  } else {
    // Google provider (default)
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    result.oauth2Client = oauth2Client;
  }

  return result;
}

export function handleAuthError(res: NextApiResponse, error: string) {
  return res.status(401).json({ error });
}

export interface ProviderResult {
  success: boolean;
  provider?: SpreadsheetProvider;
  providerType?: ProviderType;
  error?: string;
}

export async function getSpreadsheetProvider(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<ProviderResult> {
  const authResult = await authenticateRequest(req, res);
  if (!authResult.success) {
    return {
      success: false,
      error: authResult.error || "Authentication failed"
    };
  }

  try {
    let providerType: ProviderType;
    let authClient: InstanceType<typeof google.auth.OAuth2> | Client;

    if (authResult.provider === "azure-ad") {
      providerType = "excel-online";
      authClient = authResult.graphClient!;
    } else {
      // Default to Google Sheets for backward compatibility
      providerType = "google-sheets";
      authClient = authResult.oauth2Client!;
    }

    const provider = createSpreadsheetProvider(providerType, authClient);
    
    return {
      success: true,
      provider,
      providerType
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create provider"
    };
  }
}