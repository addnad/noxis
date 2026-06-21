"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@$/<>*+=";

/**
 * The signature Noxis animation: text resolves out of random cipher glyphs,
 * left-to-right, as if it were being decrypted in real time.
 */
export function DecryptText({
  text,
  className = "",
  speed = 28,
  startDelay = 0,
  play = true,
}: {
  text: string;
  className?: string;
  speed?: number; // ms per frame
  startDelay?: number;
  play?: boolean;
}) {
  const [display, setDisplay] = useState(play ? "" : text);
  const frame = useRef(0);
  const raf = useRef<number | null>(null);
  const last = useRef(0);

  useEffect(() => {
    if (!play) {
      setDisplay(text);
      return;
    }
    let started = false;
    const startAt = performance.now() + startDelay;
    frame.current = 0;

    const tick = (now: number) => {
      if (now < startAt) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      if (!started) {
        started = true;
        last.current = now;
      }
      if (now - last.current >= speed) {
        last.current = now;
        frame.current += 1;
        const revealed = Math.floor(frame.current / 2);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          if (text[i] === " ") {
            out += " ";
          } else if (i < revealed) {
            out += text[i];
          } else {
            out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }
        setDisplay(out);
        if (revealed >= text.length) {
          setDisplay(text);
          return;
        }
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, play]);

  return <span className={className}>{display || " "}</span>;
}
