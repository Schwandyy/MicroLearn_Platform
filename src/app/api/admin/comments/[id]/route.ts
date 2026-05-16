import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/lib/admin";
import { prisma } from "@/server/db/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  await prisma.comment.delete({ where: { id } }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
