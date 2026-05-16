"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/admin/badge";
import { Link } from "@/i18n/routing";
import { ChevronRight, Users } from "lucide-react";

interface ClassroomSummary {
  id: string;
  name: string;
  curriculumTag: string | null;
  studentCount: number;
  activeCount: number;
  assignmentCount: number;
}

export function ClassroomList({ classrooms }: { classrooms: ClassroomSummary[] }) {
  const t = useTranslations("classroom");

  if (classrooms.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {t("emptyState")}
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="grid gap-3">
      {classrooms.map((c) => (
        <li key={c.id}>
          <Link
            href={`/classroom/${c.id}`}
            className="group flex items-center justify-between gap-3 rounded-md border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{c.name}</span>
                {c.curriculumTag && <Badge>{c.curriculumTag}</Badge>}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {t("studentsCount", { count: c.studentCount })}
                  {c.studentCount > c.activeCount && (
                    <span className="ml-1 text-amber-600">
                      ({c.activeCount} {t("activeShort")})
                    </span>
                  )}
                </span>
                <span>·</span>
                <span>{t("assignmentsCount", { count: c.assignmentCount })}</span>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <span className="inline-flex items-center">
                {t("manage")}
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Button>
          </Link>
        </li>
      ))}
    </ul>
  );
}
