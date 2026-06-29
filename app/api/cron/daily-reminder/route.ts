import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import webpush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const redis = Redis.fromEnv();

const PROMPTS = [
  "What's one thing worth remembering from today?",
  "Any decision you made today you'd want to recall later?",
  "Who did you talk to today that mattered?",
  "What's on your mind right now? Capture it before it fades.",
  "One small win from today?",
  "Something you learned, however tiny?",
  "What's a thought you don't want to lose?",
  "How did today actually feel?",
  "Anything left unsaid today?",
  "A moment from today worth keeping?",
  "What are you putting off — and why?",
  "Note one thing you're grateful for today.",
];

function randomPrompt(): string {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

export async function GET(req: Request) {
  // Accept the secret either as a Bearer header (Vercel Cron) or a ?key= query
  // param (external schedulers that can't set headers).
  const auth = req.headers.get("authorization");
  const { searchParams } = new URL(req.url);
  const keyParam = searchParams.get("key");
  const secret = process.env.CRON_SECRET;
  const authorized = auth === `Bearer ${secret}` || keyParam === secret;
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:noxis@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  // Collect all stored push subscriptions.
  const keys: string[] = [];
  let cursor = 0;
  do {
    const [next, batch] = await redis.scan(cursor, { match: "noxis:push:*", count: 100 });
    cursor = Number(next);
    keys.push(...batch);
  } while (cursor !== 0);

  let sent = 0;
  let pruned = 0;

  for (const key of keys) {
    const raw = await redis.get<string>(key);
    if (!raw) continue;
    let sub: webpush.PushSubscription;
    try {
      sub = typeof raw === "string" ? JSON.parse(raw) : (raw as unknown as webpush.PushSubscription);
    } catch {
      continue;
    }
    const payload = JSON.stringify({
      title: "Noxis — Journal A Moment",
      body: randomPrompt(),
    });
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (e: unknown) {
      // 404/410 means the subscription is dead — prune it.
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await redis.del(key);
        pruned++;
      }
    }
  }

  return NextResponse.json({ ok: true, subscribers: keys.length, sent, pruned });
}
