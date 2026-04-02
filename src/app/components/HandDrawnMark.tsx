"use client";

import { useRef, useEffect } from "react";
import { DIGIT_PATHS, X_STROKES } from "@/lib/handDrawnDigits";

// Cached MediaQueryList — avoids recreating per DrawOnPath mount
let reducedMotionQuery: MediaQueryList | null = null;
function getReducedMotionQuery(): boolean {
  if (typeof window === "undefined") return false;
  if (!reducedMotionQuery) {
    reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  }
  return reducedMotionQuery.matches;
}

interface HandDrawnNumberProps {
  value: number;
  color: string;
}

/**
 * Renders a success number using SVG paths with a "draw-on" stroke animation.
 * Each stroke of multi-stroke digits draws sequentially.
 * Uses getTotalLength() for accurate stroke-dasharray values.
 */
export function HandDrawnNumber({ value, color }: HandDrawnNumberProps) {
  const digits = String(value).split("");
  const digitWidth = 50;
  const totalWidth = digits.length * digitWidth;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 70`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: "visible" }}
    >
      {digits.map((digit, di) => {
        const strokes = DIGIT_PATHS[digit] ?? DIGIT_PATHS["0"];
        // Count all strokes before this digit for stagger delay
        let strokesBefore = 0;
        for (let i = 0; i < di; i++) {
          const prevDigit = digits[i];
          strokesBefore += (DIGIT_PATHS[prevDigit] ?? DIGIT_PATHS["0"]).length;
        }

        return (
          <g key={di} transform={`translate(${di * digitWidth}, 0)`}>
            {strokes.map((stroke, si) => (
              <DrawOnPath
                key={si}
                d={stroke.d}
                color={color}
                strokeWidth={5}
                delay={(strokesBefore + si) * 350}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

interface HandDrawnXProps {
  color: string;
}

/**
 * Renders an X mark using SVG lines with a "draw-on" stroke animation.
 * The two strokes draw sequentially.
 */
export function HandDrawnX({ color }: HandDrawnXProps) {
  return (
    <svg
      className="absolute inset-0 w-full h-full p-2"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {X_STROKES.map((stroke, i) => (
        <DrawOnPath
          key={i}
          d={stroke.d}
          color={color}
          strokeWidth={7}
          delay={i * 300}
        />
      ))}
    </svg>
  );
}

interface DrawOnPathProps {
  d: string;
  color: string;
  strokeWidth: number;
  delay: number;
}

/**
 * A single SVG path that animates from hidden to fully drawn.
 * Uses getTotalLength() for accurate dash values, CSS transition for the animation.
 * Respects prefers-reduced-motion: shows path instantly without animation.
 */
function DrawOnPath({ d, color, strokeWidth, delay }: DrawOnPathProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const reducedMotion = getReducedMotionQuery();

    const length = path.getTotalLength();

    if (reducedMotion) {
      // Show immediately
      path.style.strokeDasharray = "none";
      path.style.strokeDashoffset = "0";
      path.style.opacity = "1";
      return;
    }

    // Set up hidden state
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.style.opacity = "1";

    // Trigger draw-on after delay — slow enough to feel like handwriting
    const timer = setTimeout(() => {
      path.style.transition =
        "stroke-dashoffset 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)";
      path.style.strokeDashoffset = "0";
    }, delay);

    return () => clearTimeout(timer);
  }, [d, delay]);

  return (
    <path
      ref={pathRef}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0 }}
    />
  );
}
