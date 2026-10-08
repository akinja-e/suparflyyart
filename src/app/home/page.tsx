import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { BalloonScene } from "@/components/scene/BalloonScene";

export const metadata: Metadata = {
  title: "SUPARFLYY — A collectible universe",
  description: "Art pieces and collectible objects. A collectible universe by SUPARFLYY.",
};

/**
 * Home: the balloon scene. Arrived at from the quote page through white, so it
 * opens under the same white light, which lifts while the camera settles.
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-[3.75rem]">
        <BalloonScene />
      </main>
      <div aria-hidden="true" className="light-lift pointer-events-none fixed inset-0 z-50 bg-paper" />
    </>
  );
}
