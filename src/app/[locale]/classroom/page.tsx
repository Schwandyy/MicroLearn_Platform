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
    select: {
      id: true,
      name: true,
      curriculumTag: true,
      members: { select: { id: true, isActive: true } },
      assignments: { select: { id: true } },
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
          studentCount: c.members.length,
          activeCount: c.members.filter((m) => m.isActive).length,
          assignmentCount: c.assignments.length,
        }))}
      />
    </div>
  );
}
