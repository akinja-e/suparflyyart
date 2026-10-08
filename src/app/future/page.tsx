import type { Metadata } from "next";
import { AutoAdvance } from "@/components/transition/AutoAdvance";
import { HOME_ROUTE } from "@/lib/site/nav";

export const metadata: Metadata = {
  title: "See your future — SUPARFLYY",
  description: "You must first see your future. Only then can you create it.",
};

/** The white light lifts by ~1.55s (globals.css .light-lift); the words then stay fully visible this long. */
const READ_MS = 1500;
const ARRIVE_MS = 1550;

/**
 * The interstitial between the intro and the home room. Reached through the
 * camera dive: it opens under white, the words settle into place, they hold
 * for 1.5s, then the page fades back to white and moves on to the home room.
 */
export default function FuturePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
      <h1 className="arrive max-w-[32ch] font-display text-[clamp(2.25rem,5vw,4.5rem)] font-normal leading-[1.08] tracking-[-0.01em] text-ink text-balance">
        <span className="block">You must first see your future.</span>
        <span className="mt-[0.35em] block">Only then can you create it.</span>
      </h1>

      {/* The white light the homepage faded into — it fades out to reveal the page. */}
      <div aria-hidden="true" className="light-lift pointer-events-none fixed inset-0 z-50 bg-paper" />

      <AutoAdvance href={HOME_ROUTE} afterMs={ARRIVE_MS + READ_MS} />
    </main>
  );
}
