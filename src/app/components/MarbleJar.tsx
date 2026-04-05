"use client";

import { useRef, useEffect, useMemo } from "react";
import { playMarbleDropSound } from "@/lib/sounds";
import { getMarblePositions, MARBLE_COLORS } from "@/lib/marbleLayout";

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
