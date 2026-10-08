import Image from "next/image";
import { SceneParallax } from "./SceneParallax";

/**
 * Where the balloon sits in the 1920×1082 artwork, in % of the frame.
 * Printed by scripts/cut-balloon.py — re-run it and update these if the artwork changes.
 */
const BALLOON = { left: 61.458, top: 17.006, width: 15.625, height: 34.935 };

/**
 * The home scene: at sunset, a man holding a blank canvas watches a red balloon
 * bearing the S rise over the city. Built from docs/design/balloon-scene.jpg,
 * split into two layers by scripts/cut-balloon.py so the balloon can float:
 *
 *  - sky.webp      the scene with the balloon removed
 *  - balloon.webp  the balloon and basket on transparency
 *
 * Both sit on a "stage" in the artwork's frame (see .scene-stage in globals.css),
 * so they stay registered at any screen size. On arrival the camera settles; the
 * balloon then bobs and sways, the sun breathes, and the pointer adds a little
 * depth. Tall phone screens get a slow pan from the man across to the balloon.
 */
export function BalloonScene() {
  return (
    <section aria-labelledby="scene-title" className="scene relative w-full overflow-hidden bg-[#f3b46a]">
      <h1 id="scene-title" className="sr-only">
        SUPARFLYY — you must first see your future
      </h1>

      <div className="scene-stage">
        <div className="scene-sky absolute inset-[-1%]">
          <Image
            src="/scene/sky.webp"
            alt="At sunset, a man holding a blank canvas stands on a wet plaza and watches a red hot-air balloon marked with an S rise over the city skyline."
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div className="sun-glow" aria-hidden="true" />

        <div
          className="scene-balloon"
          style={{
            left: `${BALLOON.left}%`,
            top: `${BALLOON.top}%`,
            width: `${BALLOON.width}%`,
            height: `${BALLOON.height}%`,
          }}
          aria-hidden="true"
        >
          <div className="balloon-float">
            <Image src="/scene/balloon.webp" alt="" fill sizes="20vw" className="object-contain" />
          </div>
        </div>
      </div>

      <SceneParallax />
    </section>
  );
}
