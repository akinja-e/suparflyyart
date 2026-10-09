import type { Metadata } from "next";
import { BalloonScene } from "@/components/scene/BalloonScene";
import { SceneReveal } from "@/components/scene/SceneReveal";

export const metadata: Metadata = {
  title: "SUPARFLYY — A collectible universe",
  description: "Art pieces and collectible objects. A collectible universe by SUPARFLYY.",
};

/**
 * Home: the balloon scene, full screen with no header. Arrived at from the quote
 * page through the warm intro light (--sunset); the light holds until every
 * layer has loaded (SceneReveal), then lifts while the camera settles.
 */
export default function HomePage() {
  return (
    <>
      <main>
        <BalloonScene />
      </main>
      <SceneReveal />
    </>
  );
}
