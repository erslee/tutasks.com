import NextAuth, { Account } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { MICROSOFT_SCOPES, refreshMicrosoftToken } from "../../../lib/microsoft-auth-utils";

// --- Add refresh logic ---
async function refreshAccessToken(token: JWT) {
  try {
    if (token.provider === "azure-ad") {
      // Check if we have a refresh token
      if (!token.refreshToken) {
        console.error("No refresh token available for Microsoft account");
        return { ...token, error: "RefreshAccessTokenError" };
      }
      
      const refreshedTokens = await refreshMicrosoftToken(token.refreshToken as string);
      return {
        ...token,
        accessToken: refreshedTokens.accessToken,
        accessTokenExpires: refreshedTokens.expiresAt,
        refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
        error: undefined, // Clear any previous errors
      };
    } else {
      // Google refresh logic
      if (!token.refreshToken) {
        console.error("No refresh token available for Google account");
        return { ...token, error: "RefreshAccessTokenError" };
      }
      
      const url =
        "https://oauth2.googleapis.com/token?" +
        new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken as string,
        });
      const response = await fetch(url, { method: "POST" });
      const refreshedTokens = await response.json();
      if (!response.ok) throw refreshedTokens;
      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        error: undefined, // Clear any previous errors
      };
    }
  } catch (error: unknown) {
    console.error("Error refreshing access token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

// --- Extend types ---
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    provider?: string;
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
      authorization: {
        params: {
          scope: MICROSOFT_SCOPES.join(" "),
          response_type: "code",
          response_mode: "query",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT; user: User }) {
      session.accessToken = token.accessToken as string | undefined;
      session.error = token.error as string | undefined;
      session.provider = token.provider as string | undefined;
      return session;
    },
    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token;
        token.accessTokenExpires = Date.now() + parseInt(account.expires_in as string) * 1000;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
  },
};

export default NextAuth(authOptions);
