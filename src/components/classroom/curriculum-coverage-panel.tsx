"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CurriculumData,
  StudentCompact,
} from "@/components/classroom/classroom-detail-tabs";

interface Props {
  curriculum: CurriculumData | null;
  students: StudentCompact[];
}

export function CurriculumCoveragePanel({ curriculum, students }: Props) {
  const t = useTranslations("classroom");

  if (!curriculum) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <Info className="h-5 w-5" />
          <p className="max-w-md text-sm">{t("curriculumNoScope")}</p>
        </CardContent>
      </Card>
    );
  }
  if (curriculum.totalStandards === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <GraduationCap className="h-5 w-5" />
          <p className="max-w-md text-sm">{t("curriculumNoStandards")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SummaryStrip curriculum={curriculum} studentCount={students.length} />
      <CoverageGrid curriculum={curriculum} students={students} />
    </div>
  );
}

function SummaryStrip({
  curriculum,
  studentCount,
}: {
  curriculum: CurriculumData;
  studentCount: number;
}) {
  const t = useTranslations("classroom");
  const pct =
    curriculum.totalStandards === 0
      ? 0
      : Math.round(
          (curriculum.coveredStandards / curriculum.totalStandards) * 100,
        );
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-6 py-4">
        <Metric
          label={t("curriculumState")}
          value={curriculum.state}
          subtle={t("curriculumGradeShort", { grade: curriculum.grade })}
        />
        <Metric
          label={t("curriculumStandards")}
          value={`${curriculum.coveredStandards} / ${curriculum.totalStandards}`}
          subtle={`${pct} %`}
        />
        <Metric
          label={t("curriculumStudents")}
          value={String(studentCount)}
        />
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <LegendDot tone="full" /> {t("curriculumLegendFull")}
          <LegendDot tone="partial" /> {t("curriculumLegendPartial")}
          <LegendDot tone="empty" /> {t("curriculumLegendEmpty")}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  subtle,
}: {
  label: string;
  value: string;
  subtle?: string;
}) {
  return (
    <div className="leading-tight">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {subtle && (
        <div className="text-xs text-muted-foreground">{subtle}</div>
      )}
    </div>
  );
}

function LegendDot({ tone }: { tone: "full" | "partial" | "empty" }) {
  return (
    <span
      className={cn(
        "inline-block h-3 w-3 rounded",
        tone === "full" && "bg-emerald-500",
        tone === "partial" && "bg-amber-400",
        tone === "empty" && "bg-muted",
      )}
    />
  );
}

function CoverageGrid({
  curriculum,
  students,
}: {
  curriculum: CurriculumData;
  students: StudentCompact[];
}) {
  const t = useTranslations("classroom");
  const [hover, setHover] = useState<
    { rowIdx: number; colIdx: number } | null
  >(null);

  // Per-student coverage count (used for column footer)
  const studentTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const s of students) totals.set(s.memberId, 0);
    for (const row of curriculum.rows) {
      for (const mid of row.coveredMemberIds) {
        totals.set(mid, (totals.get(mid) ?? 0) + 1);
      }
    }
    return totals;
  }, [curriculum.rows, students]);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-[7.5rem] z-10">
              <tr>
                <th className="sticky left-0 z-20 min-w-[260px] border-b bg-background px-3 py-2 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  {t("curriculumStandardCol")}
                </th>
                {students.map((s, idx) => (
                  <th
                    key={s.memberId}
                    className={cn(
                      "h-[110px] border-b bg-background align-bottom text-xs font-medium text-muted-foreground",
                      hover?.colIdx === idx && "bg-muted/60",
                    )}
                  >
                    <div className="mx-auto flex w-[26px] -rotate-45 origin-bottom-left translate-x-2 items-end whitespace-nowrap pb-1">
                      <span
                        className={cn(
                          "block max-w-[90px] truncate",
                          !s.isActive && "opacity-50 line-through",
                        )}
                        title={s.username}
                      >
                        {s.username}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="border-b bg-background px-3 py-2 text-right text-xs uppercase tracking-wide text-muted-foreground">
                  {t("curriculumCovered")}
                </th>
              </tr>
            </thead>
            <tbody>
              {curriculum.rows.map((row, rowIdx) => {
                const coveredCount = row.coveredMemberIds.length;
                const fraction =
                  students.length === 0
                    ? 0
                    : coveredCount / students.length;
                const rowTone =
                  fraction === 0
                    ? "empty"
                    : fraction === 1
                      ? "full"
                      : "partial";
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      hover?.rowIdx === rowIdx && "bg-muted/40",
                    )}
                  >
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-b bg-background px-3 py-2 text-left align-top"
                    >
                      <div className="flex items-start gap-2">
                        <RowTone tone={rowTone} />
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {row.code}
                          </div>
                          <div className="text-sm font-medium leading-snug">
                            {row.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {t("curriculumGradeShort", { grade: row.grade })}{" "}
                            · {row.subject}
                            {row.lessonsCovered > 0 && (
                              <>
                                {" "}
                                ·{" "}
                                {t("curriculumLessonsTagged", {
                                  count: row.lessonsCovered,
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </th>
                    {students.map((s, colIdx) => {
                      const isCovered = row.coveredMemberIds.includes(
                        s.memberId,
                      );
                      return (
                        <td
                          key={s.memberId}
                          className={cn(
                            "border-b text-center align-middle",
                            hover?.colIdx === colIdx && "bg-muted/40",
                          )}
                          onMouseEnter={() => setHover({ rowIdx, colIdx })}
                          onMouseLeave={() => setHover(null)}
                          title={`${row.title} · ${s.username} → ${
                            isCovered
                              ? t("curriculumCellCovered")
                              : t("curriculumCellOpen")
                          }`}
                        >
                          <Cell isCovered={isCovered} isActive={s.isActive} />
                        </td>
                      );
                    })}
                    <td className="border-b px-3 py-2 text-right text-sm tabular-nums">
                      {coveredCount} / {students.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <th className="sticky left-0 z-10 bg-background px-3 py-2 text-right text-xs uppercase tracking-wide text-muted-foreground">
                  {t("curriculumPerStudent")}
                </th>
                {students.map((s) => (
                  <td
                    key={s.memberId}
                    className="px-1 py-2 text-center text-[11px] text-muted-foreground tabular-nums"
                  >
                    {studentTotals.get(s.memberId) ?? 0}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Cell({
  isCovered,
  isActive,
}: {
  isCovered: boolean;
  isActive: boolean;
}) {
  return (
    <span
      className={cn(
        "mx-auto block h-5 w-5 rounded",
        isCovered ? "bg-emerald-500" : "bg-muted",
        !isActive && "opacity-50",
        !isActive && isCovered && "bg-emerald-300",
      )}
    />
  );
}

function RowTone({ tone }: { tone: "full" | "partial" | "empty" }) {
  return (
    <span
      className={cn(
        "mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded",
        tone === "full" && "bg-emerald-500",
        tone === "partial" && "bg-amber-400",
        tone === "empty" && "bg-muted",
      )}
      aria-hidden
    />
  );
}
