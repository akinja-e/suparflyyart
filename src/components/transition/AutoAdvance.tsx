"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LightWash } from "./LightWash";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

interface AutoAdvanceProps {
  /** Where to go next. */
  href: string;
  /** How long to wait before leaving, ms (counted from when the page appears). */
  afterMs: number;
  /** Length of the fade to white on the way out, ms. */
  fadeMs?: number;
}

/**
 * Moves on to `href` by itself after `afterMs`, fading the page to pure white
 * first so the next page can open from the same white. Prefetches the next page
 * so it's ready the moment the screen is white.
 */
export function AutoAdvance({ href, afterMs, fadeMs = 750 }: AutoAdvanceProps) {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    router.prefetch(href);
    const timer = window.setTimeout(() => {
      if (reducedMotion) router.push(href);
      else setLeaving(true);
    }, afterMs);
    return () => window.clearTimeout(timer);
  }, [router, href, afterMs, reducedMotion]);

  return leaving ? <LightWash durationMs={fadeMs} onComplete={() => router.push(href)} /> : null;
}
