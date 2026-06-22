import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const redis = Redis.fromEnv();

// GET /api/pointer?user=<usernameHash>  →  { root: string | null }
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get("user");
    if (!user) {
      return NextResponse.json({ error: "user required" }, { status: 400 });
    }
    const root = await redis.get<string>(`noxis:ptr:${user}`);
    return NextResponse.json({ root: root ?? null });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "pointer read failed" },
      { status: 500 },
    );
  }
}

// POST /api/pointer  { user, root }  →  { ok: true }
export async function POST(req: Request) {
  try {
    const { user, root } = (await req.json()) as { user?: string; root?: string };
    if (!user || !root) {
      return NextResponse.json({ error: "user and root required" }, { status: 400 });
    }
    await redis.set(`noxis:ptr:${user}`, root);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "pointer write failed" },
      { status: 500 },
    );
  }
}
