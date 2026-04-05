/**
 * Marble layout algorithm for the jar SVG (viewBox 0 0 160 180).
 * Extracted from MarbleJar component for testability.
 */

/** Marble colors cycle for the jar */
export const MARBLE_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#FB923C",
  "#34D399", "#F472B6", "#5B9BD5", "#FF9A9E", "#C084FC",
];

/**
 * Jar inner width at a given y position (from SVG path shape).
 * Jar walls: bottom ~x=40-120, middle ~x=42-118, neck ~x=48-112.
 * Values account for marble radius margin so marbles stay inside.
 */
export function jarInnerWidth(y: number): number {
  if (y >= 150) return 68;
  if (y >= 120) return 70;
  if (y >= 90) return 66;
  if (y >= 60) return 56;
  return 46;
}

interface Layout {
  radius: number;
  stepX: number;
  stepY: number;
  rowCaps: number[];
  center: number;
  bottom: number;
}

/**
 * Compute marble size and row layout so that exactly `targetCount`
 * marbles fill the jar. Starts with the largest marble size (r=10)
 * and shrinks until all marbles fit within the jar shape.
 */
export function computeLayout(targetCount: number): Layout {
  const CENTER = 80;
  const BOTTOM = 160;
  const MIN_Y = 42;

  let r = 10;
  let stepX: number = 22;
  let stepY: number = 22;
  let rowCaps: number[] = [];

  while (r >= 4) {
    stepX = Math.ceil(r * 2.15);
    stepY = Math.ceil(r * 2.15);
    rowCaps = [];
    let total = 0;
    let y = BOTTOM;
    while (y >= MIN_Y && total < targetCount) {
      const w = jarInnerWidth(y);
      const cap = Math.max(1, Math.floor((w - r) / stepX) + 1);
      rowCaps.push(cap);
      total += cap;
      y -= stepY;
    }
    if (total >= targetCount) break;
    r -= 0.5;
  }

  // Trim excess from the last row so total === targetCount
  let total = rowCaps.reduce((a, b) => a + b, 0);
  while (total > targetCount && rowCaps.length > 0) {
    const last = rowCaps[rowCaps.length - 1];
    const excess = total - targetCount;
    if (excess >= last) {
      rowCaps.pop();
      total -= last;
    } else {
      rowCaps[rowCaps.length - 1] -= excess;
      total = targetCount;
    }
  }

  return { radius: r, stepX, stepY, rowCaps, center: CENTER, bottom: BOTTOM };
}

export interface MarblePosition {
  cx: number;
  cy: number;
}

/**
 * Compute marble positions for `count` marbles in a jar sized for `targetCount`.
 * Returns positions and the computed marble radius.
 */
export function getMarblePositions(
  count: number,
  targetCount: number
): { positions: MarblePosition[]; radius: number } {
  const { radius, stepX, stepY, rowCaps, center, bottom } = computeLayout(targetCount);
  const positions: MarblePosition[] = [];
  let placed = 0;

  for (let row = 0; row < rowCaps.length && placed < count; row++) {
    const cap = rowCaps[row];
    const toPlace = Math.min(cap, count - placed);
    const y = bottom - row * stepY;
    for (let col = 0; col < toPlace; col++) {
      const x = center + (col - (toPlace - 1) / 2) * stepX;
      positions.push({ cx: x, cy: y });
    }
    placed += toPlace;
  }

  return { positions, radius };
}
