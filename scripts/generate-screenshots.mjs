#!/usr/bin/env node
/**
 * Automated App-Store-Screenshot pipeline.
 *
 * Loops over the screen + device matrix below, opens each route in a
 * headless Chromium with the right DPR, waits for layout-stable signal, and
 * writes the PNG into `docs/store/assets/screenshots/<device>/`.
 *
 *   BASE_URL=http://localhost:3030 pnpm screenshots:store
 *
 * Auth-gated screens are tagged `requiresAuth: true` and skipped unless a
 * cookie file `.screenshot-cookies.json` (Playwright storageState format) is
 * present in the project root — the user can log in once via the regular
 * sign-in flow, run `pnpm screenshots:capture-session`, and have it written
 * out for subsequent runs.
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3030";
const LOCALE = process.env.SCREENSHOT_LOCALE ?? "de";
const STORAGE_STATE = path.resolve(".screenshot-cookies.json");
const OUT_ROOT = path.resolve("docs/store/assets/screenshots");

const DEVICES = [
  {
    id: "ios-67",
    label: "iPhone 6.7\"",
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    id: "ipad-pro-129",
    label: "iPad Pro 12.9\"",
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  {
    id: "android-phone",
    label: "Android phone",
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  },
];

const SCREENS = [
  {
    id: "01-landing",
    path: "/",
    requiresAuth: false,
    waitFor: "h1",
  },
  {
    id: "02-pricing",
    path: "/pricing",
    requiresAuth: false,
    waitFor: "[data-testid='plan-card'], h1",
  },
  {
    id: "03-mentor",
    path: "/mentor",
    requiresAuth: true,
    waitFor: "form, h1",
  },
  {
    id: "04-dashboard",
    path: "/dashboard",
    requiresAuth: true,
    waitFor: "h1",
  },
  {
    id: "05-classroom-curriculum",
    path: process.env.SCREENSHOT_CLASSROOM_PATH ?? null,
    requiresAuth: true,
    waitFor: "h1",
    note: "Set SCREENSHOT_CLASSROOM_PATH=/de/classroom/<id> to capture.",
  },
  {
    id: "06-legal-datenschutz",
    path: "/legal/datenschutz",
    requiresAuth: false,
    waitFor: "h1",
  },
];

const hasAuthState = existsSync(STORAGE_STATE);

async function captureAll() {
  console.log(`📸 base=${BASE_URL} locale=${LOCALE} auth=${hasAuthState ? "yes" : "no"}`);

  const browser = await chromium.launch();

  let captured = 0;
  let skipped = 0;
  let failed = 0;

  for (const device of DEVICES) {
    const deviceDir = path.join(OUT_ROOT, device.id);
    await mkdir(deviceDir, { recursive: true });

    const context = await browser.newContext({
      viewport: device.viewport,
      deviceScaleFactor: device.deviceScaleFactor,
      isMobile: device.isMobile,
      hasTouch: device.hasTouch,
      userAgent: device.userAgent,
      locale: LOCALE === "en" ? "en-US" : "de-DE",
      storageState: hasAuthState ? STORAGE_STATE : undefined,
    });

    for (const screen of SCREENS) {
      if (!screen.path) {
        console.log(`  skip ${device.id} ${screen.id} — no path (${screen.note ?? ""})`);
        skipped += 1;
        continue;
      }
      if (screen.requiresAuth && !hasAuthState) {
        console.log(`  skip ${device.id} ${screen.id} — requires sign-in cookie (run pnpm screenshots:capture-session)`);
        skipped += 1;
        continue;
      }

      const url = new URL(`/${LOCALE}${screen.path}`, BASE_URL).toString();
      const out = path.join(deviceDir, `${screen.id}.png`);

      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 25_000 });
        if (screen.waitFor) {
          await page
            .waitForSelector(screen.waitFor, { timeout: 5_000 })
            .catch(() => undefined);
        }
        await page.waitForTimeout(400); // settle animations
        await page.screenshot({ path: out, fullPage: false });
        console.log(`  ✓ ${device.id}/${screen.id} (${url})`);
        captured += 1;
      } catch (err) {
        console.log(`  ✗ ${device.id}/${screen.id} — ${(err && err.message) || err}`);
        failed += 1;
      } finally {
        await page.close();
      }
    }

    await context.close();
  }

  await browser.close();
  console.log(
    `\nDone. captured=${captured} skipped=${skipped} failed=${failed} → ${path.relative(process.cwd(), OUT_ROOT)}`,
  );
  if (failed > 0) process.exitCode = 1;
}

captureAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
