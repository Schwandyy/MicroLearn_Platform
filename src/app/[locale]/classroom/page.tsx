import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/server/db/prisma";
import { getUserEntitlement } from "@/server/lib/access";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateClassroomForm } from "@/components/classroom/create-classroom-form";
import { ClassroomList } from "@/components/classroom/classroom-list";
import { GraduationCap } from "lucide-react";

export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("classroom");

  const session = await requireSession({
    locale,
    callbackPath: `/${locale}/classroom`,
  });

  const entitlement = await getUserEntitlement(session.user.id);
  const isAdmin = session.user.role === "ADMIN";

  if (entitlement !== "institution" && !isAdmin) {
    return (
      <div className="container py-16">
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("needsInstitution")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const classrooms = await prisma.classroom.findMany({
    where: { teacherId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        include: {
          user: {
            include: {
              progress: {
                where: { completedAt: { not: null } },
                select: { id: true },
              },
              xp: { select: { amount: true } },
            },
          },
        },
      },
      codes: { orderBy: { expiresAt: "desc" } },
    },
  });

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">{t("newClassroom")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateClassroomForm />
        </CardContent>
      </Card>

      <ClassroomList
        classrooms={classrooms.map((c) => ({
          id: c.id,
          name: c.name,
          curriculumTag: c.curriculumTag,
          codes: c.codes.map((code) => ({
            id: code.id,
            code: code.code,
            expiresAt: code.expiresAt.toISOString(),
            maxUses: code.maxUses,
            uses: code.uses,
          })),
          students: c.members.map((m) => ({
            memberId: m.id,
            isActive: m.isActive,
            username: m.user.username ?? "(no name)",
            completedLessons: m.user.progress.length,
            totalXp: m.user.xp.reduce((sum, x) => sum + x.amount, 0),
          })),
        }))}
      />
    </div>
  );
}
