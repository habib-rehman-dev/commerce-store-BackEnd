import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const nextAuthResult = NextAuth({
  secret: process.env.AUTH_SECRET || "super-secret-auth-key-change-in-production-123456",
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        let response: Response;
        try {
          response = await fetch(
            `${process.env.API_URL || "http://127.0.0.1:8000"}/api/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
              cache: "no-store",
            },
          );
        } catch {
          // An unavailable API must not be surfaced as an Auth.js configuration error.
          return null;
        }
        if (!response.ok) {
          return null;
        }

        const result = await response.json();
        return {
          ...result.user,
          accessToken: result.access_token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google" && user.email) {
          try {
            const response = await fetch(
              `${process.env.API_URL || "http://127.0.0.1:8000"}/api/auth/google`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Internal-Auth-Secret": process.env.AUTH_SECRET || "",
                },
                body: JSON.stringify({
                  email: user.email,
                  name: user.name,
                  image: user.image,
                }),
                cache: "no-store",
              },
            );
            if (response.ok) {
              const result = await response.json();
              token.sub = result.user.id;
              token.role = result.user.role;
              token.accessToken = result.access_token;
            }
          } catch {
            // The Google identity remains valid; API requests will be unavailable until it reconnects.
          }
        } else {
          token.sub = user.id;
          token.role = (user as any).role || "customer";
          token.accessToken = (user as any).accessToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        (session.user as any).role = token.role || "customer";
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});

export const handlers: typeof nextAuthResult.handlers = nextAuthResult.handlers;
export const auth: typeof nextAuthResult.auth = nextAuthResult.auth;
export const signIn: typeof nextAuthResult.signIn = nextAuthResult.signIn;
export const signOut: typeof nextAuthResult.signOut = nextAuthResult.signOut;
