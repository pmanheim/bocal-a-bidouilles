import { PenSquare } from "lucide-react";

export default function AdminEntriesPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <PenSquare size={48} className="text-text-secondary mb-4" />
      <h2 className="text-xl font-bold mb-2">Edit Entries</h2>
      <p className="text-text-secondary max-w-sm">
        Retroactive entry corrections (changing misses to successes, skipping
        days) will be available here. Coming soon.
      </p>
    </div>
  );
}
