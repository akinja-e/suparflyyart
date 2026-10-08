"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

/**
 * Feeds the pointer position (−1…1 on each axis, eased) into --px / --py on the
 * enclosing scene, which the sky and balloon layers turn into a small parallax
 * offset. Renders nothing. Off for reduced motion and on touch-only devices.
 */
export function SceneParallax() {
  const markerRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const scene = markerRef.current?.parentElement;
    if (!scene || reducedMotion || !window.matchMedia("(hover: hover)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let raf = 0;

    const tick = () => {
      // Ease toward the pointer so the layers drift rather than jump.
      x += (targetX - x) * 0.06;
      y += (targetY - y) * 0.06;
      scene.style.setProperty("--px", x.toFixed(4));
      scene.style.setProperty("--py", y.toFixed(4));
      raf = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.0005 ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return <span ref={markerRef} hidden />;
}
