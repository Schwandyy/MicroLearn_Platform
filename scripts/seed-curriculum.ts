import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import path from "node:path";

type Entry = {
  state: string;
  country?: string;
  grade: number;
  subject: string;
  code: string;
  title_de: string;
  title_en: string;
  description_de?: string;
  description_en?: string;
  sortOrder?: number;
};

async function main() {
  const prisma = new PrismaClient();
  const file = path.join(
    process.cwd(),
    "prisma",
    "curriculum-standards.json",
  );
  const raw = await fs.readFile(file, "utf-8");
  const entries = JSON.parse(raw) as Entry[];

  for (const e of entries) {
    const data = {
      country: e.country ?? "DE",
      state: e.state,
      grade: e.grade,
      subject: e.subject,
      code: e.code,
      title_de: e.title_de,
      title_en: e.title_en,
      description_de: e.description_de ?? null,
      description_en: e.description_en ?? null,
      sortOrder: e.sortOrder ?? 0,
    };
    await prisma.curriculumStandard.upsert({
      where: { state_code: { state: e.state, code: e.code } },
      create: data,
      update: data,
    });
  }

  const total = await prisma.curriculumStandard.count();
  console.log(
    `✓ Curriculum standards: ${entries.length} processed, ${total} total in DB`,
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
