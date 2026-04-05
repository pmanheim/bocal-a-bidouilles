"use client";

import { useMemo, useState, useTransition } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { Database } from "@/types/database";
import { parseChecklistItems } from "@/lib/checklistUtils";
import type { ChecklistItem } from "@/lib/checklistUtils";

type Goal = Database["public"]["Tables"]["goals"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Curated emoji set for checklist items (kid-friendly activities)
const CHECKLIST_EMOJIS = [
  "🪥", "👕", "🍴", "👟", "🚽", "🧼", "📚", "🎒",
  "🛏️", "🌙", "☀️", "🎵", "🍎", "❤️", "⭐", "😊",
  "🐕", "🐈", "🚲", "🌲", "✏️", "🎨", "💪", "🥤",
  "🧹", "💊", "👓", "⏰", "🔑", "✅", "🥪", "🥛",
];

// Common prize/reward emojis for the emoji picker
const PRIZE_EMOJIS = [
  "🍨", "🍦", "🎂", "🍕", "🍩", "🧁", "🍿", "🎬",
  "🎮", "🎯", "🎪", "🎢", "🏊", "⚽", "🎁", "🧸",
  "🦄", "🌈", "⭐", "🏆", "👑", "🎉", "🎈", "💎",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


interface GoalFormProps {
  goal?: Goal & { participants?: string[] };
  childProfiles: Profile[];
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  mode: "create" | "edit" | "restart";
}

export default function GoalForm({
  goal,
  childProfiles,
  onSubmit,
  onCancel,
  mode,
}: GoalFormProps) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(goal?.name || "");
  const [description, setDescription] = useState(goal?.description || "");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    () => parseChecklistItems(goal?.checklist_items ?? null)
  );
  const [targetCount, setTargetCount] = useState(
    mode === "restart" ? 20 : goal?.target_count || 20
  );
  const [prizeText, setPrizeText] = useState(
    mode === "restart" ? "" : goal?.prize_text || ""
  );
  const [prizeEmoji, setPrizeEmoji] = useState(
    mode === "restart" ? "" : goal?.prize_emoji || ""
  );
  const [deadlineTime, setDeadlineTime] = useState(goal?.deadline_time?.slice(0, 5) || "");
  const [activeDays, setActiveDays] = useState<number[]>(
    (goal?.active_days as number[]) || [1, 2, 3, 4, 5]
  );
  const [isTeam, setIsTeam] = useState(goal?.is_team ?? true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return mode === "restart" ? localToday : goal?.start_date || localToday;
  });
  const [timezone, setTimezone] = useState(
    goal?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    goal?.participants || childProfiles.map((c) => c.id)
  );

  // All available IANA timezones, grouped by region
  const timezoneGroups = useMemo(() => {
    const zones = Intl.supportedValuesOf("timeZone");
    const groups = new Map<string, string[]>();
    for (const tz of zones) {
      const slash = tz.indexOf("/");
      const region = slash > 0 ? tz.slice(0, slash) : "Other";
      if (!groups.has(region)) groups.set(region, []);
      groups.get(region)!.push(tz);
    }
    return groups;
  }, []);

  // Emoji picker state for checklist items
  const [emojiPickerIndex, setEmojiPickerIndex] = useState<number | null>(null);

  function toggleDay(day: number) {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleParticipant(id: string) {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function addChecklistItem() {
    setChecklistItems((prev) => [...prev, { emoji: "⭐", label: "" }]);
  }

  function removeChecklistItem(index: number) {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index));
    if (emojiPickerIndex === null) return;
    if (emojiPickerIndex === index) setEmojiPickerIndex(null);
    else if (emojiPickerIndex > index) setEmojiPickerIndex(emojiPickerIndex - 1);
  }

  function updateChecklistItem(
    index: number,
    field: keyof ChecklistItem,
    value: string
  ) {
    setChecklistItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", name);
    fd.set("description", description);
    fd.set("checklist_items", JSON.stringify(checklistItems));
    fd.set("target_count", String(targetCount));
    fd.set("prize_text", prizeText);
    fd.set("prize_emoji", prizeEmoji);
    fd.set("deadline_time", deadlineTime || "");
    fd.set("active_days", JSON.stringify(activeDays));
    fd.set("is_team", String(isTeam));
    fd.set("start_date", startDate);
    fd.set("timezone", timezone);
    fd.set("participants", JSON.stringify(selectedParticipants));

    startTransition(async () => {
      await onSubmit(fd);
    });
  }

  const title =
    mode === "create"
      ? "New Goal"
      : mode === "edit"
        ? "Edit Goal"
        : "Restart Goal";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-surface w-full max-w-lg mx-4 p-6 flex flex-col gap-5"
        style={{ borderRadius: "var(--radius-modal)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2"
            style={{ minHeight: 44, minWidth: 44 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Name */}
        <FieldGroup label="Goal Name">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Ready for School"
            disabled={mode === "restart"}
            className="w-full border border-gray-200 px-3 py-2 text-base"
            style={{ borderRadius: "var(--radius-card)" }}
          />
        </FieldGroup>

        {/* Description */}
        <FieldGroup label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this goal involve?"
            rows={2}
            disabled={mode === "restart"}
            className="w-full border border-gray-200 px-3 py-2 text-base resize-none"
            style={{ borderRadius: "var(--radius-card)" }}
          />
        </FieldGroup>

        {/* Checklist items */}
        {mode !== "restart" && (
          <FieldGroup label="Checklist Items">
            <div className="flex flex-col gap-2">
              {checklistItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEmojiPickerIndex(emojiPickerIndex === i ? null : i)
                    }
                    className="shrink-0 w-10 h-10 flex items-center justify-center border border-gray-200 text-xl"
                    style={{ borderRadius: "var(--radius-card)" }}
                  >
                    {item.emoji}
                  </button>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) =>
                      updateChecklistItem(i, "label", e.target.value)
                    }
                    placeholder="e.g., Brush teeth"
                    className="flex-1 border border-gray-200 px-3 py-2 text-sm"
                    style={{ borderRadius: "var(--radius-card)" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(i)}
                    className="shrink-0 p-2 text-text-secondary"
                    style={{ minHeight: 44, minWidth: 44 }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {/* Inline emoji picker for checklist items */}
              {emojiPickerIndex !== null && (
                <div
                  className="grid grid-cols-8 gap-1 p-2 border border-gray-200 bg-gray-50"
                  style={{ borderRadius: "var(--radius-card)" }}
                >
                  {CHECKLIST_EMOJIS.map((emoji) => {
                    const selected =
                      checklistItems[emojiPickerIndex]?.emoji === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          updateChecklistItem(emojiPickerIndex, "emoji", emoji);
                          setEmojiPickerIndex(null);
                        }}
                        className="w-9 h-9 flex items-center justify-center text-xl"
                        style={{
                          borderRadius: 4,
                          backgroundColor: selected
                            ? "var(--color-primary-light)"
                            : "transparent",
                        }}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={addChecklistItem}
                className="flex items-center gap-1 text-sm font-semibold px-3 py-2 self-start"
                style={{
                  color: "var(--color-primary)",
                  minHeight: 44,
                }}
              >
                <Plus size={16} /> Add Item
              </button>
            </div>
          </FieldGroup>
        )}

        {/* Target count + Prize row */}
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Target Count">
            <input
              type="number"
              required
              min={1}
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value, 10) || 1)}
              className="w-full border border-gray-200 px-3 py-2 text-base"
              style={{ borderRadius: "var(--radius-card)" }}
            />
          </FieldGroup>
          <FieldGroup label="Prize Emoji">
            <EmojiPicker
              value={prizeEmoji}
              onChange={setPrizeEmoji}
              options={PRIZE_EMOJIS}
            />
          </FieldGroup>
        </div>

        <FieldGroup label="Prize Description">
          <input
            type="text"
            required
            value={prizeText}
            onChange={(e) => setPrizeText(e.target.value)}
            placeholder="e.g., Ice cream sundae party"
            className="w-full border border-gray-200 px-3 py-2 text-base"
            style={{ borderRadius: "var(--radius-card)" }}
          />
        </FieldGroup>

        {/* Deadline time */}
        {mode !== "restart" && (
          <FieldGroup label="Daily Deadline (optional — leave blank for untimed)">
            <input
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              className="w-full border border-gray-200 px-3 py-2 text-base"
              style={{ borderRadius: "var(--radius-card)" }}
            />
          </FieldGroup>
        )}

        {/* Active days */}
        {mode !== "restart" && (
          <FieldGroup label="Active Days">
            <div className="flex gap-2">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className="flex items-center justify-center font-semibold text-sm"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-card)",
                    backgroundColor: activeDays.includes(i)
                      ? "var(--color-primary)"
                      : "#F5F5F5",
                    color: activeDays.includes(i)
                      ? "var(--color-text-on-primary)"
                      : "var(--color-text-secondary)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </FieldGroup>
        )}

        {/* Participants */}
        {mode !== "restart" && (
          <FieldGroup label="Participants">
            <div className="flex flex-wrap gap-2">
              {childProfiles.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => toggleParticipant(child.id)}
                  className="flex items-center gap-2 px-4 py-2 font-semibold text-sm"
                  style={{
                    borderRadius: "var(--radius-button)",
                    minHeight: 44,
                    backgroundColor: selectedParticipants.includes(child.id)
                      ? "var(--color-primary)"
                      : "#F5F5F5",
                    color: selectedParticipants.includes(child.id)
                      ? "var(--color-text-on-primary)"
                      : "var(--color-text-secondary)",
                  }}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </FieldGroup>
        )}

        {/* Team/Individual toggle */}
        {mode !== "restart" && (
          <FieldGroup label="Goal Type">
            <div className="flex gap-2">
              {[
                { value: true, label: "Team" },
                { value: false, label: "Individual" },
              ].map(({ value, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsTeam(value)}
                  className="flex items-center gap-2 px-4 py-2 font-semibold text-sm"
                  style={{
                    borderRadius: "var(--radius-button)",
                    minHeight: 44,
                    backgroundColor:
                      isTeam === value ? "var(--color-primary)" : "#F5F5F5",
                    color:
                      isTeam === value
                        ? "var(--color-text-on-primary)"
                        : "var(--color-text-secondary)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </FieldGroup>
        )}

        {/* Start date + Timezone */}
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Start Date">
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-200 px-3 py-2 text-base"
              style={{ borderRadius: "var(--radius-card)" }}
            />
          </FieldGroup>
          <FieldGroup label="Timezone">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full border border-gray-200 px-3 py-2 text-base"
              style={{ borderRadius: "var(--radius-card)" }}
            >
              {[...timezoneGroups.entries()].map(([region, zones]) => (
                <optgroup key={region} label={region}>
                  {zones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </FieldGroup>
        </div>

        {/* Submit / Cancel */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-primary text-text-on-primary font-bold py-3 text-base transition-opacity"
            style={{
              borderRadius: "var(--radius-button)",
              minHeight: 44,
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending
              ? "Saving..."
              : mode === "create"
                ? "Create Goal"
                : mode === "edit"
                  ? "Save Changes"
                  : "Restart Goal"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 font-semibold text-text-secondary"
            style={{
              borderRadius: "var(--radius-button)",
              minHeight: 44,
              backgroundColor: "#F5F5F5",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function EmojiPicker({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (emoji: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-gray-200 px-3 py-2 text-base text-left flex items-center gap-2"
        style={{ borderRadius: "var(--radius-card)", minHeight: 42 }}
      >
        {value ? (
          <span className="text-xl">{value}</span>
        ) : (
          <span className="text-gray-400">Choose emoji...</span>
        )}
      </button>
      {open && (
        <div
          className="absolute z-10 top-full left-0 mt-1 p-2 bg-white border border-gray-200 shadow-lg grid grid-cols-8 gap-1"
          style={{ borderRadius: "var(--radius-card)", width: "max-content" }}
        >
          {options.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
              className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-gray-100"
              style={{
                backgroundColor: value === emoji ? "var(--color-primary-light)" : undefined,
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}
