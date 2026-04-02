"use client";

import { useState, useEffect, useTransition } from "react";
import {
  AVATAR_OPTIONS,
  COLOR_PALETTE,
  getAvatarIcon,
} from "@/lib/avatarUtils";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface KidFormProps {
  mode: "create" | "edit";
  profile?: Profile;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export default function KidForm({
  mode,
  profile,
  onSubmit,
  onCancel,
  onDelete,
}: KidFormProps) {
  const [name, setName] = useState(profile?.name ?? "");
  const [avatar, setAvatar] = useState(
    profile?.avatar ?? ""
  );
  const [color, setColor] = useState(
    profile?.color ?? COLOR_PALETTE[0].hex
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!avatar) {
      setError("Please choose an avatar");
      return;
    }

    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("avatar", avatar);
    fd.set("color", color);

    startTransition(async () => {
      try {
        await onSubmit(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleDelete() {
    if (!onDelete) return;
    startTransition(async () => {
      try {
        await onDelete();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-in"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-md relative animate-modal-in overflow-y-auto"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="text-xl font-bold mb-5">
          {mode === "create" ? "Add Child" : "Edit Child"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter child's name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Avatar picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Avatar
            </label>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_OPTIONS.map((opt) => {
                const selected = avatar === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAvatar(opt.id)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors"
                    style={{
                      backgroundColor: selected
                        ? "var(--color-primary-light)"
                        : "#F7F5F3",
                      border: selected
                        ? "2px solid var(--color-primary)"
                        : "2px solid transparent",
                      minHeight: 44,
                    }}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: selected
                          ? "var(--color-primary)"
                          : "var(--color-text-secondary)",
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-3">
              {COLOR_PALETTE.map((c) => {
                const selected = color === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-transform"
                    style={{
                      backgroundColor: c.hex,
                      border: selected
                        ? "3px solid var(--color-text-primary)"
                        : "3px solid transparent",
                      transform: selected ? "scale(1.15)" : "scale(1)",
                    }}
                    aria-label={c.label}
                    title={c.label}
                  >
                    {selected && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          {avatar && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#F7F5F3" }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: color }}
              >
                {getAvatarIcon(avatar)}
              </div>
              <span className="font-semibold text-gray-700">
                {name.trim() || "Preview"}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-primary)",
                minHeight: 48,
              }}
            >
              {isPending
                ? "Saving..."
                : mode === "create"
                  ? "Add Child"
                  : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="px-5 py-3 font-semibold rounded-xl text-gray-600"
              style={{
                backgroundColor: "#F5F5F5",
                minHeight: 48,
              }}
            >
              Cancel
            </button>
          </div>

          {/* Delete — edit mode only */}
          {mode === "edit" && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="w-full py-2 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
            >
              Delete this child
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
