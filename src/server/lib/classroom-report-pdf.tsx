import "server-only";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

type Locale = "de" | "en";

export type CurriculumCoverageRow = {
  code: string;
  title: string;
  description: string | null;
  subject: string;
  grade: number;
  lessonsCovered: number; // # of lessons in this class context tagged to this standard
  studentsCovered: number; // # of students who completed >= 1 lesson tagged to this standard
};

export type StudentRow = {
  username: string;
  isActive: boolean;
  completedLessons: number;
  totalXp: number;
  assignmentsDone: number;
  assignmentsTotal: number;
};

export type ClassroomReportInput = {
  locale: Locale;
  classroomName: string;
  teacherName: string;
  state: string | null;
  grade: number | null;
  issuedAt: Date;
  totalStudents: number;
  activeStudents: number;
  students: StudentRow[];
  curriculum: {
    totalStandards: number;
    coveredStandards: number;
    rows: CurriculumCoverageRow[];
  } | null;
};

const COPY: Record<Locale, {
  brand: string;
  title: string;
  teacher: string;
  state: string;
  grade: string;
  issued: string;
  overview: string;
  totalStudents: string;
  activeStudents: string;
  studentsTable: string;
  colName: string;
  colStatus: string;
  colLessons: string;
  colXp: string;
  colAssign: string;
  active: string;
  inactive: string;
  curriculum: string;
  curriculumSummary: string;
  covered: string;
  notCovered: string;
  noCurriculumState: string;
  noCurriculumStandards: string;
  footer: string;
  page: string;
  studentsCovered: string;
  lessonsTagged: string;
}> = {
  de: {
    brand: "MicroLearn · Klassenbericht",
    title: "Klassen-Bericht",
    teacher: "Lehrkraft",
    state: "Bundesland",
    grade: "Klassenstufe",
    issued: "Erstellt am",
    overview: "Überblick",
    totalStudents: "Schüler:innen gesamt",
    activeStudents: "davon aktiv",
    studentsTable: "Schüler:innen-Fortschritt",
    colName: "Name",
    colStatus: "Status",
    colLessons: "Lektionen",
    colXp: "XP",
    colAssign: "Aufgaben",
    active: "aktiv",
    inactive: "inaktiv",
    curriculum: "Lehrplan-Abdeckung",
    curriculumSummary: "abgedeckte Standards",
    covered: "abgedeckt",
    notCovered: "offen",
    noCurriculumState: "Für diese Klasse ist kein Bundesland + Klassenstufe gesetzt — Lehrplan-Abdeckung nicht verfügbar.",
    noCurriculumStandards: "Für die gewählte Klassenstufe sind keine Lehrplanstandards hinterlegt.",
    footer: "MicroLearn",
    page: "Seite",
    studentsCovered: "Schüler:innen",
    lessonsTagged: "Lektionen",
  },
  en: {
    brand: "MicroLearn · Classroom Report",
    title: "Classroom Report",
    teacher: "Teacher",
    state: "State",
    grade: "Grade",
    issued: "Issued on",
    overview: "Overview",
    totalStudents: "Students total",
    activeStudents: "active",
    studentsTable: "Student progress",
    colName: "Name",
    colStatus: "Status",
    colLessons: "Lessons",
    colXp: "XP",
    colAssign: "Assignments",
    active: "active",
    inactive: "inactive",
    curriculum: "Curriculum coverage",
    curriculumSummary: "standards covered",
    covered: "covered",
    notCovered: "open",
    noCurriculumState: "This classroom has no state + grade configured — curriculum coverage not available.",
    noCurriculumStandards: "No curriculum standards configured for the chosen grade.",
    footer: "MicroLearn",
    page: "Page",
    studentsCovered: "students",
    lessonsTagged: "lessons",
  },
};

const colors = {
  text: "#111827",
  muted: "#6b7280",
  faint: "#9ca3af",
  border: "#e5e7eb",
  brand: "#a16207",
  brandBg: "#fef3c7",
  good: "#15803d",
  goodBg: "#dcfce7",
  open: "#b91c1c",
  openBg: "#fee2e2",
  rowAlt: "#fafafa",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.text,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: colors.brand,
    paddingBottom: 10,
    marginBottom: 18,
  },
  brand: {
    fontSize: 9,
    letterSpacing: 3,
    color: colors.brand,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  meta: {
    fontSize: 9,
    color: colors.muted,
  },
  metaStrong: {
    fontSize: 9,
    color: colors.text,
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 8,
    color: colors.text,
  },
  overviewRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 6,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
  },
  metricLabel: {
    fontSize: 8,
    color: colors.faint,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  metricSubtle: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 2,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: colors.brandBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 6,
    minHeight: 18,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: colors.rowAlt,
  },
  th: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  td: {
    fontSize: 9,
    color: colors.text,
  },
  tdMuted: {
    fontSize: 9,
    color: colors.muted,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  badgeGood: {
    backgroundColor: colors.goodBg,
    color: colors.good,
  },
  badgeOpen: {
    backgroundColor: colors.openBg,
    color: colors.open,
  },
  noteBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    color: colors.muted,
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: colors.faint,
  },
  curriculumRowText: {
    fontSize: 9,
    color: colors.text,
  },
  curriculumDesc: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 2,
  },
});

function fmtDate(d: Date, locale: Locale): string {
  return d.toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ClassroomReportDocument(props: ClassroomReportInput) {
  const c = COPY[props.locale];
  const cur = props.curriculum;

  return (
    <Document
      title={`${c.title} · ${props.classroomName}`}
      author="MicroLearn"
      creator="MicroLearn"
      producer="MicroLearn"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>{c.brand}</Text>
            <Text style={styles.title}>{props.classroomName}</Text>
            <Text style={styles.meta}>
              <Text style={styles.metaStrong}>{c.teacher}: </Text>
              {props.teacherName}
              {"   ·   "}
              <Text style={styles.metaStrong}>{c.state}: </Text>
              {props.state ?? "—"}
              {"   ·   "}
              <Text style={styles.metaStrong}>{c.grade}: </Text>
              {props.grade != null ? String(props.grade) : "—"}
            </Text>
          </View>
          <Text style={styles.meta}>
            {c.issued}: {fmtDate(props.issuedAt, props.locale)}
          </Text>
        </View>

        {/* Overview */}
        <Text style={styles.sectionTitle}>{c.overview}</Text>
        <View style={styles.overviewRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{c.totalStudents}</Text>
            <Text style={styles.metricValue}>{props.totalStudents}</Text>
            <Text style={styles.metricSubtle}>
              {props.activeStudents} {c.activeStudents}
            </Text>
          </View>
          {cur && (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>{c.curriculum}</Text>
              <Text style={styles.metricValue}>
                {cur.coveredStandards} / {cur.totalStandards}
              </Text>
              <Text style={styles.metricSubtle}>
                {c.curriculumSummary}
              </Text>
            </View>
          )}
        </View>

        {/* Students */}
        <Text style={styles.sectionTitle}>{c.studentsTable}</Text>
        <View style={styles.tableHead}>
          <Text style={[styles.th, { flex: 3 }]}>{c.colName}</Text>
          <Text style={[styles.th, { flex: 1 }]}>{c.colStatus}</Text>
          <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>{c.colLessons}</Text>
          <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>{c.colXp}</Text>
          <Text style={[styles.th, { flex: 1.4, textAlign: "right" }]}>{c.colAssign}</Text>
        </View>
        {props.students.map((s, i) => (
          <View
            key={`s-${i}`}
            style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
          >
            <Text style={[styles.td, { flex: 3 }]}>{s.username}</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.badge,
                  s.isActive ? styles.badgeGood : styles.badgeOpen,
                  { alignSelf: "flex-start" },
                ]}
              >
                {s.isActive ? c.active : c.inactive}
              </Text>
            </View>
            <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
              {s.completedLessons}
            </Text>
            <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
              {s.totalXp}
            </Text>
            <Text style={[styles.td, { flex: 1.4, textAlign: "right" }]}>
              {s.assignmentsDone}/{s.assignmentsTotal}
            </Text>
          </View>
        ))}

        {/* Curriculum */}
        <Text style={styles.sectionTitle}>{c.curriculum}</Text>
        {!cur && (
          <View style={styles.noteBox}>
            <Text>{c.noCurriculumState}</Text>
          </View>
        )}
        {cur && cur.totalStandards === 0 && (
          <View style={styles.noteBox}>
            <Text>{c.noCurriculumStandards}</Text>
          </View>
        )}
        {cur && cur.totalStandards > 0 && (
          <>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 1.4 }]}>Code</Text>
              <Text style={[styles.th, { flex: 4 }]}>{c.colName}</Text>
              <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
                {c.lessonsTagged}
              </Text>
              <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
                {c.studentsCovered}
              </Text>
              <Text style={[styles.th, { flex: 1.2, textAlign: "right" }]}>
                {c.colStatus}
              </Text>
            </View>
            {cur.rows.map((r, i) => {
              const isCovered = r.studentsCovered > 0;
              return (
                <View
                  key={`c-${i}`}
                  style={[
                    styles.tableRow,
                    i % 2 === 1 ? styles.tableRowAlt : {},
                    { alignItems: "flex-start" },
                  ]}
                >
                  <Text style={[styles.tdMuted, { flex: 1.4 }]}>{r.code}</Text>
                  <View style={{ flex: 4, paddingRight: 6 }}>
                    <Text style={styles.curriculumRowText}>{r.title}</Text>
                    {r.description && (
                      <Text style={styles.curriculumDesc}>{r.description}</Text>
                    )}
                  </View>
                  <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                    {r.lessonsCovered}
                  </Text>
                  <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                    {r.studentsCovered}
                  </Text>
                  <View style={{ flex: 1.2, alignItems: "flex-end" }}>
                    <Text
                      style={[
                        styles.badge,
                        isCovered ? styles.badgeGood : styles.badgeOpen,
                      ]}
                    >
                      {isCovered ? c.covered : c.notCovered}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={styles.footer} fixed>
          <Text>{c.footer}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${c.page} ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export async function renderClassroomReportPdf(
  input: ClassroomReportInput,
): Promise<Buffer> {
  return renderToBuffer(<ClassroomReportDocument {...input} />);
}
