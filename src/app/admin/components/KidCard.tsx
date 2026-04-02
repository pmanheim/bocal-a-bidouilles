import { getAvatarIcon, getAvatarLabel } from "@/lib/avatarUtils";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function KidCard({
  profile,
  onEdit,
}: {
  profile: Profile;
  onEdit: () => void;
}) {
  return (
    <div
      className="bg-surface p-4 flex items-center gap-4"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
        style={{ backgroundColor: profile.color ?? "#ccc" }}
      >
        {getAvatarIcon(profile.avatar)}
      </div>

      {/* Name + avatar label */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base truncate">{profile.name}</h3>
        <p className="text-sm text-text-secondary">
          Avatar: {getAvatarLabel(profile.avatar)}
        </p>
      </div>

      {/* Edit button */}
      <button
        onClick={onEdit}
        className="text-sm font-semibold shrink-0"
        style={{
          color: "var(--color-primary)",
          minWidth: 44,
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Edit
      </button>
    </div>
  );
}
