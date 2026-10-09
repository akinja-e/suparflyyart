import type { Swatch } from "@/lib/brand/palette";

/**
 * Colours of the balloon scene, sampled from docs/design/balloon-scene.png and
 * deepened a little so they stay readable on the warm cream intro background
 * (#FFEACC). The intro rain uses these instead of black, so the first page
 * already carries the colours of the scene it leads into.
 */
export const SCENE_RAIN_PALETTE: Swatch[] = [
  { name: "sky blue", kind: "solid", color: "#4A7BC2", weight: 1 },
  { name: "sunset orange", kind: "solid", color: "#E2662A", weight: 1 },
  { name: "balloon red", kind: "solid", color: "#C8141C", weight: 0.85 },
  { name: "dusk mauve", kind: "solid", color: "#93506F", weight: 0.75 },
  { name: "amber", kind: "solid", color: "#D08A1C", weight: 0.75 },
  { name: "denim navy", kind: "solid", color: "#2D3870", weight: 0.55 },
];

/** The big S that follows the pointer: balloon red, the S the balloon carries. */
export const SCENE_CURSOR_SWATCH: Swatch = { name: "balloon red", kind: "solid", color: "#C8141C", weight: 1 };
