/**
 * The drafting linework on the wall behind the disc — an orbit, crosshairs,
 * measure lines with end dots and square markers, dotted guides — in the
 * 1284 × 663 coordinate frame of the mockup's hero (disc centre 640,260;
 * wall/floor seam at y = 515).
 *
 * Every stroke uses pathLength=1 so the arrival animation can "draw" it in
 * with a single dash offset, staggered via --i.
 */

const SEAM = 515;
const CX = 640;
const CY = 260;

type Seg = [x1: number, y1: number, x2: number, y2: number];

/** Solid hairlines. */
const LINES: Seg[] = [
  // Crosshair through the disc: full-height vertical, full-width horizontal.
  [CX, 0, CX, SEAM],
  [0, 253, 1284, 253],
  // Long faint rules across the wall.
  [0, 125, 1284, 125],
  [300, 367, 1284, 367],
  [280, 425, 460, 425],
  [820, 425, 1000, 425],
  [485, 460, 795, 460],
  [290, 95, 460, 95],
  [820, 95, 1000, 95],
  // Measure lines left and right, ending in square markers.
  [20, 63, 220, 63],
  [20, 343, 220, 343],
  [1062, 343, 1284, 343],
  [1020, 63, 1180, 63],
  // Verticals ending in dots.
  [280, 15, 280, 95],
  [463, 35, 463, 180],
  [463, 330, 463, 470],
  [817, 35, 817, 180],
  [817, 330, 817, 470],
  [1005, 15, 1005, 110],
];

/** Dotted guides (rendered with a round-cap dash pattern, not drawn in). */
const DOTTED: Seg[] = [
  [485, 15, 485, 110],
  [795, 70, 795, 110],
  [430, 228, 430, 280],
  [365, 183, 410, 183],
  [885, 192, 925, 192],
  [520, 420, 520, 495],
  [1005, 380, 1005, 425],
  [318, 180, 318, 220],
];

const DOTS: [number, number][] = [
  [280, 95],
  [463, 35],
  [463, 470],
  [817, 35],
  [817, 470],
  [1005, 95],
];

const SQUARES: [number, number][] = [
  [220, 63],
  [220, 343],
  [1062, 343],
  [1020, 63],
];

/** "+" marks with arm length 14. */
const CROSSES: [number, number][] = [
  [CX, 46],
  [CX, 465],
  [425, 253],
  [855, 253],
];

export function HeroLinework() {
  let i = 0; // stagger index for the draw-in
  const draw = () => ({ ["--i" as string]: i++ });

  return (
    <svg viewBox="0 0 1284 663" className="absolute inset-0 h-full w-full overflow-visible text-ink" aria-hidden="true">
      <defs>
        <clipPath id="hero-wall">
          <rect x="-2000" y="-2000" width="5284" height={2000 + SEAM} />
        </clipPath>
      </defs>
      <g clipPath="url(#hero-wall)" fill="none" stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke">
        {/* The orbit: a large circle around the disc, cut off by the floor. */}
        <circle className="draw-in" style={draw()} cx={CX} cy={CY} r={362} pathLength={1} strokeOpacity={0.55} vectorEffect="non-scaling-stroke" />

        {LINES.map(([x1, y1, x2, y2]) => (
          <line
            key={`${x1}-${y1}-${x2}-${y2}`}
            className="draw-in"
            style={draw()}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            pathLength={1}
            strokeOpacity={x1 === 0 && y1 === 125 ? 0.35 : 0.7}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {CROSSES.map(([x, y]) => (
          <path
            key={`c${x}-${y}`}
            className="draw-in"
            style={draw()}
            d={`M${x - 14} ${y}H${x + 14}M${x} ${y - 14}V${y + 14}`}
            pathLength={1}
            strokeWidth={1.4}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <g className="fade-in" strokeDasharray="0.1 6" strokeLinecap="round" strokeWidth={1.6}>
          {DOTTED.map(([x1, y1, x2, y2]) => (
            <line key={`d${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>
      </g>

      <g className="fade-in" fill="currentColor">
        {DOTS.map(([x, y]) => (
          <circle key={`o${x}-${y}`} cx={x} cy={y} r={3} />
        ))}
        {SQUARES.map(([x, y]) => (
          <rect key={`s${x}-${y}`} x={x - 3} y={y - 3} width={6} height={6} />
        ))}
      </g>
    </svg>
  );
}
