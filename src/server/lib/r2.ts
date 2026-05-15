import "server-only";
import crypto from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
// Öffentlicher Lese-Hostname (z. B. https://cdn.example.com oder
// https://<bucket>.<account>.r2.cloudflarestorage.com)
const R2_PUBLIC_HOST = process.env.R2_PUBLIC_HOST;

export function r2Configured(): boolean {
  return Boolean(
    R2_ACCOUNT_ID &&
      R2_ACCESS_KEY_ID &&
      R2_SECRET_ACCESS_KEY &&
      R2_BUCKET &&
      R2_PUBLIC_HOST,
  );
}

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!r2Configured()) {
    throw new Error("R2 not configured");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export async function createPresignedUpload(opts: {
  contentType: string;
  contentLength: number;
  prefix: string;
}): Promise<PresignedUpload> {
  if (!ALLOWED_MIME.has(opts.contentType)) {
    throw new Error("Unsupported file type");
  }
  if (opts.contentLength <= 0 || opts.contentLength > MAX_UPLOAD_BYTES) {
    throw new Error("File too large");
  }

  const ext = EXT_BY_MIME[opts.contentType] ?? "bin";
  const id = crypto.randomBytes(12).toString("base64url");
  const safePrefix = opts.prefix.replace(/[^a-zA-Z0-9_-]/g, "");
  const key = `${safePrefix}/${id}.${ext}`;

  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET!,
    Key: key,
    ContentType: opts.contentType,
    ContentLength: opts.contentLength,
  });
  const uploadUrl = await getSignedUrl(getClient(), cmd, { expiresIn: 300 });
  const publicHost = R2_PUBLIC_HOST!.replace(/\/$/, "");
  const publicUrl = `${publicHost}/${key}`;

  return { uploadUrl, publicUrl, key, expiresIn: 300 };
}
