"use client";

import { useState, useCallback } from "react";
import { MUTE_STORAGE_KEY } from "@/lib/sounds";

/**
 * Mute toggle button for sounds. Persists state in localStorage.
 * Read by sound functions in lib/sounds.ts independently.
 */
export default function MuteButton() {
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  });

  const toggle = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem(MUTE_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <button
      onClick={toggle}
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
    >
      {muted ? (
        /* Speaker muted icon */
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        /* Speaker on icon */
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
}
