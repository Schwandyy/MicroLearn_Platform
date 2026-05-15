import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { prisma } from "@/server/db/prisma";
import { auth } from "@/server/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, ImageIcon } from "lucide-react";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("projects");
  const session = await auth();

  const [showcased, recent] = await Promise.all([
    prisma.project.findMany({
      where: { isPublic: true, showcase: { isNot: null } },
      include: {
        author: { select: { username: true, name: true } },
        showcase: true,
      },
      orderBy: [
        { showcase: { rank: "asc" } },
        { showcase: { featuredAt: "desc" } },
      ],
      take: 6,
    }),
    prisma.project.findMany({
      where: { isPublic: true, showcase: { is: null } },
      include: { author: { select: { username: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ]);

  const authorName = (u: { username: string | null; name: string | null }) =>
    u.name ?? u.username ?? "Anonymous";

  return (
    <div className="container py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {session?.user ? (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("newProject")}
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/auth/sign-in?callbackUrl=/projects/new">
              {t("loginToPost")}
            </Link>
          </Button>
        )}
      </div>

      {showcased.length > 0 && (
        <section className="mb-10">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary">
            <Sparkles className="h-4 w-4" />
            {t("showcase")}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {showcased.map((p) => (
              <ProjectCard
                key={p.id}
                slug={p.slug}
                title={locale === "de" ? p.title_de : p.title_en}
                body={locale === "de" ? p.body_de : p.body_en}
                coverImage={p.coverImage}
                author={authorName(p.author)}
                featured
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("recent")}</h2>
        {recent.length === 0 && showcased.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("empty")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => (
              <ProjectCard
                key={p.id}
                slug={p.slug}
                title={locale === "de" ? p.title_de : p.title_en}
                body={locale === "de" ? p.body_de : p.body_en}
                coverImage={p.coverImage}
                author={authorName(p.author)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProjectCard({
  slug,
  title,
  body,
  coverImage,
  author,
  featured,
}: {
  slug: string;
  title: string;
  body: string;
  coverImage: string | null;
  author: string;
  featured?: boolean;
}) {
  return (
    <Card
      className={
        featured ? "overflow-hidden border-primary/40" : "overflow-hidden"
      }
    >
      <div className="relative aspect-[16/9] w-full bg-muted">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 text-base">{title}</CardTitle>
        <CardDescription>{author}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="line-clamp-3 text-sm text-muted-foreground">{body}</p>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="ghost">
          <Link href={`/projects/${slug}`}>→</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
