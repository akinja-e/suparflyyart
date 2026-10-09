@AGENTS.md

# SUPARFLYYART — project context

Premium 3D e-commerce site for art pieces and toys. Feels like a digital art
gallery, not a store template. Built in phases (see README).

## Brand colours

Background is **white**. Colour comes from a bright, saturated palette:

| Name | Value | Kind |
|---|---|---|
| neon | `#FF1FCE` | solid |
| yellow | `#FFD60A` | solid |
| lemon | `#E4F01A` | solid |
| red | `#FF2A2A` | solid |
| blue | `#1F6BFF` | solid |
| light green | `#2EE87A` | solid |
| bright purple | `#9D2BFF` | solid |
| gold | `#8A6410 → #F7DC7A → #C9971E` | metallic gradient |
| diamond | near-clear ice/lilac/pink fill + iridescent edge (`#5FC4FF → #A98BFF → #FF86CF → #6FE6F2`) | transparent crystal |
| minimal black | `#0A0A0A` | solid, used sparingly as an accent |

## Typography (intro)

- Display face: **Chakra Petch** (self-hosted via `@fontsource/chakra-petch`, weights 300/400; Tailwind `font-display`). Chosen because its monoline strokes and 45° chamfered corners match the S mark. Use it for headlines, quotes and small uppercase labels.
- Supporting face: Geist Sans (`font-sans`) for body copy and UI.

Rules:
- The owner has commented out every swatch except black in `src/lib/brand/palette.ts` — keep it that way unless asked; the table above documents the palette for later UI use.
- Source of truth is `src/lib/brand/palette.ts`; CSS tokens in `src/app/globals.css` mirror it (Tailwind: `bg-neon`, `text-gold`, …). Change both together.
- Colours stay bright and clean — no muddy or pastel-washed versions (keep faded elements fairly opaque on white), no heavy gradients outside gold/diamond.
- Gold must read as polished metal (lit gradient), never flat yellow-brown.
- Diamond must read as clear, faceted glass on white — mostly transparent, with a fine iridescent "fire" edge; never plain grey.
- Black is an accent, not the base colour.
- Text and essential UI keep readable contrast on white: use black (or blue/red/purple) for body text; yellow, lemon, light green and diamond are for decoration, not small text.

## S-rain background

- Matrix-style digital rain where every character is the traced S mark (`src/lib/brand/sGlyph.ts`), on a warm cream background `#FFEACC` (`--sunset`, Tailwind `bg-sunset` — the cloud tone picked from the home scene (#FED18A), brightened at the owner's request).
- Colours: the rain uses the balloon scene's own colours (owner's request, replacing black) — `SCENE_RAIN_PALETTE` in `src/lib/scene/palette.ts`, sampled from the artwork and deepened to read on cream: sky blue `#4A7BC2`, sunset orange `#E2662A`, balloon red `#C8141C`, dusk mauve `#93506F`, amber `#D08A1C`, denim navy `#2D3870`. Each stream takes one colour. `trailOpacity` 0.8 so trails stay rich, not pastel. The big cursor S is balloon red (the S the balloon carries).
- Renderer: `src/lib/rain/SRainEngine.ts` (Canvas 2D, one pre-rendered sprite per colour).
- Pointer interaction: moving the mouse (or a finger) opens a clear space around it. Glyphs are pushed outward on damped springs (slight natural overshoot), shrink a little as if pressed back, and settle back when the pointer leaves. Must stay seamless — no snapping, no jitter — and run at 60fps. Off for reduced motion.
- Cursor mark: while the pointer moves, a large S (3× a rain glyph, balloon red, rendered sharp — not upscaled) follows it at the centre of the clear space — a hard "force field" shield guarantees no rain glyph ever overlaps it (glyphs collide with the shield edge and slide around it) — gliding slightly behind and leaning into fast sideways moves; it is only visible while the pointer moves and disappears after 750ms without movement (or as soon as the pointer leaves).

## Pages & transitions

Flow: `/` intro rain → click → camera dive → `/future` quote (readable 750ms) → fade into warm light → `/home` balloon scene.

Seamless rule: every hand-off passes through the same warm light `--sunset` (`#FFEACC`) — never white — so intro, quote and scene read as one continuous move (owner's goal: a natural transition into the 3D page). `LightWash` / `AutoAdvance` take a `tone` class for this.

- `/` — S rain (`src/components/home/HomeExperience.tsx`). A click / tap / Enter anywhere starts the camera dive.
- Exit = camera dive (inspired by the reference site's click: scene → accelerating push-in → cut to white → next room fades in from white). The whole rain layer scales around the click point: a small pull-back (anticipation, to 0.965), then an accelerating push-in to 14× with speed blur and overexposure (`DIVE_MS` 1350). The big cursor S stays at the focal point and melts away as the camera flies through it. From 55% of the dive a layer of the warm light (`LightWash.tsx`, `tone="bg-sunset"`) rises to solid — no rings or halos — holds ~160ms, then navigates.
- `/future` — the quote "You must first see your future. Only then can you create it." centred, in Chakra Petch, on `bg-sunset`. Opens under the warm light (`.light-lift-quick`, ~0.75s, `ARRIVE_MS`) while the text settles (`.arrive`), stays fully readable for 750ms (`READ_MS`), then `AutoAdvance` fades back into the warm light (600ms, `LEAVE_MS`) and moves to `/home`.
- `/home` — the balloon scene (see below). Opens under the warm light, which `SceneReveal.tsx` holds until every scene image has loaded and decoded (max 2.5s), then lifts over 1.4s; the camera settle is paused until then (`.scene[data-ready]`). This fixed a flicker where layers popped in mid-fade.
- Dev only: `WarmRoutes.tsx` requests `/future` and `/home` early (from the intro and the quote) so the dev server builds them before they're needed — otherwise the first build caused a long pause and sometimes a reload that replayed the quote. Production prebuilds and prefetches, so it does nothing there.
- Scene images are preloaded during the intro and the quote (`PreloadImages.tsx`, URLs in `src/lib/scene/assets.ts`). They're served `unoptimized` (already-compressed WebP from cut-scene.py) so their URLs are known ahead of time.
- `/shop`, `/collections`, `/art`, `/story`, `/journal`, `/contact` — "Opening soon" placeholders (`src/app/[section]`) until each is built. Section list lives in `src/lib/site/nav.ts`.
- Reduced motion: no dive, washes, light lifts, draw-ins or settles; navigation is immediate.

## Home (`/home`): the balloon scene

- Artwork: `docs/design/balloon-scene.png` — at sunset a man holding a blank canvas watches a red hot-air balloon bearing the S rise over a city skyline. (The earlier concrete-room page was removed at the owner's request; it's in git history.)
- `scripts/cut-scene.py` splits it into layers, upscaled to 2560 px wide, and prints each layer's box → `BALLOON` / `MAN` / `CANVAS` in `src/components/scene/BalloonScene.tsx`: `public/scene/sky.webp` (balloon, man and canvas removed, background repainted), `balloon.webp`, `man.webp`, `canvas.webp` (all on transparency). The man and canvas are cut with rembg (u2net for the body, isnet-general-use for the canvas). At rest the layers recompose the original. Re-run the script if the artwork changes; a higher-resolution source gives a sharper scene (the current one is 1672 px wide).
- Depth (2.5D, no WebGL): `SceneCamera.tsx` drifts the camera on its own (17s / 11.5s loops, so phones get depth too) and leans toward the mouse; it writes `--cx` / `--cy` (−1…1) and the CSS moves each plane by its own fraction of the stage width: far sky/skyline 0.3%, balloon 0.55%, plaza shears from 0.3% at the horizon (78.5% down) to 1.6% at the bottom edge (`skewX`), the man 1.4% — exactly the plaza's offset at his feet (96.7% down) so he never slides. The stage is 4% larger than cover so no plane shows an edge.
- Motion (`.scene-*`, `.man-*`, `.canvas-*` in globals.css): camera settles from 1.07× on arrival; the man shifts his weight (`man-sway`, ±0.35°, 9s) and breathes (`man-breathe`, 4.6s), both pivoting at his feet on one layer; the canvas rocks in his grip (`canvas-rock`, 6.4s) and a band of sunset light sweeps across it every 8s (`canvas-sheen`, the blank canvas = the future); a contact shadow keeps his shoes on the ground; the balloon bobs and sways (`balloon-float`, 7.5s); the sun breathes (`sun-glow`). Keep travel small — larger moves reveal the repainted background. Avoid blend modes on large animated layers (they cost frame rate).
- Tall screens (`@container (max-aspect-ratio: 1/1)`): the camera pans from the man across to the balloon over 7s and rests on the balloon.
- `/home` is full screen with **no header** (owner's request). The header component (`src/components/site/SiteHeader.tsx`) is kept for other pages: stone bar `#E0D7CE`, hairline under. Sparkle · SHOP COLLECTIONS ART · **SUPARFLYY** (exactly centred) · STORY JOURNAL CONTACT · search · bag (0). Below `lg` the links fold into a full-screen stone menu opened by the sparkle (Escape closes; focus moves in).

## Typography (updated)

- Site chrome: **Cormorant Garamond** (`font-serif`) for the menu and section titles; **Jost** (`font-ui`, Futura-like) for the bar, wordmark and small uppercase labels.
- **Chakra Petch** (`font-display`) stays for the intro/quote moment, matching the S mark's chamfered geometry.
- All fonts are self-hosted via @fontsource.
