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

export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY,
  INSTITUTION: process.env.STRIPE_PRICE_INSTITUTION,
} as const;

export type CheckoutPlan = keyof typeof STRIPE_PRICES;

export function priceToTier(
  priceId: string | null | undefined,
): "PRO" | "INSTITUTION" | "FREE" {
  if (!priceId) return "FREE";
  if (priceId === STRIPE_PRICES.PRO_MONTHLY) return "PRO";
  if (priceId === STRIPE_PRICES.PRO_YEARLY) return "PRO";
  if (priceId === STRIPE_PRICES.INSTITUTION) return "INSTITUTION";
  return "FREE";
}
