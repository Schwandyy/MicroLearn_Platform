import { setRequestLocale } from "next-intl/server";
import { requireAdmin } from "@/server/lib/admin";
import { prisma } from "@/server/db/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import {
  ShieldCheck,
  Hammer,
  MessageSquare,
  Users,
  ArrowRight,
} from "lucide-react";

export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();

  const [pendingReviews, totalProjects, recentComments, totalUsers] =
    await Promise.all([
      prisma.contentReview.count({
        where: { status: { in: ["PENDING", "AI_FLAGGED", "IN_REVIEW"] } },
      }),
      prisma.project.count(),
      prisma.comment.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 86400_000) },
        },
      }),
      prisma.user.count(),
    ]);

  const tiles = [
    {
      title: "Content-Reviews",
      desc: "Geprüfte Lessons aus dem Scrape-Pipeline-Workflow.",
      href: "/admin/review",
      icon: ShieldCheck,
      value: pendingReviews,
      label: "offen",
    },
    {
      title: "Projekte",
      desc: "Alle Schüler-Projekte; Showcase pinnen, löschen.",
      href: "/admin/projects",
      icon: Hammer,
      value: totalProjects,
      label: "gesamt",
    },
    {
      title: "Kommentare",
      desc: "Letzte 7 Tage — moderieren, löschen.",
      href: "/admin/comments",
      icon: MessageSquare,
      value: recentComments,
      label: "diese Woche",
    },
    {
      title: "Nutzer",
      desc: "Konten — Rollen, Status.",
      href: "/admin/users",
      icon: Users,
      value: totalUsers,
      label: "registriert",
    },
  ];

  return (
    <div className="container max-w-5xl py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Moderation, Inhalte, Nutzerverwaltung.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-xl border bg-card p-4 transition hover:border-primary"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-primary" />
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </div>
              <div className="mt-3 text-2xl font-bold tabular-nums">
                {t.value}
              </div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t.label}
              </div>
              <div className="mt-2 font-medium">{t.title}</div>
              <div className="text-xs text-muted-foreground">{t.desc}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
