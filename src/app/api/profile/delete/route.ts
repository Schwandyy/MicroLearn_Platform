import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

const schema = z.object({
  confirm: z.string().refine(
    (v) => v === "DELETE" || v === "LÖSCHEN" || v === "LOESCHEN",
    { message: "Confirm phrase does not match" },
  ),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid confirmation" }, { status: 400 });
  }

  // Hard-delete: User-Modell hat `onDelete: Cascade` auf alle abhängigen Tabellen.
  // Subscription wird mitgelöscht — Stripe-Cancel sollte vorher passieren (manuell
  // im Customer-Portal oder via Webhook beim Sub-Delete).
  await prisma.user.delete({ where: { id: session.user.id } });

  // Session-Cookies werden serverseitig nicht mehr gültig sein (JWT verweist auf
  // nicht-existenten User), Client soll sich neu anmelden / Cookies clearen.
  return NextResponse.json({ ok: true });
}
