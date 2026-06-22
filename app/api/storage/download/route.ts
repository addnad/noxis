import { NextResponse } from "next/server";
import { downloadBytes } from "@/lib/zg/storage";
import { hasServerWallet } from "@/lib/zg/config";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!hasServerWallet()) {
    return NextResponse.json(
      { error: "Server wallet not configured." },
      { status: 503 },
    );
  }
  try {
    const { searchParams } = new URL(req.url);
    const root = searchParams.get("root");
    if (!root) {
      return NextResponse.json({ error: "root param required" }, { status: 400 });
    }
    const bytes = await downloadBytes(root);
    // toB64 is a browser util — replicate it on the server
    const dataB64 = Buffer.from(bytes).toString("base64");
    return NextResponse.json({ dataB64 });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "download failed" },
      { status: 500 },
    );
  }
}
