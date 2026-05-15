import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            include: {
              progress: { include: { lesson: true } },
              xp: true,
            },
          },
        },
      },
    },
  });
  if (!classroom || classroom.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Simple CSV export (PDF generation will use a worker in Phase 3)
  const rows: string[] = ["Benutzer,Status,Lektionen abgeschlossen,XP gesamt"];
  for (const m of classroom.members) {
    const completed = m.user.progress.filter((p) => p.completedAt).length;
    const xp = m.user.xp.reduce((s, x) => s + x.amount, 0);
    const name = (m.user.username ?? "").replace(/"/g, '""');
    rows.push(`"${name}",${m.isActive ? "aktiv" : "inaktiv"},${completed},${xp}`);
  }
  const csv = rows.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="classroom-${id}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
