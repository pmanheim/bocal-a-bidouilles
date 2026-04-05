"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EntryStatus } from "@/types/database";
import {
  transitionEntryStatus,
  skipDay as skipDayInternal,
} from "@/lib/dailyEntryLifecycle";

/**
 * Admin: change a daily entry's status.
 * Delegates to the lifecycle module, then revalidates.
 */
export async function updateEntryStatus(
  entryId: string,
  goalId: string,
  newStatus: EntryStatus
) {
  const supabase = await createClient();
  await transitionEntryStatus(supabase, entryId, goalId, newStatus);
  revalidatePath("/admin/entries");
  revalidatePath("/");
}

/**
 * Admin: mark a specific date as "skip".
 * Delegates to the lifecycle module, then revalidates.
 */
export async function skipDay(goalId: string, date: string) {
  const supabase = await createClient();
  await skipDayInternal(supabase, goalId, date);
  revalidatePath("/admin/entries");
  revalidatePath("/");
}
