import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "See your future — SUPARFLYYART",
  description: "You must first see your future. Only then can you create it.",
};

/**
 * Reached through the white-out on the homepage. The page opens under the same
 * white light, which then lifts away to reveal the words beneath it.
 */
export default function FuturePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
      <h1 className="max-w-[32ch] font-display text-[clamp(2.25rem,5vw,4.5rem)] font-normal leading-[1.08] tracking-[-0.01em] text-ink text-balance">
        <span className="block">You must first see your future.</span>
        <span className="mt-[0.35em] block">Only then can you create it.</span>
      </h1>

      <div className="fixed inset-x-0 bottom-8 flex justify-center">
        <Link
          href="/"
          className="font-display text-xs uppercase tracking-[0.3em] text-ink-muted transition-colors hover:text-ink"
        >
          Return
        </Link>
      </div>

      {/* The white light the homepage faded into — it fades out to reveal the page. */}
      <div aria-hidden="true" className="light-lift pointer-events-none fixed inset-0 z-50 bg-paper" />
    </main>
  );
}
