import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  oauth2Client?: InstanceType<typeof google.auth.OAuth2>;
  error?: string;
}

export async function authenticateRequest(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthResult> {
  const session = await getServerSession(req, res, authOptions);
  const accessToken = session?.accessToken;

  if (!accessToken) {
    return {
      success: false,
      error: "Not authenticated"
    };
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  return {
    success: true,
    accessToken,
    oauth2Client
  };
}

export function handleAuthError(res: NextApiResponse, error: string) {
  return res.status(401).json({ error });
}