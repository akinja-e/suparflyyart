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

- Matrix-style digital rain where every character is the traced S mark (`src/lib/brand/sGlyph.ts`), on white.
- Monochrome: every rain glyph is black ink on white (trails fade to soft greys). The bright brand palette is NOT used in the rain — it is reserved for UI and artwork. (The engine still accepts a `palette` prop if colour is ever wanted back.)
- Renderer: `src/lib/rain/SRainEngine.ts` (Canvas 2D, one pre-rendered sprite per colour).
- Pointer interaction: moving the mouse (or a finger) opens a clean white space around it. Glyphs are pushed outward on damped springs (slight natural overshoot), shrink a little as if pressed back, and settle back when the pointer leaves. Must stay seamless — no snapping, no jitter — and run at 60fps. Off for reduced motion.
- Cursor mark: while the pointer moves, a large S (3× a rain glyph, black like the master logo, rendered sharp — not upscaled) follows it at the centre of the clear space — a hard "force field" shield guarantees no rain glyph ever overlaps it (glyphs collide with the shield edge and slide around it) — gliding slightly behind and leaning into fast sideways moves; it is only visible while the pointer moves and disappears after 750ms without movement (or as soon as the pointer leaves).

## Pages & transitions

Flow: `/` intro rain → click → camera dive → `/future` quote (readable 1.5s) → fade to white → `/home` balloon scene.

- `/` — S rain (`src/components/home/HomeExperience.tsx`). A click / tap / Enter anywhere starts the camera dive.
- Exit = camera dive (inspired by the reference site's click: scene → accelerating push-in → cut to white → next room fades in from white). The whole rain layer scales around the click point: a small pull-back (anticipation, to 0.965), then an accelerating push-in to 14× with speed blur and overexposure (`DIVE_MS` 1350). The big cursor S stays at the focal point and melts away as the camera flies through it. From 55% of the dive a pure-white layer (`LightWash.tsx`) rises to solid white — no rings, halos or colour — holds ~160ms, then navigates.
- `/future` — the quote "You must first see your future. Only then can you create it." centred, in Chakra Petch. Opens under white (`.light-lift`, ~1.55s) while the text settles (`.arrive`), stays fully readable for 1.5s (`READ_MS`), then `AutoAdvance` fades to white (750ms) and moves to `/home`.
- `/home` — the balloon scene (see below). Opens under white while the camera settles.
- `/shop`, `/collections`, `/art`, `/story`, `/journal`, `/contact` — "Opening soon" placeholders (`src/app/[section]`) until each is built. Section list lives in `src/lib/site/nav.ts`.
- Reduced motion: no dive, washes, light lifts, draw-ins or settles; navigation is immediate.

## Home (`/home`): the balloon scene

- Artwork: `docs/design/balloon-scene.jpg` — at sunset a man holding a blank canvas watches a red hot-air balloon bearing the S rise over a city skyline. (The earlier concrete-room page was removed at the owner's request; it's in git history.)
- `scripts/cut-balloon.py` splits it into `public/scene/sky.webp` (balloon removed, sky repainted under it) and `public/scene/balloon.webp` (balloon + rigging on transparency), upscaled 2×, and prints the balloon's box → `BALLOON` in `src/components/scene/BalloonScene.tsx`. At rest the two layers recompose the original exactly. Re-run the script if the artwork changes; a higher-resolution source gives a sharper scene (the current one is 960 px wide).
- Motion (`.scene-*` in globals.css): camera settles from 1.07× on arrival; the balloon bobs and sways (`balloon-float`, 7.5s loop); the sun breathes (`sun-glow`); pointer parallax moves the sky 4px and the balloon 8px (`SceneParallax.tsx`, hover devices only). Keep the balloon's travel small — larger moves reveal the repainted sky.
- Tall screens (`@container (max-aspect-ratio: 1/1)`): the camera pans from the man across to the balloon over 7s and rests on the balloon.
- Header (`src/components/site/SiteHeader.tsx`): stone bar `#E0D7CE`, hairline under. Sparkle · SHOP COLLECTIONS ART · **SUPARFLYY** (exactly centred) · STORY JOURNAL CONTACT · search · bag (0). Below `lg` the links fold into a full-screen stone menu opened by the sparkle (Escape closes; focus moves in).

## Typography (updated)

- Site chrome: **Cormorant Garamond** (`font-serif`) for the menu and section titles; **Jost** (`font-ui`, Futura-like) for the bar, wordmark and small uppercase labels.
- **Chakra Petch** (`font-display`) stays for the intro/quote moment, matching the S mark's chamfered geometry.
- All fonts are self-hosted via @fontsource.
