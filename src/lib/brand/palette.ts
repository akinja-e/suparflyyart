/**
 * SUPARFLYYART colour palette — bright, saturated colours on white paper.
 *
 * Single source of truth: the S-rain reads this directly, and the same hex
 * values are mirrored as CSS tokens in `src/app/globals.css` for the UI.
 *
 * Three kinds of swatch:
 *   solid    — a flat bright colour
 *   metal    — a lit gradient that reads as polished metal (gold)
 *   crystal  — a clear fill with a fine iridescent "fire" edge (diamond)
 *
 * `weight` controls how often a colour is picked relative to the others.
 * Black is deliberately rare ("minimal black") — an accent, not the base.
 */

export type Swatch =
  | { name: string; kind: "solid"; color: string; weight: number }
  | { name: string; kind: "metal"; stops: string[]; weight: number }
  | { name: string; kind: "crystal"; stops: string[]; edge: string[]; weight: number };

export const PALETTE = {
  // neon: { name: "neon", kind: "solid", color: "#FF1FCE", weight: 1 },
  // yellow: { name: "yellow", kind: "solid", color: "#FFD60A", weight: 1 },
  // lemon: { name: "lemon", kind: "solid", color: "#E4F01A", weight: 1 },
  // red: { name: "red", kind: "solid", color: "#FF2A2A", weight: 1 },
  // blue: { name: "blue", kind: "solid", color: "#1F6BFF", weight: 1 },
  // lightGreen: { name: "light green", kind: "solid", color: "#2EE87A", weight: 1 },
  // purple: { name: "bright purple", kind: "solid", color: "#9D2BFF", weight: 1 },
  // gold: {
  //   name: "gold",
  //   kind: "metal",
  //   // dark bronze → bright highlight → warm gold, like light raking across metal
  //   stops: ["#8A6410", "#F7DC7A", "#C9971E", "#FFF1B8", "#A97A12"],
  //   weight: 1,
  // },
  // diamond: {
  //   name: "diamond",
  //   kind: "crystal",
  //   // near-clear fill with faint ice-blue / lilac / pink fire
  //   stops: ["#E6F8FF", "#FFFFFF", "#F1E4FF", "#FFFFFF", "#DFF4FF", "#FFE9F6"],
  //   // spectral fire along the cut edge: ice blue → violet → pink → aqua
  //   edge: ["#5FC4FF", "#A98BFF", "#FF86CF", "#6FE6F2", "#8FA6BC"],
  //   weight: 1,
  // },
  black: { name: "minimal black", kind: "solid", color: "#0A0A0A", weight: 0.35 },
} as const satisfies Record<string, Swatch>;

export type PaletteKey = keyof typeof PALETTE;

/** The full palette as a list, in display order. */
export const BRAND_SWATCHES: Swatch[] = Object.values(PALETTE);
