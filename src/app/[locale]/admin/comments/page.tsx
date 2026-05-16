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
import { AdminCommentDelete } from "@/components/admin/comment-delete";

export default async function AdminCommentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();

  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true, name: true, email: true } },
      project: { select: { slug: true, title_de: true, title_en: true } },
    },
    take: 200,
  });

  return (
    <div className="container max-w-5xl py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Kommentare</h1>
          <p className="text-sm text-muted-foreground">
            {comments.length} angezeigt (max. 200, neueste zuerst)
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
          <CardTitle className="text-base">Letzte Kommentare</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Autor</th>
                <th className="px-3 py-2 text-left">Projekt</th>
                <th className="px-3 py-2 text-left">Text</th>
                <th className="px-3 py-2 text-right">Erstellt</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => {
                const author =
                  c.author.name ?? c.author.username ?? c.author.email ?? "—";
                const project = c.project
                  ? locale === "de"
                    ? c.project.title_de
                    : c.project.title_en
                  : "—";
                return (
                  <tr key={c.id} className="border-t align-top hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{author}</td>
                    <td className="px-3 py-2">
                      {c.project ? (
                        <Link
                          href={`/projects/${c.project.slug}`}
                          className="hover:underline"
                        >
                          {project}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 max-w-md whitespace-pre-wrap break-words text-muted-foreground">
                      {c.body}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                      {c.createdAt.toLocaleDateString(locale)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <AdminCommentDelete id={c.id} />
                    </td>
                  </tr>
                );
              })}
              {comments.length === 0 && (
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
