import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { Cpu } from "lucide-react";
import { auth } from "@/server/auth";
import { UserMenu } from "@/components/user-menu";

export async function Navbar() {
  const t = await getTranslations("nav");
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Cpu className="h-5 w-5 text-primary" />
          <span>MicroLearn</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/paths" className="text-muted-foreground hover:text-foreground">
            {t("paths")}
          </Link>
          <Link
            href="/projects"
            className="text-muted-foreground hover:text-foreground"
          >
            {t("projects")}
          </Link>
          <Link
            href="/pricing"
            className="text-muted-foreground hover:text-foreground"
          >
            {t("pricing")}
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitch />
          {session?.user ? (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                <Link href="/dashboard">{t("dashboard")}</Link>
              </Button>
              <UserMenu
                name={session.user.name ?? session.user.username ?? "—"}
                image={session.user.image ?? null}
              />
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href="/auth/sign-in">{t("signIn")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-up">{t("signUp")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
