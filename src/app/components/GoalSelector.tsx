"use client";

import { useRouter } from "next/navigation";

interface GoalSelectorProps {
  goals: { id: string; name: string }[];
  currentGoalId: string;
}

/**
 * Dropdown to switch between active goals on the dashboard.
 * Only renders when there are multiple goals.
 */
export default function GoalSelector({ goals, currentGoalId }: GoalSelectorProps) {
  const router = useRouter();

  if (goals.length <= 1) return null;

  return (
    <select
      value={currentGoalId}
      onChange={(e) => router.push(`/?goal=${e.target.value}`)}
      className="bg-white/20 text-white text-sm md:text-base font-extrabold rounded-full px-3 py-1.5 appearance-none cursor-pointer"
      style={{ minHeight: 36 }}
      aria-label="Select goal"
    >
      {goals.map((g) => (
        <option key={g.id} value={g.id} className="text-gray-800">
          {g.name}
        </option>
      ))}
    </select>
  );
}
