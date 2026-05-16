"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Usb,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Download,
  Cpu,
} from "lucide-react";

type Stage =
  | "idle"
  | "unsupported"
  | "fetching"
  | "connecting"
  | "preparing"
  | "flashing"
  | "done"
  | "error";

type EspChip = "esp32" | "esp32s3" | "esp32c3" | "esp32s2" | "esp8266";

interface EspFlashButtonProps {
  firmwareUrl: string;
  chip?: EspChip | null;
  flashAddress?: string | null;
}

// Convert binary string from fetch (latin1) into Uint8Array for esptool-js
async function fetchFirmwareBinary(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

function uint8ArrayToBinaryString(arr: Uint8Array): string {
  // esptool-js v0.6 expects fileArray.data as a string of byte chars
  // ("\xab\xcd\x12…") rather than the Uint8Array — convert here.
  let result = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.subarray(i, i + chunkSize);
    result += String.fromCharCode(...chunk);
  }
  return result;
}

export function EspFlashButton({
  firmwareUrl,
  chip,
  flashAddress,
}: EspFlashButtonProps) {
  const t = useTranslations("flash");
  const [stage, setStage] = useState<Stage>("idle");
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState({ written: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedChip, setDetectedChip] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const transportRef = useRef<unknown>(null);

  useEffect(() => {
    const nav = navigator as unknown as {
      serial?: { requestPort?: () => Promise<unknown> };
    };
    const supported =
      typeof navigator !== "undefined" &&
      typeof nav.serial?.requestPort === "function";
    if (!supported) setStage("unsupported");
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const appendLog = useCallback((line: string) => {
    setLog((prev) => {
      const next = [...prev, line];
      // Limit to last 60 lines to keep DOM small
      return next.length > 60 ? next.slice(next.length - 60) : next;
    });
  }, []);

  const reset = useCallback(() => {
    setStage("idle");
    setLog([]);
    setProgress({ written: 0, total: 0 });
    setErrorMsg(null);
    setDetectedChip(null);
  }, []);

  const flash = useCallback(async () => {
    if (stage === "flashing" || stage === "connecting") return;
    setLog([]);
    setProgress({ written: 0, total: 0 });
    setErrorMsg(null);
    setDetectedChip(null);

    type TransportLike = { disconnect?: () => Promise<void> };
    type LoaderLike = {
      main?: () => Promise<string>;
      writeFlash?: (opts: unknown) => Promise<void>;
      after?: () => Promise<void>;
    };
    let transport: TransportLike | null = null;
    let loader: LoaderLike | null = null;

    try {
      setStage("fetching");
      appendLog(t("log.fetching", { url: firmwareUrl }));
      const bin = await fetchFirmwareBinary(firmwareUrl);
      appendLog(t("log.fetched", { kb: Math.round(bin.byteLength / 1024) }));

      setStage("connecting");
      appendLog(t("log.requestPort"));
      const nav = navigator as unknown as {
        serial: { requestPort: () => Promise<unknown> };
      };
      const port = await nav.serial.requestPort();
      if (!port) {
        throw new Error("no_port");
      }

      const esptool = await import("esptool-js");
      const TransportCtor = (esptool as unknown as { Transport: new (port: unknown, debug?: boolean) => unknown }).Transport;
      const ESPLoaderCtor = (esptool as unknown as { ESPLoader: new (opts: unknown) => unknown }).ESPLoader;

      transport = new TransportCtor(port, false) as TransportLike;
      transportRef.current = transport;

      const terminal = {
        clean: () => {},
        writeLine: (line: string) => appendLog(line),
        write: (chunk: string) => {
          if (chunk.trim()) appendLog(chunk.trim());
        },
      };

      setStage("preparing");
      appendLog(t("log.connecting"));
      loader = new ESPLoaderCtor({
        transport,
        baudrate: 921600,
        terminal,
        debugLogging: false,
      }) as LoaderLike;

      const chipName = await loader!.main!();
      setDetectedChip(chipName ?? null);
      appendLog(t("log.chipDetected", { chip: chipName ?? "?" }));

      const address = parseInt(flashAddress ?? "0x10000", 16);
      setStage("flashing");
      appendLog(t("log.flashingAt", { address: `0x${address.toString(16)}` }));

      const binaryString = uint8ArrayToBinaryString(bin);

      await loader!.writeFlash!({
        fileArray: [{ data: binaryString, address }],
        flashSize: "keep",
        flashMode: "keep",
        flashFreq: "keep",
        eraseAll: false,
        compress: true,
        reportProgress: (_idx: number, written: number, total: number) => {
          setProgress({ written, total });
        },
      } as unknown);

      appendLog(t("log.flashed"));

      // Try to reset device
      try {
        await loader!.after!();
        appendLog(t("log.reset"));
      } catch {
        // non-fatal
      }

      setStage("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message);
      appendLog(`✗ ${message}`);
      setStage("error");
    } finally {
      try {
        await transport?.disconnect?.();
      } catch {
        // ignore
      }
    }
  }, [appendLog, firmwareUrl, flashAddress, stage, t]);

  const pct =
    progress.total > 0
      ? Math.min(100, Math.round((progress.written / progress.total) * 100))
      : 0;

  if (stage === "unsupported") {
    return <UnsupportedBrowserCard firmwareUrl={firmwareUrl} />;
  }

  const inProgress =
    stage === "connecting" ||
    stage === "fetching" ||
    stage === "preparing" ||
    stage === "flashing";

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="grid gap-3 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2.5">
            <Usb className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{t("title")}</div>
            <div className="text-xs text-muted-foreground">
              {t("subtitle", { chip: chip ?? "ESP32" })}
            </div>
          </div>
        </div>

        {stage === "idle" && (
          <Button type="button" onClick={flash} size="sm">
            <Usb className="mr-2 h-4 w-4" />
            {t("cta")}
          </Button>
        )}

        {inProgress && (
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>
                {stage === "fetching" && t("stageFetching")}
                {stage === "connecting" && t("stageConnecting")}
                {stage === "preparing" && t("stagePreparing")}
                {stage === "flashing" && t("stageFlashing")}
              </span>
            </div>
            {stage === "flashing" && progress.total > 0 && (
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-baseline justify-between text-xs tabular-nums text-muted-foreground">
                  <span>
                    {Math.round(progress.written / 1024)} /{" "}
                    {Math.round(progress.total / 1024)} KB
                  </span>
                  <span className="font-semibold text-foreground">{pct}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {stage === "done" && (
          <div className="grid gap-2 rounded-xl border border-emerald-300 bg-emerald-500/10 p-3 text-sm dark:border-emerald-800">
            <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {t("done")}
            </div>
            <p className="text-xs text-muted-foreground">{t("doneBody")}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              className="justify-self-start"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("again")}
            </Button>
          </div>
        )}

        {stage === "error" && (
          <div className="grid gap-2 rounded-xl border border-amber-300 bg-amber-500/10 p-3 text-sm dark:border-amber-800">
            <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {t("error")}
            </div>
            {errorMsg && (
              <p className="text-xs text-muted-foreground">{errorMsg}</p>
            )}
            <p className="text-xs text-muted-foreground">{t("errorHint")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reset}
              className="justify-self-start"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("retry")}
            </Button>
          </div>
        )}

        {detectedChip && stage !== "idle" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Cpu className="h-3.5 w-3.5" />
            {t("chipDetected", { chip: detectedChip })}
          </div>
        )}

        {log.length > 0 && (
          <details className="rounded-lg border bg-muted/40 text-xs">
            <summary className="cursor-pointer px-3 py-2 font-medium text-muted-foreground">
              {t("logToggle")}
            </summary>
            <div
              ref={logRef}
              className="max-h-40 overflow-y-auto px-3 pb-2 font-mono text-[11px] leading-relaxed text-muted-foreground"
            >
              {log.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </details>
        )}

        <a
          href={firmwareUrl}
          download
          className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          <Download className="h-3 w-3" />
          {t("downloadBin")}
        </a>
      </CardContent>
    </Card>
  );
}

function UnsupportedBrowserCard({ firmwareUrl }: { firmwareUrl: string }) {
  const t = useTranslations("flash");
  return (
    <Card className="border-amber-300 bg-amber-500/10 dark:border-amber-800">
      <CardContent className="grid gap-2 p-4 text-sm md:p-5">
        <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          {t("unsupportedTitle")}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("unsupportedBody")}
        </p>
        <ul className="ml-4 list-disc text-xs text-muted-foreground">
          <li>{t("unsupportedBullet1")}</li>
          <li>{t("unsupportedBullet2")}</li>
          <li>{t("unsupportedBullet3")}</li>
        </ul>
        <a
          href={firmwareUrl}
          download
          className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-amber-700 hover:underline dark:text-amber-300"
        >
          <Download className="h-3 w-3" />
          {t("downloadBin")}
        </a>
      </CardContent>
    </Card>
  );
}
