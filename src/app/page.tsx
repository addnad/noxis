"use client";

import { useEffect, useState } from "react";
import { Gate } from "@/components/Gate";
import { Workspace } from "@/components/Workspace";
import { isUnlocked } from "@/lib/vault";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUnlocked(isUnlocked());
  }, []);

  if (!mounted) {
    // Avoid hydration flash; the cipher backdrop from layout stays visible.
    return <div className="min-h-screen" />;
  }

  return unlocked ? (
    <Workspace onLock={() => setUnlocked(false)} />
  ) : (
    <Gate onEnter={() => setUnlocked(true)} />
  );
}
