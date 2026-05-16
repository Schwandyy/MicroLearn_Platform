"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/admin/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import {
  BookOpen,
  Copy,
  FileText,
  Key,
  Link2,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";

interface StudentRow {
  memberId: string;
  userId: string;
  isActive: boolean;
  username: string;
  completedLessons: number;
  totalXp: number;
}
interface CodeRow {
  id: string;
  code: string;
  expiresAt: string;
  maxUses: number;
  uses: number;
}
interface AssignmentPerStudent {
  memberId: string;
  username: string;
  done: number;
  total: number;
  percent: number;
}
interface AssignmentRow {
  id: string;
  kind: "lesson" | "path";
  title: string;
  slug: string;
  dueAt: string | null;
  note: string | null;
  total: number;
  fullyDone: number;
  perStudent: AssignmentPerStudent[];
}
interface CatalogItem {
  id: string;
  slug: string;
  title: string;
}
interface PathCatalogItem extends CatalogItem {
  lessons: CatalogItem[];
}

interface Props {
  classroomId: string;
  students: StudentRow[];
  codes: CodeRow[];
  assignments: AssignmentRow[];
  paths: PathCatalogItem[];
  lessons: CatalogItem[];
}

export function ClassroomDetailTabs(props: Props) {
  const t = useTranslations("classroom");

  return (
    <Tabs defaultValue="students">
      <TabsList>
        <TabsTrigger value="students" className="gap-2">
          <Users className="h-4 w-4" /> {t("tabStudents")}
        </TabsTrigger>
        <TabsTrigger value="assignments" className="gap-2">
          <BookOpen className="h-4 w-4" /> {t("tabAssignments")}
        </TabsTrigger>
        <TabsTrigger value="codes" className="gap-2">
          <Key className="h-4 w-4" /> {t("tabCodes")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="students">
        <StudentsPanel
          classroomId={props.classroomId}
          students={props.students}
          assignments={props.assignments}
        />
      </TabsContent>
      <TabsContent value="assignments">
        <AssignmentsPanel
          classroomId={props.classroomId}
          assignments={props.assignments}
          paths={props.paths}
          lessons={props.lessons}
        />
      </TabsContent>
      <TabsContent value="codes">
        <CodesPanel classroomId={props.classroomId} codes={props.codes} />
      </TabsContent>
    </Tabs>
  );
}

function StudentsPanel({
  classroomId,
  students,
  assignments,
}: {
  classroomId: string;
  students: StudentRow[];
  assignments: AssignmentRow[];
}) {
  const t = useTranslations("classroom");
  const tc = useTranslations("common");
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [focus, setFocus] = useState<StudentRow | null>(null);

  const toggle = (memberId: string, isActive: boolean) =>
    startTransition(async () => {
      const res = await fetch(
        `/api/classrooms/${classroomId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !isActive }),
        },
      );
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      router.refresh();
    });

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {t("noStudents")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-clip rounded-md">
          <table className="w-full text-sm">
            <thead className="sticky top-[7.5rem] z-10 bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">{t("colStudent")}</th>
                <th className="px-3 py-2 text-right">{t("colLessons")}</th>
                <th className="px-3 py-2 text-right">{t("colXp")}</th>
                <th className="px-3 py-2 text-right">{t("colStatus")}</th>
                <th className="px-3 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.memberId}
                  className="border-t hover:bg-muted/40"
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setFocus(s)}
                      className="font-medium text-left hover:underline"
                    >
                      {s.username}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {s.completedLessons}
                  </td>
                  <td className="px-3 py-2 text-right">{s.totalXp}</td>
                  <td className="px-3 py-2 text-right">
                    <Badge tone={s.isActive ? "success" : "danger"}>
                      {s.isActive ? t("statusActive") : t("statusInactive")}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggle(s.memberId, s.isActive)}
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
      </CardContent>

      <StudentDetailDialog
        student={focus}
        assignments={assignments}
        onClose={() => setFocus(null)}
      />
    </Card>
  );
}

function StudentDetailDialog({
  student,
  assignments,
  onClose,
}: {
  student: StudentRow | null;
  assignments: AssignmentRow[];
  onClose: () => void;
}) {
  const t = useTranslations("classroom");
  const open = student !== null;

  const rows = useMemo(() => {
    if (!student) return [];
    return assignments.map((a) => {
      const row = a.perStudent.find((p) => p.memberId === student.memberId);
      return {
        assignmentId: a.id,
        title: a.title,
        kind: a.kind,
        done: row?.done ?? 0,
        total: a.total,
        percent: row?.percent ?? 0,
      };
    });
  }, [student, assignments]);

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{student?.username ?? ""}</DialogTitle>
          <DialogDescription>
            {t("studentDetailSubtitle", {
              lessons: student?.completedLessons ?? 0,
              xp: student?.totalXp ?? 0,
            })}
          </DialogDescription>
        </DialogHeader>
        {rows.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            {t("noAssignments")}
          </p>
        ) : (
          <ul className="grid gap-3">
            {rows.map((r) => (
              <li key={r.assignmentId} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.kind === "path" ? t("kindPath") : t("kindLesson")} ·{" "}
                      {r.done} / {r.total}
                    </div>
                  </div>
                  <Badge tone={r.percent >= 100 ? "success" : "default"}>
                    {r.percent}%
                  </Badge>
                </div>
                <Progress value={r.percent} className="mt-2 h-1.5" />
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssignmentsPanel({
  classroomId,
  assignments,
  paths,
  lessons,
}: {
  classroomId: string;
  assignments: AssignmentRow[];
  paths: PathCatalogItem[];
  lessons: CatalogItem[];
}) {
  const t = useTranslations("classroom");
  const tc = useTranslations("common");
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creatorOpen, setCreatorOpen] = useState(false);

  const remove = (assignmentId: string) =>
    startTransition(async () => {
      const res = await fetch(
        `/api/classrooms/${classroomId}/assignments/${assignmentId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      router.refresh();
    });

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("assignmentsHint")}
        </p>
        <Button size="sm" onClick={() => setCreatorOpen(true)}>
          <BookOpen className="mr-2 h-4 w-4" /> {t("newAssignment")}
        </Button>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("noAssignments")}
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {assignments.map((a) => {
            const overall = a.perStudent.length
              ? Math.round(
                  a.perStudent.reduce((s, p) => s + p.percent, 0) /
                    a.perStudent.length,
                )
              : 0;
            return (
              <li key={a.id} className="rounded-md border bg-card">
                <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {a.kind === "path" ? (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{a.title}</span>
                      <Badge>
                        {a.kind === "path" ? t("kindPath") : t("kindLesson")}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {a.dueAt
                        ? t("dueOn", {
                            date: new Date(a.dueAt).toLocaleDateString(),
                          })
                        : t("noDue")}
                      {" · "}
                      {t("doneCount", {
                        done: a.fullyDone,
                        total: a.perStudent.length,
                      })}
                    </div>
                    {a.note && (
                      <p className="mt-2 max-w-prose text-sm">{a.note}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(a.id)}
                    disabled={isPending}
                    aria-label={t("removeAssignment")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="border-t bg-muted/30 px-4 py-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("classProgress")}</span>
                    <span>{overall}%</span>
                  </div>
                  <Progress value={overall} className="h-1.5" />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AssignmentCreator
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        classroomId={classroomId}
        paths={paths}
        lessons={lessons}
      />
    </div>
  );
}

function AssignmentCreator({
  open,
  onClose,
  classroomId,
  paths,
  lessons,
}: {
  open: boolean;
  onClose: () => void;
  classroomId: string;
  paths: PathCatalogItem[];
  lessons: CatalogItem[];
}) {
  const t = useTranslations("classroom");
  const tc = useTranslations("common");
  const { toast } = useToast();
  const router = useRouter();
  const [kind, setKind] = useState<"path" | "lesson">("path");
  const [targetId, setTargetId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkStart, setBulkStart] = useState("");
  const [bulkStepDays, setBulkStepDays] = useState("7");
  const [bulkDates, setBulkDates] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const list = kind === "path" ? paths : lessons;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list.slice(0, 50);
    return list
      .filter((x) => x.title.toLowerCase().includes(q))
      .slice(0, 50);
  }, [list, query]);

  const selectedPath = useMemo(
    () => (kind === "path" ? paths.find((p) => p.id === targetId) ?? null : null),
    [kind, paths, targetId],
  );
  const bulkLessons = selectedPath?.lessons ?? [];

  const applyAutoSpread = () => {
    if (!bulkStart || bulkLessons.length === 0) return;
    const step = Math.max(1, Number.parseInt(bulkStepDays, 10) || 7);
    const start = new Date(bulkStart);
    const out: Record<string, string> = {};
    bulkLessons.forEach((l, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i * step);
      out[l.id] = d.toISOString().slice(0, 10);
    });
    setBulkDates(out);
  };

  const submit = () => {
    if (!targetId) {
      toast({ title: t("pickTarget"), variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const isBulk = kind === "path" && bulkMode && bulkLessons.length > 0;
      const url = isBulk
        ? `/api/classrooms/${classroomId}/assignments/bulk`
        : `/api/classrooms/${classroomId}/assignments`;
      const body = isBulk
        ? {
            note: note.trim() || null,
            lessons: bulkLessons.map((l) => ({
              lessonId: l.id,
              dueAt: bulkDates[l.id]
                ? new Date(bulkDates[l.id]!).toISOString()
                : null,
            })),
          }
        : {
            pathId: kind === "path" ? targetId : null,
            lessonId: kind === "lesson" ? targetId : null,
            dueAt: dueAt ? new Date(dueAt).toISOString() : null,
            note: note.trim() || null,
          };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      setTargetId("");
      setDueAt("");
      setNote("");
      setQuery("");
      setBulkMode(false);
      setBulkStart("");
      setBulkDates({});
      onClose();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("newAssignment")}</DialogTitle>
          <DialogDescription>{t("newAssignmentHint")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="inline-flex rounded-md border p-1">
            <button
              type="button"
              onClick={() => {
                setKind("path");
                setTargetId("");
              }}
              className={`flex-1 rounded px-3 py-1.5 text-sm ${
                kind === "path"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {t("kindPath")}
            </button>
            <button
              type="button"
              onClick={() => {
                setKind("lesson");
                setTargetId("");
              }}
              className={`flex-1 rounded px-3 py-1.5 text-sm ${
                kind === "lesson"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {t("kindLesson")}
            </button>
          </div>

          <Input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="max-h-64 overflow-y-auto rounded-md border">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                {t("noMatch")}
              </p>
            ) : (
              <ul>
                {filtered.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setTargetId(item.id)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                        targetId === item.id ? "bg-muted" : ""
                      }`}
                    >
                      <span className="truncate">{item.title}</span>
                      <span className="ml-3 truncate text-xs text-muted-foreground">
                        /{item.slug}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {kind === "path" && selectedPath && bulkLessons.length > 0 && (
            <label className="flex cursor-pointer items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm">
              <input
                type="checkbox"
                checked={bulkMode}
                onChange={(e) => setBulkMode(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">{t("bulkToggle")}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {t("bulkToggleHint", { n: bulkLessons.length })}
                </span>
              </span>
            </label>
          )}

          {kind === "path" && bulkMode && bulkLessons.length > 0 ? (
            <div className="grid gap-3 rounded-md border bg-card p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("bulkStartLabel")}
                  </label>
                  <Input
                    type="date"
                    value={bulkStart}
                    onChange={(e) => setBulkStart(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("bulkStepLabel")}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={bulkStepDays}
                    onChange={(e) => setBulkStepDays(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyAutoSpread}
                  disabled={!bulkStart}
                >
                  {t("bulkApply")}
                </Button>
              </div>
              <ul className="grid max-h-64 gap-2 overflow-y-auto">
                {bulkLessons.map((l, i) => (
                  <li
                    key={l.id}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm"
                  >
                    <span className="text-xs text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span className="truncate">{l.title}</span>
                    <Input
                      type="date"
                      value={bulkDates[l.id] ?? ""}
                      onChange={(e) =>
                        setBulkDates((prev) => ({
                          ...prev,
                          [l.id]: e.target.value,
                        }))
                      }
                      className="h-8 w-36"
                    />
                  </li>
                ))}
              </ul>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("noteLabel")}
                </label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("notePlaceholder")}
                  maxLength={2000}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("dueLabel")}
                </label>
                <Input
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("noteLabel")}
                </label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("notePlaceholder")}
                  maxLength={2000}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button onClick={submit} disabled={isPending || !targetId}>
            {t("assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CodesPanel({
  classroomId,
  codes,
}: {
  classroomId: string;
  codes: CodeRow[];
}) {
  const t = useTranslations("classroom");
  const tc = useTranslations("common");
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const newCode = () =>
    startTransition(async () => {
      const res = await fetch(`/api/classrooms/${classroomId}/codes`, {
        method: "POST",
      });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      router.refresh();
    });

  const copy = (text: string, msg: string) => {
    navigator.clipboard.writeText(text).catch(() => undefined);
    toast({ title: msg });
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("codesHint")}</p>
        <Button size="sm" onClick={newCode} disabled={isPending}>
          <RefreshCw className="mr-2 h-4 w-4" /> {t("newCode")}
        </Button>
      </div>
      {codes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("noCodes")}
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-2">
          {codes.map((c) => (
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
                    onClick={() => copy(c.code, t("codeCopied"))}
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
                onClick={() => {
                  const origin =
                    typeof window !== "undefined"
                      ? window.location.origin
                      : "";
                  const locale =
                    typeof window !== "undefined"
                      ? window.location.pathname.split("/")[1] || "de"
                      : "de";
                  copy(`${origin}/${locale}/join/${c.code}`, t("linkCopied"));
                }}
              >
                <Link2 className="mr-2 h-4 w-4" /> {t("copyLink")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
