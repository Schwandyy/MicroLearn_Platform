"use client";

import { useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface WokwiEmbedProps {
  projectId: string;
  className?: string;
  /** Default off — autostart consumes a Wokwi credit for premium projects */
  autostart?: boolean;
}

/**
 * Embeds a public Wokwi project via iframe.
 * For premium/private projects, route requests through /api/wokwi/proxy
 * (server adds WOKWI_API_KEY — never exposed to the client).
 */
export function WokwiEmbed({
  projectId,
  className,
  autostart = false,
}: WokwiEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const src = `https://wokwi.com/projects/${encodeURIComponent(projectId)}/embed${
    autostart ? "?autostart=1" : ""
  }`;
  const fallback = `https://wokwi.com/projects/${encodeURIComponent(projectId)}`;

  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-card", className)}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <iframe
        title={`Wokwi project ${projectId}`}
        src={src}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        className="h-[520px] w-full"
        onLoad={() => setLoaded(true)}
      />
      <div className="flex items-center justify-end border-t bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <a
          href={fallback}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          Open in Wokwi <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
