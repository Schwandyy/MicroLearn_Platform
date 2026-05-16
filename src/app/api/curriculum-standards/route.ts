import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const state = sp.get("state") ?? undefined;
  const gradeRaw = sp.get("grade");
  const grade = gradeRaw ? Number.parseInt(gradeRaw, 10) : undefined;
  const subject = sp.get("subject") ?? undefined;

  const standards = await prisma.curriculumStandard.findMany({
    where: {
      state: state || undefined,
      grade: Number.isFinite(grade) ? grade : undefined,
      subject: subject || undefined,
    },
    orderBy: [
      { state: "asc" },
      { grade: "asc" },
      { sortOrder: "asc" },
      { code: "asc" },
    ],
  });

  return NextResponse.json({ standards });
}
