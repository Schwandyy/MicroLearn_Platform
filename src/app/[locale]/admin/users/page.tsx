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

const ROLE_TONE: Record<string, "info" | "success" | "warning" | "danger"> = {
  ADMIN: "danger",
  TEACHER: "info",
  INSTRUCTOR: "info",
  STUDENT_CODE: "warning",
  STUDENT: "success",
};

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
      createdAt: true,
      subscription: { select: { tier: true, status: true } },
    },
    take: 200,
  });

  return (
    <div className="container max-w-5xl py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Nutzer</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} angezeigt (max. 200, neueste zuerst)
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
          <CardTitle className="text-base">Letzte Anmeldungen</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Identität</th>
                <th className="px-3 py-2 text-left">E-Mail</th>
                <th className="px-3 py-2 text-right">Rolle</th>
                <th className="px-3 py-2 text-right">Plan</th>
                <th className="px-3 py-2 text-right">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">
                    {u.name ?? u.username ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {u.email ?? <span className="italic">(Schüler-Code)</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Badge tone={ROLE_TONE[u.role] ?? "info"}>{u.role}</Badge>
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {u.subscription
                      ? `${u.subscription.tier} · ${u.subscription.status}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {u.createdAt.toLocaleDateString(locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
