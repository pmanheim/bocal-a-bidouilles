/**
 * Hand-drawn SVG path data for digits 0-9 and X mark.
 * Used by HandDrawnMark component for "draw-on" stroke animation.
 *
 * All paths designed for a 50x70 viewBox.
 * Slight imperfections in control points create a hand-drawn feel.
 */

export interface DigitStroke {
  d: string;
}

/** SVG path strokes for each digit (0-9). Multi-stroke digits draw sequentially. */
export const DIGIT_PATHS: Record<string, DigitStroke[]> = {
  "0": [
    {
      d: "M25 10 C38 8 44 26 44 38 C44 54 37 64 25 64 C13 64 6 54 6 38 C6 26 12 8 25 10",
    },
  ],
  "1": [
    {
      d: "M15 18 L26 7 L26 64",
    },
  ],
  "2": [
    {
      d: "M10 22 C10 8 24 3 33 14 C40 23 28 38 10 56 L40 58",
    },
  ],
  "3": [
    {
      d: "M11 14 C20 4 38 6 31 22 C27 30 22 28 24 32",
    },
    {
      d: "M24 32 C30 32 38 40 33 52 C28 62 14 64 8 52",
    },
  ],
  "4": [
    {
      d: "M33 6 L6 44 L42 44",
    },
    {
      d: "M33 6 L33 64",
    },
  ],
  "5": [
    {
      d: "M38 8 L13 8 L11 34",
    },
    {
      d: "M11 34 C20 26 40 30 37 46 C34 60 17 65 9 54",
    },
  ],
  "6": [
    {
      d: "M36 13 C28 3 10 14 8 36 C6 54 16 64 26 64 C38 64 42 52 36 42 C30 32 14 32 8 40",
    },
  ],
  "7": [
    {
      d: "M8 8 L40 8",
    },
    {
      d: "M40 8 L22 64",
    },
  ],
  "8": [
    {
      d: "M25 35 C13 30 7 20 15 11 C23 4 35 6 37 16 C39 24 31 32 25 35",
    },
    {
      d: "M25 35 C17 39 5 46 10 56 C15 64 35 64 39 54 C43 44 33 38 25 35",
    },
  ],
  "9": [
    {
      d: "M11 56 C18 64 38 54 40 34 C42 16 32 4 20 4 C10 4 4 16 10 28 C16 38 32 38 40 30",
    },
  ],
};

/** X mark strokes for miss cells (100x100 viewBox) */
export const X_STROKES: DigitStroke[] = [
  { d: "M15 15 L85 85" },
  { d: "M85 15 L15 85" },
];
