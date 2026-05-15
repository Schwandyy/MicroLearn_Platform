import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { reindexAll } from "@/server/lib/meilisearch";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await reindexAll();
  return NextResponse.json(result);
}
