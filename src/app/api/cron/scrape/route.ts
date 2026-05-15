import { NextResponse } from "next/server";
import { runScrapers } from "@/server/scrapers";
import { processQueue } from "@/server/lib/content-pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const scraped = await runScrapers({ perSource: 5 });
  const processed = await processQueue(8);
  return NextResponse.json({ scraped, processed });
}

export { GET as POST };
