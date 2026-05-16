"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Loader2, Search, GraduationCap, Sparkles, Hammer } from "lucide-react";

interface Hit {
  slug: string;
  title: string;
  snippet: string;
}
interface Results {
  lessons: Hit[];
  paths: Hit[];
  projects: Hit[];
}

const EMPTY: Results = { lessons: [], paths: [], projects: [] };

export function SearchUI({
  initialQuery,
  locale,
}: {
  initialQuery: string;
  locale: string;
}) {
  const t = useTranslations("nav");
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState<Results>(EMPTY);
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  // Debounced fetch
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    const ctl = new AbortController();
    setLoading(true);
    const handle = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(q)}&locale=${locale}`,
            { signal: ctl.signal },
          );
          if (res.ok) {
            const data = (await res.json()) as Results;
            setResults(data);
          }
        } finally {
          setLoading(false);
        }
      });
    }, 200);
    return () => {
      clearTimeout(handle);
      ctl.abort();
      setLoading(false);
    };
  }, [q, locale]);

  const total =
    results.lessons.length + results.paths.length + results.projects.length;

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          placeholder={t("searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 pl-10 text-base"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {q.trim().length >= 2 && total === 0 && !loading && (
        <p className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">
          {t("searchEmpty")}
        </p>
      )}

      {results.paths.length > 0 && (
        <Section
          icon={<GraduationCap className="h-4 w-4" />}
          title={t("searchPaths")}
          hits={results.paths}
          hrefBase="/paths"
        />
      )}
      {results.lessons.length > 0 && (
        <Section
          icon={<Sparkles className="h-4 w-4" />}
          title={t("searchLessons")}
          hits={results.lessons}
          hrefBase="/lessons"
        />
      )}
      {results.projects.length > 0 && (
        <Section
          icon={<Hammer className="h-4 w-4" />}
          title={t("searchProjects")}
          hits={results.projects}
          hrefBase="/projects"
        />
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  hits,
  hrefBase,
}: {
  icon: React.ReactNode;
  title: string;
  hits: Hit[];
  hrefBase: string;
}) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}{" "}
        <span className="tabular-nums">({hits.length})</span>
      </h2>
      <ul className="grid gap-2">
        {hits.map((h) => (
          <li key={h.slug}>
            <Link
              href={`${hrefBase}/${h.slug}`}
              className="block rounded-md border bg-card p-3 transition hover:border-primary"
            >
              <div className="font-medium">{h.title}</div>
              <div className="line-clamp-2 text-xs text-muted-foreground">
                {h.snippet}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
