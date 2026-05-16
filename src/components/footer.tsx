import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Cpu } from "lucide-react";

export async function Footer({ locale }: { locale: string }) {
  const tN = await getTranslations("nav");
  const isDe = locale === "de";

  return (
    <footer className="mt-16 border-t bg-card/30">
      <div className="container grid gap-8 py-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <Cpu className="h-5 w-5 text-primary" />
            <span>MicroLearn</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {isDe
              ? "Strukturiertes Lernen für Mikroelektronik — von der ersten LED bis zum vernetzten Sensor."
              : "Structured learning for microelectronics — from the first LED to networked sensors."}
          </p>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isDe ? "Plattform" : "Platform"}
          </div>
          <ul className="grid gap-1.5 text-sm">
            <li><Link href="/paths" className="hover:text-primary">{tN("paths")}</Link></li>
            <li><Link href="/projects" className="hover:text-primary">{tN("projects")}</Link></li>
            <li><Link href="/pricing" className="hover:text-primary">{tN("pricing")}</Link></li>
          </ul>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isDe ? "Rechtliches" : "Legal"}
          </div>
          <ul className="grid gap-1.5 text-sm">
            <li>
              <Link href="/legal/imprint" className="hover:text-primary">
                {isDe ? "Impressum" : "Legal notice"}
              </Link>
            </li>
            <li>
              <Link href="/legal/privacy" className="hover:text-primary">
                {isDe ? "Datenschutz" : "Privacy"}
              </Link>
            </li>
            <li>
              <Link href="/legal/terms" className="hover:text-primary">
                {isDe ? "AGB" : "Terms"}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MicroLearn
      </div>
    </footer>
  );
}
