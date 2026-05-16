import { setRequestLocale, getTranslations } from "next-intl/server";
import { SearchUI } from "@/components/search/search-ui";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="mb-6 text-3xl font-bold">{t("searchTitle")}</h1>
      <SearchUI initialQuery={q ?? ""} locale={locale} />
    </div>
  );
}
