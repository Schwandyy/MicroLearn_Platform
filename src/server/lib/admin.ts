import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/sign-in");
  if (session.user.role !== "ADMIN") redirect("/");
  return session;
}

export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}
