"use client";

import { useEffect } from "react";

/**
 * Fetches and decodes images the next page will need, in the background, so
 * they're in the browser's cache before that page opens. Renders nothing.
 */
export function PreloadImages({ srcs }: { srcs: string[] }) {
  useEffect(() => {
    const start = () =>
      srcs.forEach((src) => {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        img.decode().catch(() => {
          /* best effort — the page loads it normally if this fails */
        });
      });
    // Don't compete with the current page's own first paint.
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(start, 200);
    return () => clearTimeout(t);
  }, [srcs]);

  return null;
}
