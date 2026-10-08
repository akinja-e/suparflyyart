import Image from "next/image";
import { HeroLinework } from "./HeroLinework";

/**
 * The home hero from docs/design/home-mockup.jpg: an empty concrete room in
 * late sun, drafting linework on the wall, and a black stone disc reading
 * "SEE — A collectible universe by SUPARFLYY".
 *
 * Layers (back to front):
 *  1. room.webp — wall, floor, sun shaft (procedural, scripts/render-room.py; ~47 KB)
 *  2. the "stage": a box in the mockup's 1284×663 frame holding linework,
 *     disc and type, so they stay registered to the room at every size
 *  3. a dim veil that lifts on arrival — the lights coming up
 *
 * Stage sizing (all CSS, see .hero-stage in globals.css):
 *  - k = how much the room image is scaled to cover the hero.
 *  - s = the stage's scale: equal to k on landscape screens (everything lines
 *    up exactly as in the mockup), smaller on narrow portrait screens so the
 *    disc fits the width. The stage is pinned to the room's horizon either way.
 */
export function HomeHero() {
  return (
    <section aria-labelledby="hero-title" className="hero relative w-full overflow-hidden bg-[#8d8172]">
      <Image
        src="/home/room.webp"
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover"
        quality={82}
      />

      <div className="hero-stage">
        <HeroLinework />

        <div className="hero-disc">
          <Image src="/home/disc.webp" alt="" fill sizes="(max-width: 768px) 70vw, 30vw" className="object-cover" />
          <h1 id="hero-title" className="hero-type">
            <span className="hero-see" aria-label="See">
              SEE
            </span>
            <span className="hero-sub">A Collectible Universe</span>
            <span className="hero-sub hero-sub--by">By Suparflyy</span>
          </h1>
        </div>
      </div>

      <div className="lights-up pointer-events-none absolute inset-0 bg-[#1e1812]" aria-hidden="true" />
    </section>
  );
}
