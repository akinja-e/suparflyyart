"use client";

import { useEffect } from "react";

/**
 * Development only: the dev server builds each page the first time it's
 * visited, and router.prefetch does nothing in development. That first build
 * showed up as a long pause (and sometimes a reload that replayed the quote)
 * mid-transition. Requesting the next pages early makes the dev server build
 * them while the current page is on screen. In production pages are prebuilt
 * and prefetched, so this renders nothing and does nothing.
 */
export function WarmRoutes({ hrefs }: { hrefs: string[] }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const controller = new AbortController();
    hrefs.forEach((href) => fetch(href, { signal: controller.signal }).catch(() => undefined));
    return () => controller.abort();
  }, [hrefs]);

  return null;
}
