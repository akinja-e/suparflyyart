"use client";

import { useEffect, useRef, type RefObject } from "react";
import { SRainEngine, type SRainOptions } from "@/lib/rain/SRainEngine";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

interface SRainProps extends SRainOptions {
  className?: string;
  /** Receives the running engine, for imperative effects like the exit burst. */
  engineRef?: RefObject<SRainEngine | null>;
}

/**
 * Full-bleed background of falling S marks.
 *
 * - Pauses when off-screen or when the tab is hidden (zero cost when unseen).
 * - Opens a clear space around the mouse / finger (glyphs spring aside), with a
 *   large S that follows the pointer while it moves.
 * - Honours prefers-reduced-motion with a single still frame and no pointer effect.
 * - Decorative only, so it is hidden from assistive tech.
 */
export function SRain({ className, engineRef, ...options }: SRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const { glyphSize, palette, speed, fade, trailOpacity, intensity, maxDpr, repelRadius, cursorScale, cursorSwatch } =
    options;
  const cursorSwatchKey = cursorSwatch ? JSON.stringify(cursorSwatch) : "";
  // Compare the palette by content so an inline array prop doesn't restart the engine.
  const paletteKey = palette ? JSON.stringify(palette) : "";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: SRainEngine;
    try {
      engine = new SRainEngine(canvas, {
        glyphSize,
        palette,
        speed,
        fade,
        trailOpacity,
        intensity,
        maxDpr,
        repelRadius,
        cursorScale,
        cursorSwatch,
      });
    } catch (error) {
      // A missing 2D context should never break the page — the white
      // background simply shows through.
      console.warn(error);
      return;
    }

    let onScreen = true;
    const sync = () => {
      if (reducedMotion) engine.renderStill();
      else if (onScreen && !document.hidden) engine.start();
      else engine.stop();
    };

    const resizeObserver = new ResizeObserver(() => engine.resize());
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    visibilityObserver.observe(canvas);

    document.addEventListener("visibilitychange", sync);
    sync();

    // The canvas ignores clicks (pointer-events: none) so content above it stays
    // usable; the field listens on the window instead.
    const detachPointer = reducedMotion ? undefined : engine.attachPointer(window);
    if (engineRef) engineRef.current = engine;

    return () => {
      if (engineRef?.current === engine) engineRef.current = null;
      detachPointer?.();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      engine.destroy();
    };
    // Arrays are compared by value so inline props don't restart the engine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, glyphSize, paletteKey, speed?.join(), fade?.join(), trailOpacity, intensity, maxDpr, repelRadius, cursorScale, cursorSwatchKey]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className ?? "pointer-events-none fixed inset-0 h-full w-full"}
    />
  );
}
