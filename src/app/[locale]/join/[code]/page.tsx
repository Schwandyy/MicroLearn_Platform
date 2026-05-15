import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/server/db/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JoinForm } from "@/components/auth/join-form";
import { Link } from "@/i18n/routing";
import { AlertTriangle, GraduationCap } from "lucide-react";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code: rawCode } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("classroom");
  const tA = await getTranslations("auth");
  const code = rawCode.toUpperCase().slice(0, 12);

  const record = await prisma.classroomCode.findUnique({
    where: { code },
    include: { classroom: { select: { name: true } } },
  });

  const now = new Date();
  const status: "valid" | "expired" | "exhausted" | "unknown" = !record
    ? "unknown"
    : record.expiresAt < now
      ? "expired"
      : record.uses >= record.maxUses
        ? "exhausted"
        : "valid";

  return (
    <div className="container flex min-h-[80dvh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <GraduationCap className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              {t("title")}
            </span>
          </div>
          <CardTitle>
            {status === "valid"
              ? t("joinTitle", { name: record!.classroom.name })
              : t("joinInvalidTitle")}
          </CardTitle>
          <CardDescription>
            {status === "valid"
              ? t("joinSubtitle")
              : status === "expired"
                ? t("joinExpired")
                : status === "exhausted"
                  ? t("joinExhausted")
                  : t("joinUnknown")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "valid" ? (
            <JoinForm code={code} />
          ) : (
            <div className="grid gap-4">
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{t("joinAskTeacher")}</p>
              </div>
              <Link
                href="/auth/sign-in"
                className="text-center text-sm text-primary underline-offset-4 hover:underline"
              >
                {tA("signIn")}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
