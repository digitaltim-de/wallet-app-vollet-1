import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // This is a dummy implementation for wallet app
        // In a real implementation, you would validate against your database
        if (credentials?.username && credentials?.password) {
          return {
            id: "1",
            name: credentials.username,
            email: `${credentials.username}@example.com`,
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/login-or-create',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
export { authOptions }
