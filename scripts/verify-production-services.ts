/**
 * MIC-31: Verify production services (Upstash, R2, Resend, Stripe)
 * Run after setting all env vars in Vercel prod:
 *   pnpm tsx scripts/verify-production-services.ts
 *
 * Requires a .env.local with production values for local verification,
 * or run via `vercel env pull .env.local && pnpm tsx ...`
 */

import "dotenv/config";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";
import Stripe from "stripe";

const ok = (label: string) => console.log(`✓  ${label}`);
const fail = (label: string, err: unknown) => {
  console.error(`✗  ${label}:`, err instanceof Error ? err.message : err);
  process.exitCode = 1;
};

// ── 1. Upstash Redis ─────────────────────────────────────────────────────────
async function checkUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) { fail("Upstash", "UPSTASH_REDIS_REST_URL / _TOKEN not set"); return; }
  try {
    const redis = new Redis({ url, token });
    await redis.set("mic31:verify", "ok", { ex: 60 });
    const val = await redis.get("mic31:verify");
    if (val !== "ok") throw new Error(`Unexpected value: ${val}`);
    ok("Upstash Redis (EU) — SET/GET round-trip");
  } catch (err) { fail("Upstash Redis", err); }
}

// ── 2. Cloudflare R2 ─────────────────────────────────────────────────────────
async function checkR2() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL ?? process.env.R2_PUBLIC_HOST;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    fail("R2", "One or more R2_* env vars not set"); return;
  }
  try {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    const key = "mic31-verify/test.txt";
    await client.send(new PutObjectCommand({
      Bucket: bucket, Key: key,
      Body: Buffer.from("mic31-ok"), ContentType: "text/plain",
    }));
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = await res.Body?.transformToString();
    if (body !== "mic31-ok") throw new Error(`Unexpected body: ${body}`);
    ok(`R2 bucket "${bucket}" — PUT/GET round-trip`);
    ok(`R2 public URL prefix: ${publicUrl}`);
  } catch (err) { fail("Cloudflare R2", err); }
}

// ── 3. Resend ────────────────────────────────────────────────────────────────
async function checkResend() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey) { fail("Resend", "RESEND_API_KEY not set"); return; }
  if (!from) { fail("Resend", "EMAIL_FROM not set"); return; }
  try {
    const resend = new Resend(apiKey);
    // Send to a known good address — use the contact address from AGENTS.md
    const result = await resend.emails.send({
      from,
      to: "habedank@odisey.de",
      subject: "[MIC-31] Production services verification",
      html: "<p>MicroLearn production Resend integration verified. You can ignore this email.</p>",
      text: "MicroLearn production Resend integration verified.",
    });
    if ("error" in result && result.error) {
      throw new Error(JSON.stringify(result.error));
    }
    ok(`Resend — email queued from "${from}" (id: ${(result.data as { id?: string })?.id ?? "n/a"})`);
  } catch (err) { fail("Resend", err); }
}

// ── 4. Stripe live keys ──────────────────────────────────────────────────────
async function checkStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) { fail("Stripe", "STRIPE_SECRET_KEY not set"); return; }
  try {
    const stripe = new Stripe(apiKey, { apiVersion: "2025-02-24.acacia" });
    const account = await stripe.accounts.retrieve();
    const mode = apiKey.startsWith("sk_live_") ? "LIVE" : "TEST";
    if (mode !== "LIVE") {
      fail("Stripe", `Key is in TEST mode — expected live key (sk_live_...)`);
      return;
    }
    ok(`Stripe LIVE — account: ${account.id} (${account.country})`);
    // Verify webhook secret is set
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      fail("Stripe webhook", "STRIPE_WEBHOOK_SECRET not set");
    } else {
      ok("Stripe webhook secret configured");
    }
    // Verify publishable key
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_")) {
      fail("Stripe", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set or not live");
    } else {
      ok("Stripe publishable key (pk_live_...)");
    }
  } catch (err) { fail("Stripe", err); }
}

async function main() {
  console.log("=== MIC-31: Production Services Verification ===\n");
  await checkUpstash();
  await checkR2();
  await checkResend();
  await checkStripe();
  console.log("\nDone.");
}

main().catch(console.error);
