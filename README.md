# SUPARFLYYART

Premium 3D art & collectibles storefront. Phase 1: stack, architecture, S-mark digital rain.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

Requires Node 20.9+.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | Static pages + server components keep JS small; routing and image optimisation built in |
| Language | TypeScript | Safe product/variant data shapes for a future Shopify adapter |
| Styling | Tailwind CSS 4 | Design tokens live in `globals.css` via `@theme` |
| 3D | three, @react-three/fiber, @react-three/drei | Hero sculpture + product viewer only, loaded on demand |
| Timeline animation | GSAP + @gsap/react | Scroll-scrubbed camera and lighting moves |
| UI animation | motion (Framer Motion) | Drawers, panels, page transitions |
| Smooth scroll | Lenis | Native scroll smoothed; disabled for reduced motion |
| State | Zustand | UI chrome (menu, cart drawer, panels) without providers |
| Fonts | Chakra Petch (display) + Geist (body), both self-hosted | Chakra Petch's chamfered corners match the S mark; no font CDN dependency |

The S-rain uses plain Canvas 2D, not Three.js: thousands of flat glyphs need no lighting or depth, so 2D is lighter and keeps the GPU free for the 3D hero.

## Structure

```
src/
  app/                       routes (/ and /future), layout, global tokens
  components/
    background/SRain.tsx     React wrapper (pause off-screen, reduced motion)
    home/HomeExperience.tsx  homepage: rain + click-to-enter
    transition/LightWash.tsx fade-to-white exit transition
    providers/SmoothScroll   Lenis
  lib/
    brand/sGlyph.ts          vector S mark (traced from master artwork)
    brand/palette.ts         brand colours (solid, gold metal, diamond crystal)
    rain/SRainEngine.ts      framework-agnostic rain renderer
    commerce/types.ts        Product / Variant / Money types (backend-agnostic)
    hooks/                   shared hooks
  store/ui.ts                Zustand UI store
public/s-mark.svg            the S mark as SVG
assets/logo.png              master logo artwork (trace source)
scripts/trace-logo.py        PNG → SVG/TS tracer
```

## Updating the logo

The S mark is traced from `assets/logo.png` (dark mark on a light background) by a Python script. To swap in a new logo, replace that file and run from the project root:

```bash
pip install opencv-python numpy
python scripts/trace-logo.py assets/logo.png
```

This rewrites `public/s-mark.svg` and `src/lib/brand/sGlyph.ts`, and the rain picks up the new mark automatically. Add `--dry-run` to preview without writing, or `--tolerance 1.5` for a tighter fit on curved logos.

## SRain options

`<SRain glyphSize={18} intensity={0.6} speed={[9, 24]} fade={[0.45, 1.1]} trailOpacity={0.85} repelRadius={76} />`

`cursorScale` sets the size of the S that follows the mouse (default `3` = 3× a rain glyph; `0` turns it off) and `cursorSwatch` its colour (default black, e.g. `cursorSwatch={PALETTE.gold}`).

`repelRadius` is the size (CSS px) of the clear space that opens around the mouse or finger; `0` turns it off. Spring feel is tuned by the constants at the top of `SRainEngine.ts` (`SPRING_STIFFNESS`, `POINTER_FOLLOW`, `FIELD_IN`, `FIELD_OUT`, `DEPTH_SHRINK`).

Each stream is drawn in one colour from the brand palette (`src/lib/brand/palette.ts`), re-picked every time it restarts. Pass `palette={[PALETTE.gold, PALETTE.diamond]}` to limit the colours, or change a swatch's `weight` to make it more or less common.

`intensity` will be used to quiet the rain behind content in later phases.
