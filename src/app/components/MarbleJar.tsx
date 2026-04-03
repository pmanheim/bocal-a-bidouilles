"use client";

import { useRef, useEffect, useMemo } from "react";
import { playMarbleDropSound } from "@/lib/sounds";

/* ── Marble colors for jar ── */
const MARBLE_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#FB923C",
  "#34D399", "#F472B6", "#5B9BD5", "#FF9A9E", "#C084FC",
];

/* ── Jar inner width at a given y position (from SVG path shape) ── */
function jarInnerWidth(y: number): number {
  if (y >= 140) return 82;
  if (y >= 110) return 80;
  if (y >= 80) return 74;
  if (y >= 60) return 64;
  return 54;
}

/**
 * Dynamically compute marble size and row layout so that exactly
 * `targetCount` marbles fill the jar. Starts with the largest marble
 * size that fits and shrinks until all marbles fit within the jar shape.
 */
function computeLayout(targetCount: number) {
  const CENTER = 80;
  const BOTTOM = 160;
  const MIN_Y = 42;

  let r = 10;
  let stepX: number;
  let stepY: number;
  let rowCaps: number[] = [];

  // Shrink marble radius until targetCount fits inside the jar
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

  return { radius: r, stepX: Math.ceil(r * 2.15), stepY: Math.ceil(r * 2.15), rowCaps, center: CENTER, bottom: BOTTOM };
}

function getMarblePositions(count: number, targetCount: number) {
  const { radius, stepX, stepY, rowCaps, center, bottom } = computeLayout(targetCount);
  const positions: { cx: number; cy: number }[] = [];
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

interface MarbleJarProps {
  successCount: number;
  targetCount: number;
}

export default function MarbleJar({ successCount, targetCount }: MarbleJarProps) {
  const prevCountRef = useRef<number | null>(null);
  const { positions: marblePositions, radius } = useMemo(
    () => getMarblePositions(successCount, targetCount),
    [successCount, targetCount]
  );

  // Detect new marbles inside the effect to avoid stale closure issues
  const isNewMarble = prevCountRef.current !== null && successCount > prevCountRef.current;

  useEffect(() => {
    const wasNewMarble =
      prevCountRef.current !== null && successCount > prevCountRef.current;
    if (wasNewMarble) {
      playMarbleDropSound();
    }
    prevCountRef.current = successCount;
  }, [successCount]);

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
        {marblePositions.map((pos, i) => {
          const isLast = i === marblePositions.length - 1 && isNewMarble;
          return (
            <g
              key={i}
              className={isLast ? "animate-marble-drop" : undefined}
              style={isLast ? { transformBox: "fill-box" as const, transformOrigin: "center" } : undefined}
            >
              <circle cx={pos.cx} cy={pos.cy} r={radius} fill={MARBLE_COLORS[i % MARBLE_COLORS.length]} />
              <circle cx={pos.cx - radius * 0.3} cy={pos.cy - radius * 0.3} r={radius * 0.28} fill="rgba(255,255,255,0.4)" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
