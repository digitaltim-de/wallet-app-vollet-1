import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getWallet } from "@/lib/db";

// Configure NextAuth
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Wallet Credentials",
      credentials: {
        address: { label: "Wallet Address", type: "text" },
        encryptedKey: { label: "Encrypted Key", type: "text" },
        passphrase: { label: "Passphrase", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.address || !credentials?.encryptedKey) {
          return null;
        }

        try {
          // Check if the wallet exists in the database
          const wallet = await getWallet(credentials.address);
          
          if (!wallet) {
            return null;
          }

          // We don't decrypt the key here - that happens client-side
          // We just verify that the wallet exists in our database
          
          // Return the user object with the address
          return {
            id: credentials.address,
            address: credentials.address,
            network: wallet.network,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.address = user.address;
        token.network = user.network;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.address = token.address;
        session.user.network = token.network;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Export the NextAuth handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };