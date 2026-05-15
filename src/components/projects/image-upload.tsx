"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ImageUpload({
  name,
  initialUrl,
}: {
  name: string;
  initialUrl?: string;
}) {
  const t = useTranslations("projects");
  const { toast } = useToast();
  const [url, setUrl] = useState<string>(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!ALLOWED.includes(file.type)) {
      toast({
        title: t("uploadFailed"),
        description: t("uploadHint"),
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({
        title: t("uploadFailed"),
        description: t("uploadHint"),
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: file.type,
          contentLength: file.size,
          purpose: "project-cover",
        }),
      });
      if (signRes.status === 503) {
        toast({
          title: t("uploadDisabled"),
          variant: "destructive",
        });
        return;
      }
      if (!signRes.ok) {
        const err = await signRes.json().catch(() => ({}));
        toast({
          title: t("uploadFailed"),
          description: err?.error ?? "",
          variant: "destructive",
        });
        return;
      }
      const { uploadUrl, publicUrl } = (await signRes.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        toast({ title: t("uploadFailed"), variant: "destructive" });
        return;
      }
      setUrl(publicUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-3">
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border bg-muted">
          <Image
            src={url}
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 768px) 640px, 100vw"
            unoptimized
          />
          <button
            type="button"
            aria-label={t("remove")}
            onClick={() => setUrl("")}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center rounded-md border border-dashed bg-muted/30">
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("uploading")}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {t("uploadButton")}
            </>
          )}
        </Button>
        <Input
          type="url"
          placeholder={t("fieldImagePlaceholder")}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 min-w-[12rem]"
        />
      </div>
      <p className="text-xs text-muted-foreground">{t("uploadHint")}</p>

      <input
        ref={fileRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
