import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};

  // DB connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch {
    checks.db = "error";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", checks, ts: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
