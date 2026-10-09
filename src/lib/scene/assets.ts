/**
 * The home scene's image layers (made by scripts/cut-scene.py). They are already
 * sized and compressed WebP, so they're served as-is (no image optimiser), which
 * also means their URLs are known up front and can be fetched ahead of time —
 * during the intro and the quote — so the scene is ready when it opens.
 */
export const SCENE_IMAGES = {
  sky: "/scene/sky.webp",
  balloon: "/scene/balloon.webp",
  man: "/scene/man.webp",
  canvas: "/scene/canvas.webp",
} as const;

export const SCENE_IMAGE_LIST: string[] = Object.values(SCENE_IMAGES);
