"use client";

import { useEffect, useRef } from "react";

/** Pure-white hold once the screen is white, before navigating. */
const HOLD_MS = 160;

interface LightWashProps {
  /** Total length of the effect it accompanies, ms. The screen is pure white at the end. */
  durationMs: number;
  /** 0–1: how far into `durationMs` the white starts to rise (it's invisible before that). */
  startAt?: number;
  onComplete: () => void;
  /** Background class of the light it fades to (default pure white). */
  tone?: string;
}

/**
 * A full-screen fade to light (pure white unless `tone` says otherwise) — the "cut to white" at the end of the
 * camera dive. It stays invisible until `startAt`, rises to solid white by the
 * end, holds briefly, then calls `onComplete`. The next page starts on the
 * same white, so the hand-off is invisible.
 */
export function LightWash({ durationMs, startAt = 0, onComplete, tone = "bg-paper" }: LightWashProps) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(onComplete);

  useEffect(() => {
    done.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fade = el.animate(
      [
        { opacity: 0 },
        { opacity: 0, offset: startAt, easing: "cubic-bezier(0.5, 0, 0.75, 0)" },
        { opacity: 1 },
      ],
      { duration: durationMs, fill: "forwards" },
    );

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
  }, [durationMs, startAt]);

  return <div ref={ref} aria-hidden="true" className={`pointer-events-none fixed inset-0 z-50 opacity-0 ${tone}`} />;
}
