import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from ".";

/**
 * Erzwingt eine gültige Session in einer geschützten Server-Component.
 *
 * - Liefert die Session zurück, wenn alles okay ist.
 * - Wenn `auth()` null liefert (z.B. defektes Zombie-Cookie aus einer
 *   früheren Session) → redirected zur Sign-in-Seite mit `callbackUrl`,
 *   damit der User nach dem Login wieder genau dort landet, wo er
 *   klicken wollte. Der Sign-in-Flow überschreibt das defekte Cookie
 *   automatisch durch ein frisches.
 */
export async function requireSession(opts: {
  locale: string;
  /** Pfad zur aktuellen Seite — wird als callbackUrl an die Sign-in-Page geschickt. */
  callbackPath: string;
}): Promise<Session & { user: NonNullable<Session["user"]> & { id: string } }> {
  const session = (await auth()) as Session | null;
  if (session?.user?.id) {
    return session as Session & {
      user: NonNullable<Session["user"]> & { id: string };
    };
  }

  const callback = encodeURIComponent(opts.callbackPath);
  redirect(`/${opts.locale}/auth/sign-in?callbackUrl=${callback}`);
}
