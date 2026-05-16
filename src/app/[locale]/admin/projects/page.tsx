import { setRequestLocale } from "next-intl/server";
import { requireAdmin } from "@/server/lib/admin";
import { prisma } from "@/server/db/prisma";
import { Link } from "@/i18n/routing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/admin/badge";
import { Sparkles, Lock } from "lucide-react";

export default async function AdminProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true, name: true, email: true } },
      showcase: true,
      _count: { select: { comments: true } },
    },
    take: 200,
  });

  return (
    <div className="container max-w-5xl py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Projekte</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length} angezeigt (max. 200)
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Admin
        </Link>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alle Projekte</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Titel</th>
                <th className="px-3 py-2 text-left">Autor</th>
                <th className="px-3 py-2 text-right">Komm.</th>
                <th className="px-3 py-2 text-right">Status</th>
                <th className="px-3 py-2 text-right">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const title = locale === "de" ? p.title_de : p.title_en;
                const author =
                  p.author.name ?? p.author.username ?? p.author.email ?? "—";
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <Link
                        href={`/projects/${p.slug}`}
                        className="font-medium hover:underline"
                      >
                        {title}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{author}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {p._count.comments}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        {p.showcase && (
                          <Badge tone="info">
                            <Sparkles className="mr-1 h-3 w-3" />
                            featured
                          </Badge>
                        )}
                        {!p.isPublic && (
                          <Badge tone="warning">
                            <Lock className="mr-1 h-3 w-3" />
                            privat
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                      {p.createdAt.toLocaleDateString(locale)}
                    </td>
                  </tr>
                );
              })}
              {projects.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-10 text-center text-muted-foreground"
                  >
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
