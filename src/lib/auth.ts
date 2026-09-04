import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { config } from "./config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      role: string;
    };
  }

  interface User {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
    newUser: "/auth/welcome",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        // Update last seen
        await prisma.user.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),

    ...(config.github.clientId && config.github.clientSecret
      ? [
          GitHubProvider({
            clientId: config.github.clientId,
            clientSecret: config.github.clientSecret,
          }),
        ]
      : []),

    ...(config.google.clientId && config.google.clientSecret
      ? [
          GoogleProvider({
            clientId: config.google.clientId,
            clientSecret: config.google.clientSecret,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
        token.role = session.role ?? token.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") {
        return true;
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user }) {
      await prisma.user.update({
        where: { id: user.id! },
        data: { lastSeenAt: new Date() },
      });
    },
    async signOut({ token }) {
      // Clean up collaboration sessions on sign out
      await prisma.collaborationSession.deleteMany({
        where: { userId: token.id },
      });
    },
  },
};

// ─── Auth Helpers ────────────────────────────────────────────────────────────

import { getServerSession } from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireOrgMembership(organizationId: string) {
  const session = await requireAuth();

  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error("Not a member of this organization");
  }

  return { session, membership };
}

// ─── Password Utilities ──────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ─── Token Utilities ─────────────────────────────────────────────────────────

import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.auth.secret, {
    expiresIn: "15m",
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.auth.secret, {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.auth.secret) as TokenPayload;
  } catch {
    return null;
  }
}

// ─── API Route Handler Helper ────────────────────────────────────────────────

export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, session: any) => Promise<void>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getAuthSession();

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return handler(req, res, session);
  };
}

// ─── Role Checking ───────────────────────────────────────────────────────────

export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  const hierarchy: Record<string, number> = {
    OWNER: 5,
    ADMIN: 4,
    MEMBER: 3,
    GUEST: 2,
  };

  const userLevel = hierarchy[userRole] ?? 0;
  const requiredLevel = Math.max(...requiredRoles.map((r) => hierarchy[r] ?? 0));

  return userLevel >= requiredLevel;
}

export function isOwner(userId: string, ownerId: string): boolean {
  return userId === ownerId;
}

export function canEdit(role: string): boolean {
  return ["OWNER", "ADMIN", "MEMBER"].includes(role) || role === "EDITOR";
}

export function canComment(role: string): boolean {
  return ["OWNER", "ADMIN", "MEMBER", "EDITOR", "COMMENTER"].includes(role);
}

export function canView(role: string): boolean {
  return ["OWNER", "ADMIN", "MEMBER", "EDITOR", "COMMENTER", "VIEWER", "GUEST"].includes(role);
}

// ─── Session Type Guards ─────────────────────────────────────────────────────

export function isAuthenticated(session: any): session is { user: { id: string; email: string; role: string } } {
  return !!session?.user?.id;
}

export function isAdmin(session: any): boolean {
  return session?.user?.role === "ADMIN" || session?.user?.role === "OWNER";
}

export function isOwnerOfDocument(session: any, ownerId: string): boolean {
  return session?.user?.id === ownerId;
}
