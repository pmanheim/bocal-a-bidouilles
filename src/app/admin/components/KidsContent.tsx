"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import KidCard from "./KidCard";
import KidForm from "./KidForm";
import { createKid, updateKid, deleteKid } from "@/app/actions/kids";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type FormMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; profile: Profile };

export default function KidsContent({
  kids,
}: {
  kids: Profile[];
}) {
  const [formMode, setFormMode] = useState<FormMode>({ kind: "closed" });

  async function handleCreate(fd: FormData) {
    await createKid(fd);
    setFormMode({ kind: "closed" });
  }

  async function handleEdit(profileId: string, fd: FormData) {
    await updateKid(profileId, fd);
    setFormMode({ kind: "closed" });
  }

  async function handleDelete(profileId: string) {
    await deleteKid(profileId);
    setFormMode({ kind: "closed" });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Manage Kids</h2>
        <button
          onClick={() => setFormMode({ kind: "create" })}
          className="flex items-center gap-2 bg-primary text-text-on-primary px-4 py-2 font-semibold"
          style={{ borderRadius: "var(--radius-button)", minHeight: 44 }}
        >
          <Plus size={18} />
          Add Child
        </button>
      </div>

      {kids.length === 0 ? (
        <p className="text-text-secondary py-8 text-center">
          No kids added yet. Add your first child to get started!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {kids.map((kid) => (
            <KidCard
              key={kid.id}
              profile={kid}
              onEdit={() => setFormMode({ kind: "edit", profile: kid })}
            />
          ))}
        </div>
      )}

      {formMode.kind === "create" && (
        <KidForm
          mode="create"
          onSubmit={handleCreate}
          onCancel={() => setFormMode({ kind: "closed" })}
        />
      )}
      {formMode.kind === "edit" && (
        <KidForm
          mode="edit"
          profile={formMode.profile}
          onSubmit={(fd) => handleEdit(formMode.profile.id, fd)}
          onCancel={() => setFormMode({ kind: "closed" })}
          onDelete={() => handleDelete(formMode.profile.id)}
        />
      )}
    </>
  );
}
