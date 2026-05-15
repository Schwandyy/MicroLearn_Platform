import { NextResponse } from "next/server";
import { search } from "@/server/lib/meilisearch";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const locale = (url.searchParams.get("locale") ?? "de") as "de" | "en";
  if (!q) return NextResponse.json({ lessons: [], paths: [], projects: [] });
  const results = await search(q, locale);
  return NextResponse.json(results);
}
