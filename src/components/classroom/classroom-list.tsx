"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/admin/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import { Key, Users, RefreshCw, Copy, Link2 } from "lucide-react";

interface CodeRow {
  id: string;
  code: string;
  expiresAt: string;
  maxUses: number;
  uses: number;
}
interface StudentRow {
  memberId: string;
  isActive: boolean;
  username: string;
  completedLessons: number;
  totalXp: number;
}

interface ClassroomData {
  id: string;
  name: string;
  curriculumTag: string | null;
  codes: CodeRow[];
  students: StudentRow[];
}

export function ClassroomList({ classrooms }: { classrooms: ClassroomData[] }) {
  if (classrooms.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          —
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-6">
      {classrooms.map((c) => (
        <ClassroomCard key={c.id} classroom={c} />
      ))}
    </div>
  );
}

function ClassroomCard({ classroom }: { classroom: ClassroomData }) {
  const t = useTranslations("classroom");
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);

  const newCode = () =>
    startTransition(async () => {
      setGenerating(true);
      const res = await fetch(`/api/classrooms/${classroom.id}/codes`, {
        method: "POST",
      });
      setGenerating(false);
      if (!res.ok) {
        toast({ title: "Fehler", variant: "destructive" });
        return;
      }
      router.refresh();
    });

  const toggleStudent = (memberId: string, isActive: boolean) =>
    startTransition(async () => {
      const res = await fetch(
        `/api/classrooms/${classroom.id}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !isActive }),
        },
      );
      if (!res.ok) {
        toast({ title: "Fehler", variant: "destructive" });
        return;
      }
      router.refresh();
    });

  const copy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => undefined);
    toast({ title: "Code kopiert" });
  };

  const copyJoinLink = (code: string) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const locale =
      typeof window !== "undefined"
        ? window.location.pathname.split("/")[1] || "de"
        : "de";
    const url = `${origin}/${locale}/join/${code}`;
    navigator.clipboard.writeText(url).catch(() => undefined);
    toast({ title: t("linkCopied") });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{classroom.name}</CardTitle>
            {classroom.curriculumTag && (
              <Badge className="mt-1">{classroom.curriculumTag}</Badge>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/classrooms/${classroom.id}/report`} download>
              {t("exportPdf")}
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Key className="h-4 w-4" /> {t("codes")}
            </h3>
            <Button
              size="sm"
              onClick={newCode}
              disabled={isPending || generating}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("newCode")}
            </Button>
          </div>
          {classroom.codes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noCodes")}</p>
          ) : (
            <ul className="grid gap-2">
              {classroom.codes.map((c) => (
                <li
                  key={c.id}
                  className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-lg font-semibold tracking-widest">
                        {c.code}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => copy(c.code)}
                        aria-label="Copy code"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t("codeExpires")}{" "}
                      {new Date(c.expiresAt).toLocaleDateString()} ·{" "}
                      {t("codeUses", { uses: c.uses, max: c.maxUses })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyJoinLink(c.code)}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    {t("copyLink")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="h-4 w-4" /> {t("students")}
          </h3>
          {classroom.students.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noStudents")}</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Benutzer</th>
                    <th className="px-3 py-2 text-right">Lektionen</th>
                    <th className="px-3 py-2 text-right">XP</th>
                    <th className="px-3 py-2 text-right">Status</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {classroom.students.map((s) => (
                    <tr key={s.memberId} className="border-t">
                      <td className="px-3 py-2 font-medium">{s.username}</td>
                      <td className="px-3 py-2 text-right">
                        {s.completedLessons}
                      </td>
                      <td className="px-3 py-2 text-right">{s.totalXp}</td>
                      <td className="px-3 py-2 text-right">
                        <Badge tone={s.isActive ? "success" : "danger"}>
                          {s.isActive ? "aktiv" : "deaktiviert"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            toggleStudent(s.memberId, s.isActive)
                          }
                          disabled={isPending}
                        >
                          {s.isActive
                            ? t("deactivateStudent")
                            : t("reactivateStudent")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
