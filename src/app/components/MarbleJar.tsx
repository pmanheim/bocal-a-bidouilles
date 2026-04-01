/* ── Marble colors for jar ── */
const MARBLE_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#FB923C",
  "#34D399", "#F472B6", "#5B9BD5", "#FF9A9E", "#C084FC",
];

/* ── Generate marble positions inside jar (viewbox 160×180, supports up to 30+) ── */
/* Jar walls: left ~36-50px, right ~110-124px depending on height.
   Marbles (r=9) must stay fully inside: cx must be ≥ wall+11, ≤ wall-11. */
function getMarblePositions(count: number) {
  const STEP_X = 16;
  const STEP_Y = 16;
  const CENTER = 80;
  const BOTTOM = 158;
  // Hex-packed rows, tapering toward the narrower neck
  const rowCapacities = [5, 4, 5, 4, 4, 4, 3, 2]; // 31 total capacity

  const positions: { cx: number; cy: number }[] = [];
  let placed = 0;

  for (let row = 0; row < rowCapacities.length && placed < count; row++) {
    const cap = rowCapacities[row];
    const toPlace = Math.min(cap, count - placed);
    const y = BOTTOM - row * STEP_Y;
    for (let col = 0; col < toPlace; col++) {
      const x = CENTER + (col - (toPlace - 1) / 2) * STEP_X;
      positions.push({ cx: x, cy: y });
    }
    placed += toPlace;
  }

  return positions;
}

interface MarbleJarProps {
  successCount: number;
}

export default function MarbleJar({ successCount }: MarbleJarProps) {
  const marblePositions = getMarblePositions(successCount);

  return (
    <div className="flex-1 w-full flex items-center justify-center min-h-0">
      <svg viewBox="0 0 160 180" className="h-full w-auto" preserveAspectRatio="xMidYMax meet">
        {/* Lid */}
        <rect x="44" y="14" width="72" height="14" rx="4" fill="#8B9DAA" />
        {/* Jar body */}
        <path
          d="M50 28 L46 48 Q40 65 38 85 L36 142 Q36 170 56 172 L104 172 Q124 170 124 142 L122 85 Q120 65 114 48 L110 28"
          fill="rgba(200,220,235,0.12)"
          stroke="#A8BCC8"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Marbles */}
        {marblePositions.map((pos, i) => (
          <g key={i}>
            <circle cx={pos.cx} cy={pos.cy} r="9" fill={MARBLE_COLORS[i % MARBLE_COLORS.length]} />
            <circle cx={pos.cx - 3} cy={pos.cy - 3} r="2.5" fill="rgba(255,255,255,0.4)" />
          </g>
        ))}
      </svg>
    </div>
  );
}
