import { S_GLYPH, S_GLYPH_ASPECT } from "@/lib/brand/sGlyph";
import { BRAND_SWATCHES, PALETTE, type Swatch } from "@/lib/brand/palette";

/**
 * SRainEngine — a "digital rain" renderer where every character is the S mark.
 *
 * Each falling stream takes one colour from the brand palette (bright solids,
 * polished gold, clear diamond, and the occasional black), chosen by weight
 * and re-rolled every time the stream restarts at the top.
 *
 * Moving the pointer over the rain opens a clear space around it: nearby
 * glyphs are pushed outward on springs and settle back when it moves on
 * (see "Pointer field" below). A large S follows the pointer while it moves
 * (see "Cursor mark").
 *
 * Framework-agnostic on purpose: React only mounts/unmounts it, so the hot
 * loop never touches React state (no re-renders at 60fps).
 *
 * Why Canvas 2D instead of Three.js: this is thousands of tiny flat glyphs with
 * no depth or lighting. A 2D canvas with one pre-rendered sprite is lighter,
 * starts instantly, and leaves the GPU free for the 3D hero that comes later.
 */

export interface SRainOptions {
  /** Glyph height in CSS px. Defaults to a responsive size based on viewport width. */
  glyphSize?: number;
  /** Colours streams are drawn in. Defaults to the full brand palette. */
  palette?: Swatch[];
  /** Fall speed range in rows per second. */
  speed?: [min: number, max: number];
  /** How fast trails fade, in brightness per second. Lower = longer trails. */
  fade?: [min: number, max: number];
  /** Peak opacity of trail glyphs (the leading glyph is always full ink). */
  trailOpacity?: number;
  /** 0–1 master opacity so the rain can sit quietly behind content. */
  intensity?: number;
  /** Max device pixel ratio — capped for performance on dense phone screens. */
  maxDpr?: number;
  /**
   * Radius of the clear space around the pointer, in CSS px. Defaults to a
   * size based on the viewport. Set to 0 to turn the effect off.
   */
  repelRadius?: number;
  /** Size of the S that follows the pointer, relative to a rain glyph. 0 = off. */
  cursorScale?: number;
  /** Colour of the cursor S. Defaults to black, like the master logo. */
  cursorSwatch?: Swatch;
}

type Defaults = Required<Omit<SRainOptions, "glyphSize" | "repelRadius">>;

const DEFAULTS: Defaults = {
  palette: BRAND_SWATCHES,
  speed: [9, 24],
  fade: [0.45, 1.1],
  // Bright colours turn pastel when faded against white, so trails stay
  // fairly opaque and the fade is carried mostly by the curve below.
  trailOpacity: 0.85,
  intensity: 1,
  maxDpr: 2,
  cursorScale: 3,
  cursorSwatch: PALETTE.black,
};

const MIN_VISIBLE = 0.03;
const FLICKER_CHANCE = 0.004;

// ─── Pointer field tuning ─────────────────────────────────────────────────────
// Glyphs ride on damped springs toward their pushed-out position, so they
// glide aside with a hint of overshoot instead of snapping.
const SPRING_STIFFNESS = 300; // firm, so the field feels like a solid barrier
const SPRING_DAMPING = 2 * 0.78 * Math.sqrt(SPRING_STIFFNESS); // ζ ≈ 0.78, a hint of bounce
const MAX_SUBSTEP = 1 / 120; // keeps the springs stable on slow frames
const POINTER_FOLLOW = 0.05; // s — how closely the field (and cursor S) trail the pointer
const FIELD_IN = 0.08; // s — field opening when the pointer arrives (leads the cursor S)
const FIELD_OUT = 0.5; // s — field closing when the pointer leaves
const DEPTH_SHRINK = 0.1; // pushed glyphs shrink up to 10%, as if pressed back
const WAKE_GAIN = 1 / 1800; // fast movement widens the field a little…
const WAKE_MAX = 0.2; // …up to +20%
const FIELD_REACH = 2.6; // beyond 2.6 × radius the push is negligible
const SHIELD_PADDING = 5; // CSS px of white kept between the cursor S and any glyph
const SHIELD_TO_RADIUS = 1.5; // the soft push always reaches 1.5× past the hard shield

// ─── Cursor mark tuning ───────────────────────────────────────────────────────
const CURSOR_FOLLOW = 0.045; // s — slight glide behind the pointer
const CURSOR_IN = 0.16; // s — fade in on movement (trails the field, so space is ready)
const CURSOR_OUT = 0.12; // s — quick fade once idle / gone (invisible within ~0.35s)
const CURSOR_IDLE = 0.75; // s — without movement before it disappears
const CURSOR_TILT_MAX = (7 * Math.PI) / 180; // leans into fast horizontal moves
const CURSOR_TILT_GAIN = 1 / 2600; // radians of lean per CSS px/s
const BURST_SCALE = 7; // on exit, the cursor S swells to 7× its size as it fades into the light

export class SRainEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly opts: Defaults & Pick<SRainOptions, "glyphSize" | "repelRadius">;
  private readonly glyphPath = new Path2D(S_GLYPH.path);

  // One pre-rendered S per palette swatch.
  private sprites: HTMLCanvasElement[] = [];
  private cumulativeWeights: number[] = [];
  private dpr = 1;
  private cols = 0;
  private rows = 0;
  private cellW = 0; // device px
  private cellH = 0; // device px

  // Per-cell brightness (0–1), row-major.
  private cells = new Float32Array(0);
  // Per-column stream state.
  private head = new Float32Array(0);
  private speed = new Float32Array(0);
  private fade = new Float32Array(0);
  private delay = new Float32Array(0);
  private swatchIndex = new Uint8Array(0);

  // Per-cell spring displacement and velocity (device px), row-major.
  private dispX = new Float32Array(0);
  private dispY = new Float32Array(0);
  private velX = new Float32Array(0);
  private velY = new Float32Array(0);
  private fieldSettled = true;

  // Pointer, in canvas device px.
  private pointerActive = false;
  private pointerX = 0;
  private pointerY = 0;
  private fieldX = 0; // smoothed pointer
  private fieldY = 0;
  private fieldStrength = 0; // 0 = closed, 1 = fully open
  private wake = 0; // extra radius from fast movement

  // Cursor mark (device px).
  private cursorSprite: HTMLCanvasElement | null = null;
  private cursorX = 0;
  private cursorY = 0;
  private cursorAlpha = 0;
  private cursorTilt = 0;
  private lastPointerMove = -Infinity;
  // Exit burst (see burstCursor). burstStart < 0 means no burst.
  private burstStart = -1;
  private burstDuration = 0;
  private burstProgress = 0;
  private burstAlphaFrom = 0;
  private burstScaleFrom = 0;

  private rafId = 0;
  private lastTime = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement, options: SRainOptions = {}) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("SRainEngine: 2D canvas context unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    // Drop undefined keys so callers can pass optional props straight through
    // without clobbering the defaults.
    const defined = Object.fromEntries(
      Object.entries(options).filter(([, value]) => value !== undefined),
    ) as SRainOptions;
    this.opts = { ...DEFAULTS, ...defined };
    if (this.opts.palette.length === 0) this.opts.palette = BRAND_SWATCHES;
    let total = 0;
    this.cumulativeWeights = this.opts.palette.map((swatch) => (total += Math.max(0, swatch.weight)));
    this.resize();
  }

  /** Re-measure the canvas and rebuild the grid. Call on container resize. */
  resize(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, this.opts.maxDpr);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);

    const glyphCss = this.opts.glyphSize ?? clamp(Math.round(width / 80), 13, 22);
    const glyphH = glyphCss * this.dpr;
    const glyphW = glyphH * S_GLYPH_ASPECT;
    this.cellH = Math.round(glyphH * 1.22);
    this.cellW = Math.round(glyphW * 1.3);

    const prevCols = this.cols;
    this.cols = Math.ceil(this.canvas.width / this.cellW);
    this.rows = Math.ceil(this.canvas.height / this.cellH);
    this.cells = new Float32Array(this.cols * this.rows);
    this.dispX = new Float32Array(this.cells.length);
    this.dispY = new Float32Array(this.cells.length);
    this.velX = new Float32Array(this.cells.length);
    this.velY = new Float32Array(this.cells.length);

    if (this.cols !== prevCols) {
      this.head = new Float32Array(this.cols);
      this.speed = new Float32Array(this.cols);
      this.fade = new Float32Array(this.cols);
      this.delay = new Float32Array(this.cols);
      this.swatchIndex = new Uint8Array(this.cols);
      for (let c = 0; c < this.cols; c++) this.respawn(c, true);
    }

    this.sprites = this.opts.palette.map((swatch) => this.buildSprite(swatch, glyphW, glyphH));
    // Rendered at full size rather than scaled up, so the big S stays razor-sharp.
    const cursorScale = this.opts.cursorScale;
    this.cursorSprite =
      cursorScale > 0 ? this.buildSprite(this.opts.cursorSwatch, glyphW * cursorScale, glyphH * cursorScale) : null;
    if (!this.running) this.draw();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  /** Render one settled frame without animating (used for reduced motion). */
  renderStill(): void {
    this.stop();
    for (let i = 0; i < 150; i++) this.step(1 / 30);
    this.draw();
  }

  destroy(): void {
    this.stop();
    this.sprites = [];
    this.cursorSprite = null;
  }

  /**
   * Move the clear space to a point given in viewport (client) coordinates.
   * `moved` marks real movement, which is what shows the cursor S.
   */
  setPointer(clientX: number, clientY: number, moved = true): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = (clientX - rect.left) * this.dpr;
    this.pointerY = (clientY - rect.top) * this.dpr;
    if (!this.pointerActive && this.fieldStrength < 0.05) {
      // Open where the pointer is, rather than sliding in from its last spot.
      this.fieldX = this.pointerX;
      this.fieldY = this.pointerY;
    }
    this.pointerActive = true;
    if (!moved) return;
    if (this.cursorAlpha < 0.02) {
      // Appear under the pointer instead of gliding over from where it vanished.
      this.cursorX = this.pointerX;
      this.cursorY = this.pointerY;
      this.cursorTilt = 0;
    }
    this.lastPointerMove = performance.now();
  }

  /** Let the clear space close and the glyphs settle back. */
  /**
   * Exit animation: the cursor S swells and fades into white over `durationMs`,
   * pushing the rain outward as it grows. If it isn't showing (touch, keyboard),
   * it appears at the given viewport point first. Ignores the pointer from here on.
   */
  burstCursor(durationMs: number, clientX?: number, clientY?: number): void {
    if (!this.cursorSprite || this.burstStart >= 0) return;
    if (this.cursorDrawAlpha() < 0.2 && clientX !== undefined && clientY !== undefined) {
      const rect = this.canvas.getBoundingClientRect();
      this.cursorX = this.fieldX = (clientX - rect.left) * this.dpr;
      this.cursorY = this.fieldY = (clientY - rect.top) * this.dpr;
      this.cursorTilt = 0;
      this.burstAlphaFrom = 1;
      this.burstScaleFrom = 1;
    } else {
      this.burstAlphaFrom = this.cursorDrawAlpha();
      this.burstScaleFrom = this.cursorDrawScale();
    }
    this.burstStart = performance.now();
    this.burstDuration = Math.max(1, durationMs);
    this.burstProgress = 0;
  }

  releasePointer(): void {
    this.pointerActive = false;
  }

  /**
   * Listen for mouse / pen / touch on `target` and drive the field from it.
   * Returns a function that removes the listeners.
   */
  attachPointer(target: Window = window): () => void {
    const move = (e: PointerEvent) => this.setPointer(e.clientX, e.clientY);
    // A mouse click isn't movement; a finger touching down is.
    const down = (e: PointerEvent) => this.setPointer(e.clientX, e.clientY, e.pointerType !== "mouse");
    const lift = (e: PointerEvent) => {
      // A mouse is still "over" the page after a click; a finger is not.
      if (e.pointerType !== "mouse") this.releasePointer();
    };
    const out = (e: PointerEvent) => {
      if (!e.relatedTarget) this.releasePointer(); // left the window
    };
    const release = () => this.releasePointer();

    target.addEventListener("pointermove", move, { passive: true });
    target.addEventListener("pointerdown", down, { passive: true });
    target.addEventListener("pointerup", lift, { passive: true });
    target.addEventListener("pointercancel", release, { passive: true });
    target.addEventListener("pointerout", out, { passive: true });
    target.addEventListener("blur", release);
    return () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerdown", down);
      target.removeEventListener("pointerup", lift);
      target.removeEventListener("pointercancel", release);
      target.removeEventListener("pointerout", out);
      target.removeEventListener("blur", release);
    };
  }

  // ─── internals ──────────────────────────────────────────────────────────────

  private tick = (now: number): void => {
    if (!this.running) return;
    // Clamp dt so a backgrounded tab doesn't produce one giant jump.
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.step(dt);
    this.stepField(dt);
    this.stepCursor(dt, now);
    this.draw();
    this.rafId = requestAnimationFrame(this.tick);
  };

  private step(dt: number): void {
    const { cols, rows, cells } = this;

    for (let c = 0; c < cols; c++) {
      // Fade this column's trail.
      const decay = this.fade[c] * dt;
      for (let r = 0; r < rows; r++) {
        const i = r * cols + c;
        if (cells[i] > 0) cells[i] = Math.max(0, cells[i] - decay);
      }

      if (this.delay[c] > 0) {
        this.delay[c] -= dt;
        continue;
      }

      // Advance the head one whole row at a time — the stepped, typewriter
      // cadence is what makes it read as "digital rain" rather than a smooth slide.
      const from = Math.floor(this.head[c]);
      this.head[c] += this.speed[c] * dt;
      const to = Math.floor(this.head[c]);
      for (let r = from + 1; r <= to; r++) {
        if (r >= 0 && r < rows) cells[r * cols + c] = 1;
      }

      // Once the whole trail has faded past the bottom, start a new stream.
      const trailRows = this.speed[c] / this.fade[c];
      if (this.head[c] - rows > trailRows) this.respawn(c, false);
    }
  }

  // ─── Pointer field ──────────────────────────────────────────────────────────
  //
  // Each glyph's resting spot is pushed straight away from the (smoothed)
  // pointer by  push = R · e^-(d/R)²,  where d is its distance and R the radius.
  // A glyph right under the pointer moves out to R, one at 2R barely moves, and
  // the distance mapping d → d + push never folds over itself — so glyphs bunch
  // softly around the rim and leave a clean white space inside.

  private stepField(dt: number): void {
    const baseRadius = this.repelRadiusPx();
    if (baseRadius <= 0) return;

    // Ease the field open/closed and let it trail the cursor slightly.
    const target = this.pointerActive ? 1 : 0;
    const ease = target > this.fieldStrength ? FIELD_IN : FIELD_OUT;
    this.fieldStrength += (target - this.fieldStrength) * (1 - Math.exp(-dt / ease));

    // Hold still while the cursor S bursts, so the shield stays centred on it.
    const follow = this.burstStart >= 0 ? 0 : 1 - Math.exp(-dt / POINTER_FOLLOW);
    const moveX = (this.pointerX - this.fieldX) * follow;
    const moveY = (this.pointerY - this.fieldY) * follow;
    this.fieldX += moveX;
    this.fieldY += moveY;

    // Fast flicks widen the field a touch, like a wake.
    const speedCss = Math.hypot(moveX, moveY) / Math.max(dt, 1e-3) / this.dpr;
    const wakeTarget = Math.min(speedCss * WAKE_GAIN, WAKE_MAX);
    this.wake += (wakeTarget - this.wake) * (1 - Math.exp(-dt / 0.25));

    const fieldOn = this.fieldStrength > 0.002;
    if (!fieldOn && this.fieldSettled) return;

    const strength = fieldOn ? this.fieldStrength : 0;
    // Hard shield: no glyph may come closer than this to the field centre, so
    // the cursor S never overlaps the rain. It grows with the field.
    // Always at least as big as the cursor S currently drawn (which grows with
    // the field), plus a glyph's half-width and padding — so they never touch.
    const shield = Math.max(this.shieldRadiusPx() * strength, this.cursorClearancePx());
    const radius = Math.max(baseRadius, this.shieldRadiusPx() * SHIELD_TO_RADIUS) * (1 + this.wake);
    const reach = radius * FIELD_REACH;
    const { cols, rows, cellW, cellH, dispX, dispY, velX, velY } = this;

    const substeps = Math.ceil(dt / MAX_SUBSTEP);
    const h = dt / substeps;
    let maxMotion = 0;

    for (let r = 0; r < rows; r++) {
      const dy = (r + 0.5) * cellH - this.fieldY;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        let tx = 0;
        let ty = 0;

        if (strength > 0) {
          const dx = (c + 0.5) * cellW - this.fieldX;
          if (Math.abs(dx) < reach && Math.abs(dy) < reach) {
            const d = Math.hypot(dx, dy);
            const push = strength * radius * Math.exp(-(d * d) / (radius * radius));
            // Directly under the pointer there is no direction — push upward.
            const nx = d > 1e-3 ? dx / d : 0;
            const ny = d > 1e-3 ? dy / d : -1;
            tx = nx * push;
            ty = ny * push;
          }
        }

        // Skip cells that are at rest with nowhere to go.
        if (tx === 0 && ty === 0 && dispX[i] === 0 && dispY[i] === 0 && velX[i] === 0 && velY[i] === 0) {
          continue;
        }

        let x = dispX[i];
        let y = dispY[i];
        let vx = velX[i];
        let vy = velY[i];
        for (let s = 0; s < substeps; s++) {
          vx += ((tx - x) * SPRING_STIFFNESS - vx * SPRING_DAMPING) * h;
          vy += ((ty - y) * SPRING_STIFFNESS - vy * SPRING_DAMPING) * h;
          x += vx * h;
          y += vy * h;
        }

        // Collide with the shield: a glyph the springs haven't moved out yet
        // (the pointer moved faster than they could) is placed on the shield's
        // edge and loses its inward speed — like hitting a solid bubble.
        if (shield > 0) {
          const gx = (c + 0.5) * cellW + x - this.fieldX;
          const gy = (r + 0.5) * cellH + y - this.fieldY;
          const g = Math.hypot(gx, gy);
          if (g < shield) {
            const nx = g > 1e-3 ? gx / g : 0;
            const ny = g > 1e-3 ? gy / g : -1;
            x += nx * (shield - g);
            y += ny * (shield - g);
            const inward = vx * nx + vy * ny;
            if (inward < 0) {
              vx -= inward * nx;
              vy -= inward * ny;
            }
          }
        }

        // Snap tiny residual motion to rest so idle frames cost nothing.
        if (tx === 0 && ty === 0 && Math.abs(x) + Math.abs(y) < 0.05 && Math.abs(vx) + Math.abs(vy) < 0.5) {
          x = y = vx = vy = 0;
        }
        dispX[i] = x;
        dispY[i] = y;
        velX[i] = vx;
        velY[i] = vy;
        maxMotion = Math.max(maxMotion, Math.abs(x) + Math.abs(y));
      }
    }
    this.fieldSettled = !fieldOn && maxMotion === 0;
  }

  // ─── Cursor mark ────────────────────────────────────────────────────────────
  //
  // A large S that rides on the pointer while it moves, at the centre of the
  // force field (whose hard shield keeps every rain glyph off it). It glides a
  // few milliseconds behind, leans slightly into fast sideways movement, and fades
  // out once the pointer has rested for 750ms or leaves — so it reads as part of the scene,
  // not a sticker pinned to the mouse.

  private stepCursor(dt: number, now: number): void {
    if (!this.cursorSprite) return;

    if (this.burstStart >= 0) {
      // Exiting: position and tilt are frozen; only the burst progresses.
      this.burstProgress = clamp((now - this.burstStart) / this.burstDuration, 0, 1);
      return;
    }

    const moving = this.pointerActive && (now - this.lastPointerMove) / 1000 < CURSOR_IDLE;
    const target = moving ? 1 : 0;
    const ease = target > this.cursorAlpha ? CURSOR_IN : CURSOR_OUT;
    this.cursorAlpha += (target - this.cursorAlpha) * (1 - Math.exp(-dt / ease));
    if (this.cursorAlpha < 0.002 && target === 0) {
      this.cursorAlpha = 0;
      return;
    }

    // Ride exactly at the centre of the force field so the shield always
    // surrounds it; fall back to its own glide if the field is turned off.
    let moveX: number;
    if (this.repelRadiusPx() > 0) {
      moveX = this.fieldX - this.cursorX;
      this.cursorX = this.fieldX;
      this.cursorY = this.fieldY;
    } else {
      const follow = 1 - Math.exp(-dt / CURSOR_FOLLOW);
      moveX = (this.pointerX - this.cursorX) * follow;
      this.cursorX += moveX;
      this.cursorY += (this.pointerY - this.cursorY) * follow;
    }

    const speedX = moveX / Math.max(dt, 1e-3) / this.dpr; // CSS px/s
    const tiltTarget = clamp(speedX * CURSOR_TILT_GAIN, -1, 1) * CURSOR_TILT_MAX;
    this.cursorTilt += (tiltTarget - this.cursorTilt) * (1 - Math.exp(-dt / 0.15));
  }

  private drawCursor(): void {
    const sprite = this.cursorSprite;
    if (!sprite) return;
    const alpha = this.cursorDrawAlpha();
    const scale = this.cursorDrawScale();
    if (alpha <= 0.001 || scale <= 0.001) return;
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = alpha * this.opts.intensity;
    ctx.translate(this.cursorX, this.cursorY);
    ctx.rotate(this.cursorTilt);
    ctx.scale(scale, scale);
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    ctx.restore();
  }

  /** 0–1: how much of the cursor S is shown (limited by how open the field is). */
  private cursorReveal(): number {
    return Math.min(this.cursorAlpha, this.fieldStrength);
  }

  /**
   * Drawn size of the cursor S (1 = 3× a rain glyph). Normally it grows out of
   * the pointer with the force field, so it's never larger than the space
   * cleared for it; during the exit burst it swells to BURST_SCALE.
   */
  private cursorDrawScale(): number {
    if (this.burstStart < 0) return this.cursorReveal();
    const grow = 1 - Math.pow(1 - this.burstProgress, 3); // ease-out: fast swell, soft finish
    return this.burstScaleFrom * (1 + (BURST_SCALE - 1) * grow);
  }

  private cursorDrawAlpha(): number {
    if (this.burstStart < 0) return this.cursorAlpha;
    return this.burstAlphaFrom * Math.pow(1 - this.burstProgress, 1.6); // lingers, then melts away
  }

  /** Clearance the cursor S needs right now: its drawn half-diagonal + a glyph + padding. */
  private cursorClearancePx(): number {
    const big = this.cursorSprite;
    const small = this.sprites[0];
    if (!big || !small) return 0;
    const rim = Math.max(small.width, small.height) / 2 + SHIELD_PADDING * this.dpr;
    if (this.burstStart >= 0) {
      // The swelling S shoves the rain outward while it's still solid enough to see.
      const presence = Math.min(1, this.cursorDrawAlpha() * 3);
      return ((Math.hypot(big.width, big.height) / 2) * this.cursorDrawScale() + rim) * presence;
    }
    const reveal = this.cursorReveal();
    if (reveal <= 0) return 0;
    return (Math.hypot(big.width, big.height) / 2) * reveal + rim * Math.min(1, reveal * 8);
  }

  /**
   * Radius of the hard shield (device px): half the cursor S's diagonal, plus
   * half a rain glyph, plus padding — so even its corners never touch a glyph.
   */
  private shieldRadiusPx(): number {
    const big = this.cursorSprite;
    const small = this.sprites[0];
    if (!big || !small) return 0;
    return (
      Math.hypot(big.width, big.height) / 2 + Math.max(small.width, small.height) / 2 + SHIELD_PADDING * this.dpr
    );
  }

  private repelRadiusPx(): number {
    if (this.opts.repelRadius !== undefined) return this.opts.repelRadius * this.dpr;
    const minSide = Math.min(this.canvas.width, this.canvas.height) / this.dpr;
    return clamp(minSide * 0.085, 48, 95) * this.dpr;
  }

  private respawn(c: number, initial: boolean): void {
    const [sMin, sMax] = this.opts.speed;
    const [fMin, fMax] = this.opts.fade;
    this.speed[c] = rand(sMin, sMax);
    this.fade[c] = rand(fMin, fMax);
    // On first load, stagger streams above the viewport so the rain "arrives".
    this.head[c] = initial ? -rand(0, this.rows * 1.2) : -rand(0, this.rows * 0.25);
    this.delay[c] = initial ? rand(0, 0.6) : rand(0, 2.5);
    this.swatchIndex[c] = this.pickSwatch();
  }

  private draw(): void {
    const { ctx, sprites, cols, rows, cells, cellW, cellH, dispX, dispY } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (sprites.length === 0) return;

    const { trailOpacity, intensity } = this.opts;
    // Every sprite shares the same size, so one offset centres them all.
    const offsetX = Math.round((cellW - sprites[0].width) / 2);
    const offsetY = Math.round((cellH - sprites[0].height) / 2);
    const spriteW = sprites[0].width;
    const spriteH = sprites[0].height;
    const radius = this.repelRadiusPx() * (1 + this.wake);

    for (let r = 0; r < rows; r++) {
      const y = r * cellH + offsetY;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const b = cells[i];
        if (b < MIN_VISIBLE) continue;

        const isHead = r === Math.floor(this.head[c]) && this.delay[c] <= 0;
        let alpha = isHead ? 1 : trailOpacity * Math.pow(b, 1.15);
        if (!isHead && Math.random() < FLICKER_CHANCE) alpha *= 0.35;

        ctx.globalAlpha = alpha * intensity;
        const sprite = sprites[this.swatchIndex[c]];
        const x = c * cellW + offsetX;
        const ox = dispX[i];
        const oy = dispY[i];

        if (ox === 0 && oy === 0) {
          ctx.drawImage(sprite, x, y);
          continue;
        }

        // Pushed glyphs shrink slightly, as if pressed back into the page.
        const pushed = Math.min(Math.hypot(ox, oy) / radius, 1);
        const scale = 1 - DEPTH_SHRINK * pushed;
        const w = spriteW * scale;
        const hgt = spriteH * scale;
        ctx.drawImage(sprite, x + ox + (spriteW - w) / 2, y + oy + (spriteH - hgt) / 2, w, hgt);
      }
    }
    ctx.globalAlpha = 1;
    this.drawCursor();
  }

  /** Weighted random pick, so rare swatches (black) appear less often. */
  private pickSwatch(): number {
    const weights = this.cumulativeWeights;
    const roll = Math.random() * weights[weights.length - 1];
    const index = weights.findIndex((w) => roll < w);
    return index === -1 ? 0 : index;
  }

  /**
   * Pre-render the S once per swatch at device resolution; every frame just
   * stamps these images, so gradients cost nothing after start-up.
   */
  private buildSprite(swatch: Swatch, glyphW: number, glyphH: number): HTMLCanvasElement {
    const sprite = document.createElement("canvas");
    sprite.width = Math.ceil(glyphW);
    sprite.height = Math.ceil(glyphH);
    const sctx = sprite.getContext("2d");
    if (!sctx) throw new Error("SRainEngine: sprite context unavailable");

    const scale = glyphW / S_GLYPH.width;
    sctx.scale(scale, glyphH / S_GLYPH.height);

    if (swatch.kind === "solid") {
      sctx.fillStyle = swatch.color;
      sctx.fill(this.glyphPath);
      return sprite;
    }

    // Metal and crystal: a diagonal gradient across the mark, like a light
    // sweeping over a physical object.
    const gradient = sctx.createLinearGradient(0, 0, S_GLYPH.width, S_GLYPH.height);
    swatch.stops.forEach((stop, i) => gradient.addColorStop(i / (swatch.stops.length - 1), stop));
    sctx.fillStyle = gradient;
    sctx.fill(this.glyphPath);

    if (swatch.kind === "crystal") {
      // A near-clear fill vanishes on white, so the cut-glass outline carries
      // the diamond: a fine edge that shifts through spectral "fire" colours.
      const fire = sctx.createLinearGradient(S_GLYPH.width, 0, 0, S_GLYPH.height);
      swatch.edge.forEach((stop, i) => fire.addColorStop(i / (swatch.edge.length - 1), stop));
      sctx.lineJoin = "miter";
      sctx.lineWidth = (1.1 * this.dpr) / scale;
      sctx.strokeStyle = fire;
      sctx.stroke(this.glyphPath);
    }
    return sprite;
  }
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
