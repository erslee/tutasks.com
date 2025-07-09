import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
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
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user }: { session: Session; token: JWT; user: User }) {
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
    async jwt({ token, account }: { token: JWT; account?: any }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
};

export default NextAuth(authOptions); 
