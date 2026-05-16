import { NextResponse } from "next/server";
import { runMonthlyParentDigest } from "@/server/lib/monthly-parent-digest";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const result = await runMonthlyParentDigest({ dry });
  return NextResponse.json({ dry, ...result });
}

export { GET as POST };
