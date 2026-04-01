import { History } from "lucide-react";

export default function AdminHistoryPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <History size={48} className="text-text-secondary mb-4" />
      <h2 className="text-xl font-bold mb-2">History</h2>
      <p className="text-text-secondary max-w-sm">
        Goal history and archived goals will be viewable here. Coming soon.
      </p>
    </div>
  );
}
