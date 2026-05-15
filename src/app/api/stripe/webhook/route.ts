import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/server/db/prisma";
import { requireStripe, priceToTier } from "@/server/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json(
      { error: "Webhook signature missing or secret unset." },
      { status: 400 },
    );
  }

  let stripe;
  try {
    stripe = requireStripe();
  } catch {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.metadata?.userId as string | undefined) ?? null;
        if (userId && typeof session.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscription(userId, sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId =
          (sub.metadata?.userId as string | undefined) ??
          (await userIdByCustomerId(sub.customer as string));
        if (userId) await syncSubscription(userId, sub);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const userId = await userIdByCustomerId(inv.customer as string);
        if (userId) {
          await prisma.subscription.update({
            where: { userId },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }
      default:
        // ignore other events
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler failed", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function userIdByCustomerId(customerId: string): Promise<string | null> {
  const sub = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    select: { userId: true },
  });
  return sub?.userId ?? null;
}

async function syncSubscription(userId: string, sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price.id ?? null;
  const tier = priceToTier(priceId);
  const status = ((): "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" => {
    switch (sub.status) {
      case "active":
        return "ACTIVE";
      case "trialing":
        return "TRIALING";
      case "past_due":
      case "unpaid":
        return "PAST_DUE";
      case "canceled":
        return "CANCELED";
      default:
        return "INCOMPLETE";
    }
  })();

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: sub.customer as string,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      tier,
      status,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    update: {
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      tier,
      status,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}
