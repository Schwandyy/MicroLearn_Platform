import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import {
  raiseStudentHelp,
  listOpenHelpRequestsForTeacher,
} from "@/server/lib/help-requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  lessonId: z.string().cuid(),
  message: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const created = await raiseStudentHelp({
    studentId: session.user.id,
    lessonId: parsed.data.lessonId,
    message: parsed.data.message ?? null,
  });
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEACHER" && role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "de";
  const rows = await listOpenHelpRequestsForTeacher({
    teacherId: session.user.id,
    role,
    locale,
  });
  return NextResponse.json({ requests: rows });
}
