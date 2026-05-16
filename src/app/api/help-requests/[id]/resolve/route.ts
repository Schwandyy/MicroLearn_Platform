import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { resolveHelpRequest } from "@/server/lib/help-requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const result = await resolveHelpRequest({
    helpRequestId: id,
    resolverId: session.user.id,
    resolverRole: session.user.role,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
