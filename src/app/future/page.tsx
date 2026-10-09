import type { Metadata } from "next";
import { AutoAdvance } from "@/components/transition/AutoAdvance";
import { PreloadImages } from "@/components/transition/PreloadImages";
import { WarmRoutes } from "@/components/transition/WarmRoutes";
import { SCENE_IMAGE_LIST } from "@/lib/scene/assets";
import { HOME_ROUTE } from "@/lib/site/nav";

export const metadata: Metadata = {
  title: "See your future — SUPARFLYY",
  description: "You must first see your future. Only then can you create it.",
};

/** The light lifts by ~0.75s (globals.css .light-lift-quick); the words then stay fully visible this long. */
const ARRIVE_MS = 750;
const READ_MS = 750;
/** The words fade back into the same light before the balloon scene opens out of it. */
const LEAVE_MS = 600;
const WARM = [HOME_ROUTE];

/**
 * The interstitial between the intro and the home scene. Everything here sits
 * in the same warm light as the intro rain (--sunset), so the dive, the words
 * and the hand-off to the balloon scene read as one continuous move: the words
 * come up out of the light, hold for 750ms, sink back into it, and the sunset
 * scene opens out of that same light.
 */
export default function FuturePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-sunset px-6 text-center">
      <h1 className="arrive max-w-[32ch] font-display text-[clamp(2.25rem,5vw,4.5rem)] font-normal leading-[1.08] tracking-[-0.01em] text-ink text-balance">
        <span className="block">You must first see your future.</span>
        <span className="mt-[0.35em] block">Only then can you create it.</span>
      </h1>

      {/* The light the intro dived into — it lifts to reveal the words. */}
      <div aria-hidden="true" className="light-lift-quick pointer-events-none fixed inset-0 z-50 bg-sunset" />

      {/* Load the balloon scene while the words are up, so it opens complete. */}
      <PreloadImages srcs={SCENE_IMAGE_LIST} />
      <WarmRoutes hrefs={WARM} />
      <AutoAdvance href={HOME_ROUTE} afterMs={ARRIVE_MS + READ_MS} fadeMs={LEAVE_MS} tone="bg-sunset" />
    </main>
  );
}
