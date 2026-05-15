import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import {
  createPresignedUpload,
  r2Configured,
  MAX_UPLOAD_BYTES,
} from "@/server/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  contentType: z.string().min(3).max(80),
  contentLength: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  purpose: z.enum(["project-cover", "avatar"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!r2Configured()) {
    return NextResponse.json(
      { error: "Upload-Storage ist nicht konfiguriert." },
      { status: 503 },
    );
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const presigned = await createPresignedUpload({
      contentType: parsed.data.contentType,
      contentLength: parsed.data.contentLength,
      prefix: `${parsed.data.purpose}/${session.user.id}`,
    });
    return NextResponse.json(presigned);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
