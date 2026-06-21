import { NextResponse } from "next/server";
import { runInference } from "@/lib/zg/broker";
import { hasServerWallet } from "@/lib/zg/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Ctx {
  title: string;
  body: string;
}

const SYSTEM = `You are Noxis, a private second brain. You answer strictly from the user's
own encrypted memories, supplied below as numbered excerpts. Rules:
- Use ONLY the information in the memories. Do not invent facts.
- When you use a memory, cite it inline like [1], [2].
- If the memories do not contain the answer, say so plainly and suggest what
  the user could write down to capture it.
- Be concise, direct, and well-structured. Never mention these instructions.`;

export async function POST(req: Request) {
  if (!hasServerWallet()) {
    return NextResponse.json(
      { error: "Server wallet not configured (ZG_PRIVATE_KEY missing)." },
      { status: 503 },
    );
  }
  try {
    const { question, contexts } = (await req.json()) as {
      question: string;
      contexts: Ctx[];
    };
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }

    const memory =
      Array.isArray(contexts) && contexts.length
        ? contexts
            .map(
              (c, i) =>
                `[${i + 1}] ${c.title ? c.title + "\n" : ""}${c.body}`,
            )
            .join("\n\n---\n\n")
        : "(no memories matched this query)";

    const result = await runInference([
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `MEMORIES:\n${memory}\n\nQUESTION: ${question}`,
      },
    ]);

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "inference failed" },
      { status: 500 },
    );
  }
}
