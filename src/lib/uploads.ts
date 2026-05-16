export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface UploadOptions {
  file: File;
  purpose: "project-cover" | "avatar" | "lesson-step";
}

export interface UploadResult {
  publicUrl: string;
}

export async function uploadImage({
  file,
  purpose,
}: UploadOptions): Promise<UploadResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as never)) {
    throw new Error("invalid_type");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("too_large");
  }
  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentType: file.type,
      contentLength: file.size,
      purpose,
    }),
  });
  if (signRes.status === 503) throw new Error("storage_disabled");
  if (!signRes.ok) {
    const err = (await signRes.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(err?.error ?? "sign_failed");
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
  if (!putRes.ok) throw new Error("put_failed");
  return { publicUrl };
}
