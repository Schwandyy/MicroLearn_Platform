import "server-only";
import Stripe from "stripe";

const apiKey = process.env.STRIPE_SECRET_KEY;

export const stripe = apiKey
  ? new Stripe(apiKey, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
      appInfo: { name: "MicroLearn", version: "0.1.0" },
    })
  : null;

export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return stripe;
}

export type CheckoutPlan = "PRO_MONTHLY" | "PRO_YEARLY" | "INSTITUTION";
export type Currency = "EUR" | "CHF";

const PRICE_MATRIX: Record<CheckoutPlan, Record<Currency, string | undefined>> =
  {
    PRO_MONTHLY: {
      EUR: process.env.STRIPE_PRICE_PRO_MONTHLY,
      CHF: process.env.STRIPE_PRICE_PRO_MONTHLY_CHF,
    },
    PRO_YEARLY: {
      EUR: process.env.STRIPE_PRICE_PRO_YEARLY,
      CHF: process.env.STRIPE_PRICE_PRO_YEARLY_CHF,
    },
    INSTITUTION: {
      EUR: process.env.STRIPE_PRICE_INSTITUTION,
      CHF: process.env.STRIPE_PRICE_INSTITUTION_CHF,
    },
  };

/**
 * Returns the Stripe price-id for a plan in the requested currency, falling
 * back to EUR when the CHF variant is not configured. Keeps the migration
 * path safe — markets without CHF prices in Stripe keep working.
 */
export function getStripePriceId(
  plan: CheckoutPlan,
  currency: Currency = "EUR",
): string | undefined {
  return PRICE_MATRIX[plan][currency] ?? PRICE_MATRIX[plan].EUR;
}

/** Legacy alias — EUR only. Prefer `getStripePriceId(plan, currency)`. */
export const STRIPE_PRICES = {
  PRO_MONTHLY: PRICE_MATRIX.PRO_MONTHLY.EUR,
  PRO_YEARLY: PRICE_MATRIX.PRO_YEARLY.EUR,
  INSTITUTION: PRICE_MATRIX.INSTITUTION.EUR,
} as const;

export function priceToTier(
  priceId: string | null | undefined,
): "PRO" | "INSTITUTION" | "FREE" {
  if (!priceId) return "FREE";
  const proIds = [
    PRICE_MATRIX.PRO_MONTHLY.EUR,
    PRICE_MATRIX.PRO_MONTHLY.CHF,
    PRICE_MATRIX.PRO_YEARLY.EUR,
    PRICE_MATRIX.PRO_YEARLY.CHF,
  ].filter(Boolean) as string[];
  if (proIds.includes(priceId)) return "PRO";
  const instIds = [
    PRICE_MATRIX.INSTITUTION.EUR,
    PRICE_MATRIX.INSTITUTION.CHF,
  ].filter(Boolean) as string[];
  if (instIds.includes(priceId)) return "INSTITUTION";
  return "FREE";
}
