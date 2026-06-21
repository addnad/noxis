"use client";

import { useEffect, useState } from "react";

export interface SystemStatus {
  configured: boolean;
  address?: string;
  nativeBalanceOG?: string;
  ledgerBalanceOG?: string | null;
  hasLedger?: boolean;
  ready?: boolean;
  provider?: string;
  providerLabel?: string;
  error?: string;
}

export function useStatus(pollMs = 0) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      setStatus(await res.json());
    } catch {
      setStatus({ configured: false, error: "unreachable" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    if (pollMs > 0) {
      const t = setInterval(refresh, pollMs);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, loading, refresh };
}

function short(addr?: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";
}

function fmt(v?: string | null) {
  if (v == null) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return n.toFixed(3);
}

export function StatusStrip({ status }: { status: SystemStatus | null }) {
  const ok = status?.configured && (status?.ready || Number(status?.nativeBalanceOG) > 0);
  const dotColor = !status
    ? "#6c7388"
    : ok
      ? "#2BF0BE"
      : status.configured
        ? "#F0B23D"
        : "#FF6B7A";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mono text-[11px] text-mist-300">
      <span className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full animate-pulse-ring"
          style={{ background: dotColor }}
        />
        <span className="text-mist-200">0G Galileo Testnet</span>
      </span>
      <span className="text-mist-500">·</span>
      <span>
        wallet <span className="text-mist-100">{short(status?.address)}</span>
      </span>
      <span className="text-mist-500">·</span>
      <span>
        gas <span className="text-mist-100">{fmt(status?.nativeBalanceOG)}</span> OG
      </span>
      <span className="text-mist-500">·</span>
      <span>
        ledger{" "}
        <span className="text-mist-100">
          {status?.hasLedger ? fmt(status?.ledgerBalanceOG) : "none"}
        </span>
      </span>
      <span className="text-mist-500">·</span>
      <span>
        model{" "}
        <span className="text-violet-300">{status?.providerLabel || "—"}</span>
      </span>
    </div>
  );
}
