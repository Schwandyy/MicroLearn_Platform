import { notFound } from "next/navigation";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/server/db/prisma";
import { auth } from "@/server/auth";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Sparkles } from "lucide-react";
import { CommentsBlock } from "@/components/projects/comments-block";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("projects");
  const session = await auth();

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, username: true, name: true } },
      showcase: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, username: true, name: true } } },
      },
    },
  });

  if (!project) notFound();

  const isOwner = session?.user?.id === project.authorId;
  const isAdmin = session?.user?.role === "ADMIN";
  if (!project.isPublic && !isOwner && !isAdmin) notFound();

  const title = locale === "de" ? project.title_de : project.title_en;
  const body = locale === "de" ? project.body_de : project.body_en;
  const authorName =
    project.author.name ?? project.author.username ?? "Anonymous";

  return (
    <div className="container max-w-3xl py-10">
      <article className="space-y-6">
        <header className="space-y-3">
          {project.showcase && (
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
              <Sparkles className="h-4 w-4" />
              {t("showcase")}
            </div>
          )}
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("by")} <span className="font-medium">{authorName}</span>
            {" · "}
            {new Date(project.createdAt).toLocaleDateString(locale)}
          </p>
          {(isOwner || isAdmin) && (
            <div className="flex items-center gap-2">
              <DeleteProjectButton slug={project.slug} />
            </div>
          )}
        </header>

        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted">
          {project.coverImage ? (
            <Image
              src={project.coverImage}
              alt={title}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 768px, 100vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-12 w-12" />
            </div>
          )}
        </div>

        <Card>
          <CardContent className="prose prose-sm max-w-none whitespace-pre-wrap py-6 leading-relaxed dark:prose-invert">
            {body}
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("comments")}</h2>
          {project.isPublic ? (
            <CommentsBlock
              slug={project.slug}
              loggedIn={Boolean(session?.user?.id)}
              currentUserId={session?.user?.id ?? null}
              isProjectOwner={isOwner}
              isAdmin={isAdmin}
              comments={project.comments.map((c) => ({
                id: c.id,
                body: c.body,
                createdAt: c.createdAt.toISOString(),
                authorId: c.authorId,
                authorName:
                  c.author.name ?? c.author.username ?? "Anonymous",
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("private")}</p>
          )}
        </section>

        <div className="pt-4">
          <Button asChild variant="ghost">
            <Link href="/projects">← {t("title")}</Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
