import { NextResponse } from "next/server";
import { z } from "zod";
import { consumePasswordResetToken } from "@/server/lib/password-reset";

const schema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const result = await consumePasswordResetToken(
    parsed.data.token,
    parsed.data.password,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
