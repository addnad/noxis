import { NextResponse } from "next/server";
import { uploadBytes } from "@/lib/zg/storage";
import { hasServerWallet } from "@/lib/zg/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasServerWallet()) {
    return NextResponse.json(
      { error: "Server wallet not configured (ZG_PRIVATE_KEY missing)." },
      { status: 503 },
    );
  }
  try {
    const { dataB64 } = await req.json();
    if (typeof dataB64 !== "string" || dataB64.length === 0) {
      return NextResponse.json({ error: "dataB64 required" }, { status: 400 });
    }
    const bytes = new Uint8Array(Buffer.from(dataB64, "base64"));
    const result = await uploadBytes(bytes);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "upload failed" },
      { status: 500 },
    );
  }
}
