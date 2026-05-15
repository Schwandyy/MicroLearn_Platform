import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Link } from "@/i18n/routing";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="container flex min-h-[80dvh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("forgotTitle")}</CardTitle>
          <CardDescription>{t("forgotSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ForgotPasswordForm />
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/auth/sign-in"
              className="text-primary underline-offset-4 hover:underline"
            >
              ← {t("signIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
