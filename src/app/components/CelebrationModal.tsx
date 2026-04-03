"use client";

import { useEffect } from "react";
import type { ParticipantProfile } from "@/types/database";
import { getAvatarIcon } from "@/lib/avatarUtils";
import { playCelebrationSound } from "@/lib/sounds";

interface CelebrationModalProps {
  participants: { profiles: ParticipantProfile }[];
  successCount: number;
  targetCount: number;
  isTeam: boolean;
  onClose: () => void;
}

/**
 * Daily success celebration modal — shown when all required check-ins
 * are completed on time. Matches the "Amazing!" mockup (frame BkCpw).
 */
export default function CelebrationModal({
  participants,
  successCount,
  targetCount,
  isTeam,
  onClose,
}: CelebrationModalProps) {
  // Play celebration sound on mount
  useEffect(() => {
    playCelebrationSound();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const subtitle = isTeam
    ? "You both made it on time!"
    : "You made it on time!";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-in"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-sm relative animate-modal-in"
        style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* "Amazing!" title */}
        <h2
          className="text-center font-extrabold mb-2 animate-title-pop"
          style={{
            fontSize: "clamp(28px, 6vw, 36px)",
            color: "var(--color-primary)",
          }}
        >
          Amazing!
        </h2>

        {/* Subtitle */}
        <p className="text-center text-gray-600 font-semibold mb-6">
          {subtitle}
        </p>

        {/* Participant avatars with checkmarks */}
        <div className="flex justify-center gap-6 mb-6">
          {participants.map((p) => {
            const profile = p.profiles;
            if (!profile) return null;
            return (
              <div key={profile.id} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                    style={{ backgroundColor: profile.color ?? "#ccc" }}
                  >
                    {getAvatarIcon(profile.avatar)}
                  </div>
                  {/* Green checkmark badge */}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md animate-check-pop">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-600">
                  {profile.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Marble + jar concept */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* Marble */}
          <div
            className="w-8 h-8 rounded-full animate-marble-bounce"
            style={{
              background:
                "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, #F472B6 60%)",
            }}
          />
          <span className="text-gray-400 text-lg font-bold">+</span>
          {/* Mini jar icon */}
          <svg
            width="28"
            height="32"
            viewBox="0 0 160 180"
            className="text-gray-400"
          >
            <rect x="44" y="14" width="72" height="14" rx="4" fill="#8B9DAA" />
            <path
              d="M50 28 L46 48 Q40 65 38 85 L36 142 Q36 170 56 172 L104 172 Q124 170 124 142 L122 85 Q120 65 114 48 L110 28"
              fill="rgba(200,220,235,0.2)"
              stroke="#A8BCC8"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Count */}
        <p className="text-center mb-2">
          <span
            className="font-extrabold text-xl"
            style={{ color: "var(--color-primary)" }}
          >
            {successCount} / {targetCount}
          </span>
          <span className="text-gray-600 font-semibold ml-1">
            marbles earned!
          </span>
        </p>
      </div>
    </div>
  );
}
