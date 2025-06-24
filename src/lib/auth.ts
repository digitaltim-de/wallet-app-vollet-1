import { NextAuthOptions } from "next-auth";
import { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Wallet",
      credentials: {
        address: { label: "Wallet Address", type: "text" },
        encryptedKey: { label: "Encrypted Key", type: "text" },
      },
      async authorize(credentials) {
        // Note: We don't decrypt the key on the server
        // The decryption and verification happens client-side
        // We just check if the credentials exist
        if (!credentials?.address || !credentials?.encryptedKey) {
          return null;
        }

        // Return the user object with the address
        // The actual key verification will happen client-side
        return {
          id: credentials.address,
          address: credentials.address,
          encryptedKey: credentials.encryptedKey,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.address = user.address;
        token.encryptedKey = user.encryptedKey;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.address = token.address as string;
        session.user.encryptedKey = token.encryptedKey as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Extend the next-auth types
declare module "next-auth" {
  interface User {
    address: string;
    encryptedKey: string;
  }

  interface Session {
    user: {
      address: string;
      encryptedKey: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    address: string;
    encryptedKey: string;
  }
}
