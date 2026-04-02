"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { ParticipantProfile } from "@/types/database";
import { recordCheckIn } from "@/app/actions/checkIn";
import { getAvatarIcon } from "@/lib/avatarUtils";
import { getRandomLateMessage } from "@/lib/lateMessages";
import { playCheckInSound } from "@/lib/sounds";

const CHECKLIST_ITEMS = [
  { label: "Teeth", emoji: "\u{1FAA5}", bg: "#E8F5E9" },
  { label: "Clothes", emoji: "\u{1F455}", bg: "#FFF3E0" },
  { label: "Potty", emoji: "\u{1F6BD}", bg: "#E8F5E9" },
  { label: "Breakfast", emoji: "\u{1F374}", bg: "#FCE4EC" },
  { label: "Shoes", emoji: "\u{1F45F}", bg: "#FCE4EC" },
];

interface CheckInModalProps {
  profile: ParticipantProfile;
  goalId: string;
  participants: { profiles: ParticipantProfile }[];
  checkedInProfileIds: string[];
  isLate: boolean;
  isTeam: boolean;
  isTimed: boolean;
  onClose: () => void;
  onCheckInComplete: (profileId: string) => void;
  onCelebration: () => void;
}

export default function CheckInModal({
  profile,
  goalId,
  participants,
  checkedInProfileIds,
  isLate,
  isTeam,
  isTimed,
  onClose,
  onCheckInComplete,
  onCelebration,
}: CheckInModalProps) {
  const [isPending, startTransition] = useTransition();
  const alreadyCheckedIn = checkedInProfileIds.includes(profile.id);

  // Pick a random late message once when the modal mounts
  const [lateMessage] = useState(() =>
    isLate ? getRandomLateMessage(isTimed, isTeam) : null
  );

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCheckIn = useCallback(() => {
    if (alreadyCheckedIn || isPending) return;
    startTransition(async () => {
      const result = await recordCheckIn(profile.id, goalId);
      if (result.success) {
        playCheckInSound();
        onCheckInComplete(profile.id);
        if (result.dailyStatus === "success") {
          // Close check-in modal, then show celebration
          onClose();
          onCelebration();
        } else {
          onClose();
        }
      }
    });
  }, [alreadyCheckedIn, isPending, profile.id, goalId, onCheckInComplete, onClose, onCelebration]);

  return (
    // Backdrop — semi-transparent, dismisses on tap
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-in"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      {/* Modal card */}
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-md relative animate-modal-in"
        style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — 44x44px minimum touch target */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Avatar + Name */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-3"
            style={{ backgroundColor: profile.color ?? "#ccc" }}
          >
            {getAvatarIcon(profile.avatar)}
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800">{profile.name}</h2>
        </div>

        {isLate && lateMessage && !alreadyCheckedIn ? (
          /* ── Late check-in state ── */
          <>
            <div className="text-center mb-6">
              <p className="text-lg font-bold text-gray-700 mb-2">
                {lateMessage.heading}
              </p>
              <p className="text-gray-500">{lateMessage.body}</p>
            </div>

            <button
              onClick={handleCheckIn}
              disabled={isPending}
              className="w-full py-4 rounded-2xl text-white font-extrabold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#f59e0b",
                fontSize: "18px",
                minHeight: "56px",
              }}
            >
              {isPending ? "Recording..." : lateMessage.button}
            </button>
          </>
        ) : (
          /* ── Normal check-in state ── */
          <>
            <p className="text-gray-500 text-center mb-4">Have you done everything?</p>

            {/* Checklist — view-only icons */}
            <div className="flex justify-center gap-3 mb-6">
              {CHECKLIST_ITEMS.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: item.bg }}
                  >
                    {item.emoji}
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Team status bar */}
            <div className="flex flex-col gap-2 mb-6">
              {participants.map((p) => {
                const member = p.profiles;
                if (!member) return null;
                const isCurrentKid = member.id === profile.id;
                const hasCheckedIn = checkedInProfileIds.includes(member.id);
                return (
                  <div key={member.id} className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: isCurrentKid || hasCheckedIn
                          ? (member.color ?? "#ccc")
                          : "#e5e7eb",
                      }}
                    >
                      {getAvatarIcon(member.avatar)}
                    </div>
                    {isCurrentKid ? (
                      <span
                        className="text-sm font-bold px-3 py-1 rounded-full text-white"
                        style={{ backgroundColor: member.color ?? "#ccc" }}
                      >
                        {member.name}: checking in now
                      </span>
                    ) : hasCheckedIn ? (
                      <span className="text-sm font-bold text-gray-700">
                        {member.name}: checked in &#10003;
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">
                        {member.name}: not yet checked in
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* "I'm Ready!" button — 18px+ text per PRD, 44px+ touch target */}
            <button
              onClick={handleCheckIn}
              disabled={alreadyCheckedIn || isPending}
              className="w-full py-4 rounded-2xl text-white font-extrabold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: alreadyCheckedIn ? "#9ca3af" : "var(--color-primary)",
                fontSize: "18px",
                minHeight: "56px",
              }}
            >
              {isPending
                ? "Checking in..."
                : alreadyCheckedIn
                  ? "Already checked in \u2713"
                  : "I'm Ready!"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
