import { NextResponse } from "next/server";
import { downloadBytes } from "@/lib/zg/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const root = searchParams.get("root");
  if (!root) {
    return NextResponse.json({ error: "root required" }, { status: 400 });
  }
  try {
    const bytes = await downloadBytes(root);
    return NextResponse.json({
      dataB64: Buffer.from(bytes).toString("base64"),
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "download failed" },
      { status: 500 },
    );
  }
}
