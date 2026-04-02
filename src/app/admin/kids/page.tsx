import { createClient } from "@/lib/supabase/server";
import KidsContent from "@/app/admin/components/KidsContent";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default async function AdminKidsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "child")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load kids:", error.message);
  }

  const kids = (data ?? []) as Profile[];

  return <KidsContent kids={kids} />;
}
