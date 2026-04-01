import type { ParticipantProfile } from "@/types/database";

function getAvatarIcon(avatar: string) {
  switch (avatar) {
    case "bird": return "🐦";
    case "dog": return "🐕";
    case "cat": return "🐱";
    default: return "👤";
  }
}

interface ParticipantAvatarsProps {
  participants: { profiles: ParticipantProfile }[];
}

export default function ParticipantAvatars({ participants }: ParticipantAvatarsProps) {
  return (
    <div className="flex gap-8 mb-3">
      {participants.map((p) => {
        const profile = p.profiles;
        if (!profile) return null;
        return (
          <div key={profile.id} className="flex flex-col items-center gap-2">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-6xl"
              style={{
                backgroundColor: profile.color ?? "#ccc",
                color: "white",
              }}
            >
              {getAvatarIcon(profile.avatar)}
            </div>
            <span className="text-lg font-bold text-text-secondary">
              {profile.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
