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

## Typography

- Display face: **Chakra Petch** (self-hosted via `@fontsource/chakra-petch`, weights 300/400; Tailwind `font-display`). Chosen because its monoline strokes and 45° chamfered corners match the S mark. Use it for headlines, quotes and small uppercase labels.
- Supporting face: Geist Sans (`font-sans`) for body copy and UI.

Rules:
- Source of truth is `src/lib/brand/palette.ts`; CSS tokens in `src/app/globals.css` mirror it (Tailwind: `bg-neon`, `text-gold`, …). Change both together.
- Colours stay bright and clean — no muddy or pastel-washed versions (keep faded elements fairly opaque on white), no heavy gradients outside gold/diamond.
- Gold must read as polished metal (lit gradient), never flat yellow-brown.
- Diamond must read as clear, faceted glass on white — mostly transparent, with a fine iridescent "fire" edge; never plain grey.
- Black is an accent, not the base colour.
- Text and essential UI keep readable contrast on white: use black (or blue/red/purple) for body text; yellow, lemon, light green and diamond are for decoration, not small text.

## S-rain background

- Matrix-style digital rain where every character is the traced S mark (`src/lib/brand/sGlyph.ts`), on white.
- Each stream takes one palette colour, weighted (black rarer), re-picked when it restarts.
- Renderer: `src/lib/rain/SRainEngine.ts` (Canvas 2D, one pre-rendered sprite per colour).
- Pointer interaction: moving the mouse (or a finger) opens a clean white space around it. Glyphs are pushed outward on damped springs (slight natural overshoot), shrink a little as if pressed back, and settle back when the pointer leaves. Must stay seamless — no snapping, no jitter — and run at 60fps. Off for reduced motion.
- Cursor mark: while the pointer moves, a large S (3× a rain glyph, black like the master logo, rendered sharp — not upscaled) follows it at the centre of the clear space — a hard "force field" shield guarantees no rain glyph ever overlaps it (glyphs collide with the shield edge and slide around it) — gliding slightly behind and leaning into fast sideways moves; it is only visible while the pointer moves and disappears after 750ms without movement (or as soon as the pointer leaves).

## Pages & transitions

- `/` — S rain (`src/components/home/HomeExperience.tsx`). A click / tap / Enter anywhere starts the light wash.
- Exit (`HomeExperience.tsx` + `LightWash.tsx`): on click the big cursor S swells to 7× and melts into the light (pushing the rain outward as it grows), the rain burns out, and the screen fades to pure white — no rings, halos or colour. Once white it holds ~160ms, then navigates.
- `/future` — the quote "You must first see your future. Only then can you create it." centred, one sentence per line on desktop, in Chakra Petch. The page opens under the same white light, which fades **out** (`.light-lift` in globals.css, ~1.6s) to reveal the text — the text itself does not animate. Quiet "Return" link at the bottom.
- Reduced motion: no burst, wash or light lift; navigation is immediate.
