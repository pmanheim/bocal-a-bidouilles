import type { Json } from "@/types/database";

export type ChecklistItem = { emoji: string; label: string };

/**
 * Parse checklist_items from DB JSONB column.
 * Handles all legacy formats:
 * - string[] from seed data → { emoji: "⭐", label: string }
 * - { icon, label } from old Lucide form → { emoji: "⭐", label }
 * - { emoji, label } from current form → use as-is
 */
export function parseChecklistItems(raw: Json): ChecklistItem[] {
  if (!raw || !Array.isArray(raw)) return [];
  return (raw as (string | Record<string, string>)[]).map((item) => {
    if (typeof item === "string") return { emoji: "⭐", label: item };
    if ("emoji" in item) return { emoji: item.emoji, label: item.label };
    if ("icon" in item) return { emoji: "⭐", label: item.label || "" };
    return { emoji: "⭐", label: "" };
  });
}
