import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Apple from "next-auth/providers/apple";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { redeemStudentCode } from "./student-code";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "STUDENT_CODE" | "INSTRUCTOR" | "TEACHER" | "ADMIN";
      username?: string | null;
      preferredLocale: "de" | "en";
    } & DefaultSession["user"];
  }
}

const emailLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

const studentLoginSchema = z.object({
  code: z.string().min(4).max(12),
  username: z.string().min(3).max(40),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/sign-in",
  },
  providers: [
    Google,
    GitHub,
    Apple,
    Credentials({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = emailLoginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    Credentials({
      id: "student-code",
      name: "Classroom code",
      credentials: {
        code: { label: "Class code", type: "text" },
        username: { label: "Username", type: "text" },
      },
      authorize: async (raw) => {
        const parsed = studentLoginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const result = await redeemStudentCode(parsed.data);
        if (!result.ok) return null;
        const user = await prisma.user.findUnique({
          where: { id: result.userId },
        });
        if (!user) return null;
        return {
          id: user.id,
          name: user.username,
          email: null,
          image: null,
        };
      },
    }),
    // SAML/SSO is wired via /api/auth/saml/* (see app/api/auth/saml) using
    // boxyhq/saml-jackson. Provider is added per-Institution at runtime.
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id) {
        const db = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, username: true, preferredLocale: true },
        });
        if (db) {
          token.uid = db.id;
          token.role = db.role;
          token.username = db.username;
          token.locale = db.preferredLocale;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = (token.uid as string) ?? session.user.id;
        session.user.role = (token.role as
          | "STUDENT"
          | "STUDENT_CODE"
          | "INSTRUCTOR"
          | "TEACHER"
          | "ADMIN") ?? "STUDENT";
        session.user.username = (token.username as string | null) ?? null;
        session.user.preferredLocale =
          (token.locale as "de" | "en") ?? "de";
      }
      return session;
    },
  },
});
