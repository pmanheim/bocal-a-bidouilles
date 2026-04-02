"use client";

import { useState, useCallback } from "react";
import type { ParticipantProfile, Json } from "@/types/database";
import CheckInModal from "./CheckInModal";
import CelebrationModal from "./CelebrationModal";
import { getAvatarIcon } from "@/lib/avatarUtils";

interface ParticipantAvatarsProps {
  participants: { profiles: ParticipantProfile }[];
  goalId: string;
  checklistItems: Json;
  initialCheckedInProfileIds: string[];
  isLate: boolean;
  isTeam: boolean;
  isTimed: boolean;
  successCount: number;
  targetCount: number;
}

export default function ParticipantAvatars({
  participants,
  goalId,
  checklistItems,
  initialCheckedInProfileIds,
  isLate,
  isTeam,
  isTimed,
  successCount,
  targetCount,
}: ParticipantAvatarsProps) {
  const [openProfileId, setOpenProfileId] = useState<string | null>(null);
  const [checkedInProfileIds, setCheckedInProfileIds] = useState<string[]>(
    initialCheckedInProfileIds
  );
  const [showCelebration, setShowCelebration] = useState(false);

  const handleCheckInComplete = useCallback((profileId: string) => {
    setCheckedInProfileIds((prev) =>
      prev.includes(profileId) ? prev : [...prev, profileId]
    );
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpenProfileId(null);
  }, []);

  const handleCelebration = useCallback(() => {
    setShowCelebration(true);
  }, []);

  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  const openProfile = participants.find(
    (p) => p.profiles?.id === openProfileId
  )?.profiles;

  return (
    <>
      <div className="flex gap-8 mb-3">
        {participants.map((p) => {
          const profile = p.profiles;
          if (!profile) return null;
          const hasCheckedIn = checkedInProfileIds.includes(profile.id);
          return (
            <button
              key={profile.id}
              onClick={() => setOpenProfileId(profile.id)}
              className="flex flex-col items-center gap-2 cursor-pointer press-feedback"
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              <div className="relative">
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center text-6xl"
                  style={{
                    backgroundColor: profile.color ?? "#ccc",
                  }}
                >
                  {getAvatarIcon(profile.avatar)}
                </div>
                {/* Checkmark overlay — pops in on check-in */}
                {hasCheckedIn && (
                  <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md animate-check-pop">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
              <span className="text-lg font-bold text-text-secondary">
                {profile.name}
              </span>
            </button>
          );
        })}
      </div>

      {openProfile && (
        <CheckInModal
          profile={openProfile}
          goalId={goalId}
          checklistItems={checklistItems}
          participants={participants}
          checkedInProfileIds={checkedInProfileIds}
          isLate={isLate}
          isTeam={isTeam}
          isTimed={isTimed}
          onClose={handleCloseModal}
          onCheckInComplete={handleCheckInComplete}
          onCelebration={handleCelebration}
        />
      )}

      {showCelebration && (
        <CelebrationModal
          participants={participants}
          successCount={successCount + 1}
          targetCount={targetCount}
          isTeam={isTeam}
          onClose={handleCloseCelebration}
        />
      )}
    </>
  );
}
