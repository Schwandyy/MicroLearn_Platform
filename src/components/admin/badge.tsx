import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "warn" | "warning" | "danger" | "success" | "info";
  className?: string;
}) {
  const isWarn = tone === "warn" || tone === "warning";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "default" && "bg-muted text-foreground",
        isWarn &&
          "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
        tone === "danger" && "bg-destructive/10 text-destructive",
        tone === "success" &&
          "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
        tone === "info" &&
          "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
        className,
      )}
    >
      {children}
    </span>
  );
}
