import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Excluded: API/trpc, Next internals, statisch (mit Dot), Sitemap/Robots,
  // sowie Next.js Metadata-Routes (opengraph-image, twitter-image, icon,
  // apple-icon, favicon).
  matcher: [
    "/((?!api|trpc|_next|_vercel|sitemap|robots|opengraph-image|twitter-image|icon|apple-icon|favicon|.*\\..*).*)",
  ],
};
