"use client";

import { useEffect, useRef } from "react";

/** How long the light takes to lift once the scene is ready, ms. */
const LIFT_MS = 1400;
/** Never hold the light longer than this waiting for images, ms. */
const MAX_WAIT_MS = 2500;

/**
 * The warm light the quote page fades into, held over the home scene until
 * every image layer has loaded and decoded — then it lifts. Without this the
 * layers arrive at different moments and pop in mid-fade (a visible flicker).
 *
 * When the scene is ready it also sets data-ready on it, which starts the
 * camera's settle (paused until then in globals.css), so the move and the
 * reveal begin together.
 */
export function SceneReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const light = ref.current;
    const scene = document.querySelector<HTMLElement>(".scene");
    if (!light || !scene) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const images = Array.from(scene.querySelectorAll("img"));
    const ready = Promise.all(
      images.map((img) =>
        (img.complete
          ? Promise.resolve()
          : new Promise<void>((done) => {
              img.addEventListener("load", () => done(), { once: true });
              img.addEventListener("error", () => done(), { once: true });
            })
        ).then(() => img.decode().catch(() => undefined)),
      ),
    );
    const timeout = new Promise((done) => setTimeout(done, MAX_WAIT_MS));

    let cancelled = false;
    let lift: Animation | undefined;
    Promise.race([ready, timeout]).then(() => {
      if (cancelled) return;
      scene.dataset.ready = "";
      if (reduced) {
        light.style.opacity = "0";
        return;
      }
      // Wait one frame so the decoded layers are painted under the light first.
      requestAnimationFrame(() => {
        if (cancelled) return;
        lift = light.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: LIFT_MS,
          easing: "cubic-bezier(0.45, 0, 0.2, 1)",
          fill: "forwards",
        });
      });
    });

    return () => {
      cancelled = true;
      lift?.cancel();
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 bg-sunset" />;
}
