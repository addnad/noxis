import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const redis = Redis.fromEnv();

// POST { subscription } — store a push subscription keyed by its endpoint.
export async function POST(req: Request) {
  try {
    const { subscription } = (await req.json()) as { subscription?: PushSubscriptionJSON };
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "subscription required" }, { status: 400 });
    }
    // Use a hash of the endpoint as the key so re-subscribes overwrite cleanly.
    const id = Buffer.from(subscription.endpoint).toString("base64url").slice(0, 64);
    await redis.set(`noxis:push:${id}`, JSON.stringify(subscription));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "subscribe failed" },
      { status: 500 },
    );
  }
}

// DELETE { endpoint } — remove a subscription (e.g. on permission revoke).
export async function DELETE(req: Request) {
  try {
    const { endpoint } = (await req.json()) as { endpoint?: string };
    if (!endpoint) {
      return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    }
    const id = Buffer.from(endpoint).toString("base64url").slice(0, 64);
    await redis.del(`noxis:push:${id}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "unsubscribe failed" },
      { status: 500 },
    );
  }
}
