#!/usr/bin/env node
/**
 * Open a real Chromium window so the operator can sign in manually, then
 * persist the resulting cookies + localStorage into
 * `.screenshot-cookies.json`. The screenshot pipeline then re-uses that
 * session for auth-gated screens without ever holding raw credentials.
 *
 *   BASE_URL=http://localhost:3030 pnpm screenshots:capture-session
 *
 * Press <enter> in the terminal after you have signed in.
 */

import { chromium } from "playwright";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3030";
const LOCALE = process.env.SCREENSHOT_LOCALE ?? "de";
const OUT = path.resolve(".screenshot-cookies.json");

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: LOCALE === "en" ? "en-US" : "de-DE",
});
const page = await context.newPage();
await page.goto(new URL(`/${LOCALE}/auth/sign-in`, BASE_URL).toString());

console.log(
  "Sign in manually in the opened browser window, then press <enter> here.",
);
const rl = readline.createInterface({ input: stdin, output: stdout });
await rl.question("> ");
rl.close();

await context.storageState({ path: OUT });
await browser.close();

console.log(`✓ session written to ${OUT}`);
