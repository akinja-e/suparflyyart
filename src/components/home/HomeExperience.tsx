"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SRain } from "@/components/background/SRain";
import type { SRainEngine } from "@/lib/rain/SRainEngine";
import { LightWash, LIGHT_WASH_MS } from "@/components/transition/LightWash";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

const NEXT_ROUTE = "/future";

/** How the rain itself burns out: colours blown out to white, softened, faded. */
const RAIN_BURN_OUT: Keyframe[] = [
  { opacity: 1, filter: "brightness(1) saturate(1) blur(0px)" },
  { opacity: 0.85, filter: "brightness(1.8) saturate(1.3) blur(1px)", offset: 0.35 },
  { opacity: 0, filter: "brightness(3.2) saturate(0.6) blur(6px)" },
];

/**
 * The homepage: the S rain, and a click / tap / Enter anywhere that dissolves
 * everything into pure white — the big cursor S swelling and melting into the
 * light — before moving on to the next page.
 */
export function HomeExperience() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const rainLayerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SRainEngine | null>(null);
  const [washing, setWashing] = useState(false);

  // Fetch the next page ahead of time so it's ready the moment the light peaks.
  useEffect(() => {
    router.prefetch(NEXT_ROUTE);
  }, [router]);

  const begin = useCallback(
    (clientX: number, clientY: number) => {
      if (washing) return; // already on the way
      if (reducedMotion) {
        router.push(NEXT_ROUTE);
        return;
      }
      setWashing(true);
      // The big S swells and melts into the light as the screen goes white.
      engineRef.current?.burstCursor(LIGHT_WASH_MS, clientX, clientY);
      rainLayerRef.current?.animate(RAIN_BURN_OUT, {
        duration: LIGHT_WASH_MS * 0.85,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
      });
    },
    [washing, reducedMotion, router],
  );

  return (
    <main className="relative min-h-dvh">
      {/* Fixed layer so the burn-out filter applies to the full-screen canvas. */}
      <div ref={rainLayerRef} className="pointer-events-none fixed inset-0">
        <SRain className="absolute inset-0 h-full w-full" engineRef={engineRef} />
      </div>

      <h1 className="sr-only">SUPARFLYYART</h1>

      {/* The whole screen is the way in. A real button keeps it keyboard- and screen-reader-friendly. */}
      <button
        type="button"
        aria-label="Enter SUPARFLYYART"
        disabled={washing}
        onClick={(e) => {
          // Keyboard "clicks" report 0,0 — start those from the centre instead.
          const fromKeyboard = e.detail === 0;
          begin(fromKeyboard ? window.innerWidth / 2 : e.clientX, fromKeyboard ? window.innerHeight / 2 : e.clientY);
        }}
        className="fixed inset-0 h-full w-full cursor-pointer bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/40"
      />

      {washing && <LightWash onComplete={() => router.push(NEXT_ROUTE)} />}
    </main>
  );
}
