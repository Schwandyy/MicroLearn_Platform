import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { requireStripe, STRIPE_PRICES } from "@/server/lib/stripe";

const schema = z.object({
  plan: z.enum(["PRO_MONTHLY", "PRO_YEARLY", "INSTITUTION"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const priceId = STRIPE_PRICES[parsed.data.plan];
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price for ${parsed.data.plan} not configured.` },
      { status: 503 },
    );
  }

  let stripe;
  try {
    stripe = requireStripe();
  } catch {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let customerId = user.subscription?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? user.username ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        stripeCustomerId: customer.id,
        tier: "FREE",
      },
      update: { stripeCustomerId: customer.id },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3030";

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    billing_address_collection: "required",
    metadata: { userId: user.id, plan: parsed.data.plan },
    subscription_data: {
      metadata: { userId: user.id, plan: parsed.data.plan },
    },
  });

  return NextResponse.json({ url: checkout.url });
}
