import { getTranslations, setRequestLocale } from "next-intl/server";
import { AssessmentWizard } from "@/components/quiz/assessment-wizard";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("assessment");

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto mb-10 max-w-xl text-center">
        <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AssessmentWizard />
    </div>
  );
}
