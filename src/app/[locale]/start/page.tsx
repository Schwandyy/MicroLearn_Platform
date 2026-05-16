import { setRequestLocale } from "next-intl/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/server/db/prisma";
import { StarterFlow } from "@/components/onboarding/starter-flow";

export const dynamic = "force-dynamic";

export default async function StartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requireSession({
    locale,
    callbackPath: `/${locale}/start`,
  });

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { starterCompletedAt: true },
  });

  return (
    <StarterFlow alreadyCompleted={Boolean(profile?.starterCompletedAt)} />
  );
}
