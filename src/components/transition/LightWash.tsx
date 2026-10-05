"use client";

import { useEffect, useRef } from "react";

/** How long the screen takes to fade to pure white, ms. */
export const LIGHT_WASH_MS = 900;
/** Pure-white hold once the fade completes, before navigating. */
const HOLD_MS = 160;

interface LightWashProps {
  onComplete: () => void;
}

/**
 * A full-screen fade to pure white. It runs over the burning-out rain, then
 * holds briefly and calls `onComplete`; the next page starts on the same
 * white, so the hand-off is invisible.
 */
export function LightWash({ onComplete }: LightWashProps) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(onComplete);

  useEffect(() => {
    done.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Eases in slowly so the S's are seen dissolving before the white takes over.
    const fade = el.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: LIGHT_WASH_MS,
      easing: "cubic-bezier(0.5, 0, 0.3, 1)",
      fill: "forwards",
    });

    let timer = 0;
    fade.finished
      .then(() => {
        timer = window.setTimeout(() => done.current(), HOLD_MS);
      })
      .catch(() => {
        /* cancelled on unmount */
      });

    return () => {
      fade.cancel();
      window.clearTimeout(timer);
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 bg-paper opacity-0" />;
}
