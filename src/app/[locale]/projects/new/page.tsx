import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/server/auth/require-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewProjectForm } from "@/components/projects/new-project-form";

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("projects");
  await requireSession({
    locale,
    callbackPath: `/${locale}/projects/new`,
  });

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t("createTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <NewProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
