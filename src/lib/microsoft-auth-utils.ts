import { Client } from "@microsoft/microsoft-graph-client";

// Microsoft OAuth2 endpoints and configuration
export const MICROSOFT_TOKEN_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

// Required scopes for Excel Online operations
export const MICROSOFT_SCOPES = [
  "Files.ReadWrite",
  "Sites.Read.All",
  "offline_access",
  "openid",
  "profile",
  "email"
];

export interface MicrosoftTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

/**
 * Creates a Microsoft Graph client using an access token
 */
export function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: async (done) => {
      done(null, accessToken);
    }
  });
}

/**
 * Refreshes a Microsoft access token using a refresh token
 * Note: For server-side applications, NextAuth handles token refresh automatically
 * This function is simplified to work with the NextAuth token refresh flow
 */
export async function refreshMicrosoftToken(refreshToken: string): Promise<MicrosoftTokens> {
  try {
    console.log("Attempting to refresh Microsoft token...");
    
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: MICROSOFT_SCOPES.join(" "),
    });

    const response = await fetch(MICROSOFT_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const tokens = await response.json();
    
    if (!response.ok) {
      console.error("Token refresh failed with response:", {
        status: response.status,
        statusText: response.statusText,
        error: tokens.error,
        error_description: tokens.error_description,
        error_codes: tokens.error_codes,
        correlation_id: tokens.correlation_id
      });
      throw new Error(`Token refresh failed: ${tokens.error_description || tokens.error}`);
    }

    console.log("Microsoft token refresh successful");
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken, // Use new refresh token if provided
      expiresAt: Date.now() + (tokens.expires_in * 1000), // Convert seconds to milliseconds
    };
  } catch (error) {
    console.error("Error refreshing Microsoft access token:", error);
    throw new Error("Failed to refresh Microsoft access token");
  }
}

/**
 * Validates Microsoft access token by making a test call to Graph API
 */
export async function validateMicrosoftToken(accessToken: string): Promise<boolean> {
  try {
    const client = createGraphClient(accessToken);
    await client.api("/me").get();
    return true;
  } catch {
    return false;
  }
}