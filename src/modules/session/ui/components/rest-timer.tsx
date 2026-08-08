"use client";

import { useEffect, useState } from "react";

const ZERO = "00:00";

function formatElapsed(ms: number): string {
  const total = Math.max(0, ms);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000)
    .toString()
    .padStart(2, "0");
  const s = Math.floor((total % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  return h > 0 ? `${h.toString().padStart(2, "0")}:${m}:${s}` : `${m}:${s}`;
}

interface RestTimerProps {
  /** Timestamp the current rest period started from. */
  startAt: number;
}

/**
 * Time since the last completed set. Rendered outside the card's scroll area
 * so it stays visible while the set list scrolls.
 */
export function RestTimer({ startAt }: RestTimerProps) {
  // Starts at zero so server and client render the same markup; the effect
  // corrects it on mount before the first interval tick.
  const [elapsed, setElapsed] = useState(ZERO);

  useEffect(() => {
    const tick = () => setElapsed(formatElapsed(Date.now() - startAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startAt]);

  return (
    <div className="bg-primary/8 border-primary/30 flex items-center justify-between rounded-lg border px-3.5 py-1.5">
      <span className="text-primary text-[10px] font-semibold tracking-[0.1em] uppercase">
        Rest timer
      </span>
      <span className="text-primary font-mono text-xl font-semibold">
        {elapsed}
      </span>
    </div>
  );
}
