"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createKid(formData: FormData) {
  const supabase = await createClient();

  const { data: family } = await supabase
    .from("families")
    .select("id")
    .limit(1)
    .single();
  if (!family) throw new Error("No family found");

  const name = (formData.get("name") as string)?.trim();
  const avatar = formData.get("avatar") as string;
  const color = formData.get("color") as string;

  if (!name) throw new Error("Name is required");
  if (!avatar) throw new Error("Avatar is required");

  const { error } = await supabase.from("profiles").insert({
    family_id: family.id,
    name,
    avatar,
    role: "child" as const,
    color: color || null,
  });

  if (error) throw new Error(`Failed to create profile: ${error.message}`);

  revalidatePath("/admin/kids");
  revalidatePath("/");
}

export async function updateKid(profileId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const avatar = formData.get("avatar") as string;
  const color = formData.get("color") as string;

  if (!name) throw new Error("Name is required");
  if (!avatar) throw new Error("Avatar is required");

  const { error } = await supabase
    .from("profiles")
    .update({ name, avatar, color: color || null })
    .eq("id", profileId);

  if (error) throw new Error(`Failed to update profile: ${error.message}`);

  revalidatePath("/admin/kids");
  revalidatePath("/");
}

export async function deleteKid(profileId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId);

  if (error) throw new Error(`Failed to delete profile: ${error.message}`);

  revalidatePath("/admin/kids");
  revalidatePath("/");
}
