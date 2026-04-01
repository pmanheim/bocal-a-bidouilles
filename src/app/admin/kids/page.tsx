import { Users } from "lucide-react";

export default function AdminKidsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Users size={48} className="text-text-secondary mb-4" />
      <h2 className="text-xl font-bold mb-2">Kids</h2>
      <p className="text-text-secondary max-w-sm">
        Child profile management is coming soon. You&apos;ll be able to add kids,
        change avatars, and manage profiles here.
      </p>
    </div>
  );
}
