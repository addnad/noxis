import { NextResponse } from "next/server";
import { getLedgerStatus } from "@/lib/zg/broker";
import {
  hasServerWallet,
  ZG_COMPUTE_PROVIDER,
  KNOWN_PROVIDERS,
} from "@/lib/zg/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  if (!hasServerWallet()) {
    return NextResponse.json({
      configured: false,
      provider: ZG_COMPUTE_PROVIDER,
      providerLabel: KNOWN_PROVIDERS[ZG_COMPUTE_PROVIDER] || "unknown",
    });
  }
  try {
    const status = await getLedgerStatus();
    return NextResponse.json({ configured: true, ...status });
  } catch (e) {
    return NextResponse.json(
      { configured: true, error: (e as Error).message },
      { status: 200 },
    );
  }
}
