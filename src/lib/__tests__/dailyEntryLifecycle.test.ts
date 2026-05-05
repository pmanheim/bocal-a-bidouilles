/**
 * Tests for the Daily Entry Lifecycle module.
 *
 * Each test describes a BEHAVIOR the module must guarantee,
 * phrased as an acceptance criterion a PM would recognize.
 * The tests use a mock Supabase client (in-memory data)
 * so they run instantly with no database.
 */

import { describe, it, expect } from "vitest";
import { createMockSupabase } from "./mockSupabase";
import {
  recalculateSuccessNumbers,
  transitionEntryStatus,
  bootstrapDailyEntries,
  evaluateTeamCompletion,
  skipDay,
} from "../dailyEntryLifecycle";

// ── Test helpers ──

const GOAL_ID = "goal-1";

/** Create a daily entry with sensible defaults */
function entry(overrides: Record<string, unknown>) {
  return {
    id: `entry-${Math.random().toString(36).slice(2, 7)}`,
    goal_id: GOAL_ID,
    status: "pending",
    success_number: null,
    decoration_seed: null,
    updated_by: "system",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Behavior: Success numbers are always sequential ──

describe("success number sequencing", () => {
  it("renumbers successes sequentially by date with no gaps", async () => {
    // GIVEN: 3 successes with incorrect/stale numbering
    const db = createMockSupabase({
      daily_entries: [
        entry({ id: "e1", date: "2026-03-23", status: "success", success_number: 1 }),
        entry({ id: "e2", date: "2026-03-24", status: "miss" }),
        entry({ id: "e3", date: "2026-03-25", status: "success", success_number: 3 }), // gap!
        entry({ id: "e4", date: "2026-03-26", status: "success", success_number: 5 }), // wrong!
      ],
    });

    // WHEN: we recalculate success numbers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await recalculateSuccessNumbers(db as any, GOAL_ID);

    // THEN: successes are numbered 1, 2, 3 sequentially by date
    const entries = db.getRows("daily_entries");
    const successes = entries
      .filter((e) => e.status === "success")
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));

    expect(successes).toHaveLength(3);
    expect(successes[0].success_number).toBe(1); // March 23
    expect(successes[1].success_number).toBe(2); // March 25 (was 3)
    expect(successes[2].success_number).toBe(3); // March 26 (was 5)
  });
});

// ── Behavior: Admin edits are never overwritten ──

describe("bootstrap respects admin edits", () => {
  it("does not overwrite an admin-edited pending entry to miss", async () => {
    // GIVEN: A goal with an 8am deadline (now past), and today's entry
    // was manually set to "pending" by an admin (e.g., parent reset it
    // because a kid clicked by mistake)
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ...

    const db = createMockSupabase({
      goals: [
        {
          id: GOAL_ID,
          active_days: [0, 1, 2, 3, 4, 5, 6], // every day is active
          deadline_time: "08:00:00",
          start_date: "2026-01-01",
          timezone: "America/Los_Angeles",
        },
      ],
      daily_entries: [
        entry({
          id: "today-entry",
          date: today,
          status: "pending",
          updated_by: "admin", // parent deliberately set this
        }),
      ],
    });

    // WHEN: bootstrap runs (as it does on every page load)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await bootstrapDailyEntries(db as any, GOAL_ID);

    // THEN: the entry should still be "pending" — NOT changed to "miss"
    const entries = db.getRows("daily_entries");
    const todayEntry = entries.find((e) => e.id === "today-entry");
    expect(todayEntry?.status).toBe("pending");
    expect(todayEntry?.updated_by).toBe("admin");
  });
});

// ── Behavior: Status transitions clear/set success fields ──

describe("status transition side effects", () => {
  it("clears success_number and decoration_seed when changing from success to miss", async () => {
    // GIVEN: an entry that is currently a success with marble #2
    const db = createMockSupabase({
      daily_entries: [
        entry({ id: "e1", date: "2026-03-23", status: "success", success_number: 1, decoration_seed: 1234 }),
        entry({ id: "e2", date: "2026-03-24", status: "success", success_number: 2, decoration_seed: 5678 }),
      ],
    });

    // WHEN: admin changes e2 from success to miss
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await transitionEntryStatus(db as any, "e2", GOAL_ID, "miss");

    // THEN: e2's success fields are cleared
    const entries = db.getRows("daily_entries");
    const e2 = entries.find((e) => e.id === "e2");
    expect(e2?.status).toBe("miss");
    expect(e2?.success_number).toBeNull();
    expect(e2?.decoration_seed).toBeNull();

    // AND: e1 remains success #1 (still numbered correctly)
    const e1 = entries.find((e) => e.id === "e1");
    expect(e1?.success_number).toBe(1);
  });

  it("assigns a decoration_seed when changing to success", async () => {
    const db = createMockSupabase({
      daily_entries: [
        entry({ id: "e1", date: "2026-03-23", status: "miss", decoration_seed: null }),
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await transitionEntryStatus(db as any, "e1", GOAL_ID, "success");

    const e1 = db.getRows("daily_entries").find((e) => e.id === "e1");
    expect(e1?.status).toBe("success");
    expect(e1?.decoration_seed).not.toBeNull();
    expect(typeof e1?.decoration_seed).toBe("number");
  });

  it("marks entry as admin-edited on status change", async () => {
    const db = createMockSupabase({
      daily_entries: [
        entry({ id: "e1", date: "2026-03-23", status: "miss", updated_by: "system" }),
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await transitionEntryStatus(db as any, "e1", GOAL_ID, "success");

    const e1 = db.getRows("daily_entries").find((e) => e.id === "e1");
    expect(e1?.updated_by).toBe("admin");
  });
});

// ── Behavior: Team completion requires ALL members ──

describe("team completion evaluation", () => {
  it("returns pending when not all team members have checked in", async () => {
    const db = createMockSupabase({
      goal_participants: [
        { goal_id: GOAL_ID, profile_id: "lily" },
        { goal_id: GOAL_ID, profile_id: "emma" },
      ],
      check_ins: [
        // Only Lily checked in on time
        { profile_id: "lily", goal_id: GOAL_ID, date: "2026-03-23", checked_in_at: "2026-03-23T07:45:00-07:00" },
      ],
      daily_entries: [],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await evaluateTeamCompletion(db as any, GOAL_ID, true, "08:00:00", "2026-03-23", "America/Los_Angeles");

    expect(result).toBe("pending");
  });

  it("returns success when all team members have checked in on time", async () => {
    const db = createMockSupabase({
      goal_participants: [
        { goal_id: GOAL_ID, profile_id: "lily" },
        { goal_id: GOAL_ID, profile_id: "emma" },
      ],
      check_ins: [
        { profile_id: "lily", goal_id: GOAL_ID, date: "2026-03-23", checked_in_at: "2026-03-23T07:45:00-07:00" },
        { profile_id: "emma", goal_id: GOAL_ID, date: "2026-03-23", checked_in_at: "2026-03-23T07:50:00-07:00" },
      ],
      daily_entries: [],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await evaluateTeamCompletion(db as any, GOAL_ID, true, "08:00:00", "2026-03-23", "America/Los_Angeles");

    expect(result).toBe("success");
  });

  it("excludes late check-ins from team completion", async () => {
    const db = createMockSupabase({
      goal_participants: [
        { goal_id: GOAL_ID, profile_id: "lily" },
        { goal_id: GOAL_ID, profile_id: "emma" },
      ],
      check_ins: [
        { profile_id: "lily", goal_id: GOAL_ID, date: "2026-03-23", checked_in_at: "2026-03-23T07:45:00-07:00" }, // on time
        { profile_id: "emma", goal_id: GOAL_ID, date: "2026-03-23", checked_in_at: "2026-03-23T08:15:00-07:00" }, // LATE
      ],
      daily_entries: [],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await evaluateTeamCompletion(db as any, GOAL_ID, true, "08:00:00", "2026-03-23", "America/Los_Angeles");

    // Emma was late, so team goal is NOT complete
    expect(result).toBe("pending");
  });

  it("returns success for individual goal when any member checks in on time", async () => {
    const db = createMockSupabase({
      goal_participants: [
        { goal_id: GOAL_ID, profile_id: "lily" },
        { goal_id: GOAL_ID, profile_id: "emma" },
      ],
      check_ins: [
        // Only Lily checked in, but that's enough for individual
        { profile_id: "lily", goal_id: GOAL_ID, date: "2026-03-23", checked_in_at: "2026-03-23T07:45:00-07:00" },
      ],
      daily_entries: [],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await evaluateTeamCompletion(db as any, GOAL_ID, false, "08:00:00", "2026-03-23", "America/Los_Angeles");

    // Individual goal: one on-time check-in is enough
    expect(result).toBe("success");
  });
});

// ── Behavior: Bootstrap back-fills missed days ──

describe("bootstrap back-fills past active days", () => {
  it("inserts a 'miss' entry for every past active day with no entry", async () => {
    // GIVEN: a goal that started 5 days ago, every day is active, and only
    // one of those past days has an entry (a manual success). The other
    // four past active days have no entry — as if the app was never opened.
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Los_Angeles",
    });
    const [ty, tm, td] = today.split("-").map(Number);

    function dateOffset(days: number): string {
      const d = new Date(ty, tm - 1, td + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    }

    const fiveDaysAgo = dateOffset(-5);
    const threeDaysAgo = dateOffset(-3);

    const db = createMockSupabase({
      goals: [
        {
          id: GOAL_ID,
          active_days: [0, 1, 2, 3, 4, 5, 6],
          deadline_time: "08:00:00",
          start_date: fiveDaysAgo,
          timezone: "America/Los_Angeles",
        },
      ],
      daily_entries: [
        // Only one past day has an entry (manually marked success)
        entry({
          id: "manual-success",
          date: threeDaysAgo,
          status: "success",
          updated_by: "admin",
        }),
      ],
    });

    // WHEN: bootstrap runs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await bootstrapDailyEntries(db as any, GOAL_ID);

    // THEN: every day from start through today has an entry
    const entries = db.getRows("daily_entries");
    const dates = new Set(entries.map((e) => e.date));
    for (let i = -5; i <= 0; i++) {
      expect(dates.has(dateOffset(i))).toBe(true);
    }

    // AND: the previously empty past days are "miss"
    const missDates = entries
      .filter((e) => e.status === "miss")
      .map((e) => e.date)
      .sort();
    expect(missDates).toContain(dateOffset(-5));
    expect(missDates).toContain(dateOffset(-4));
    expect(missDates).toContain(dateOffset(-2));
    expect(missDates).toContain(dateOffset(-1));

    // AND: the admin's manual success is preserved
    const preserved = entries.find((e) => e.id === "manual-success");
    expect(preserved?.status).toBe("success");
    expect(preserved?.updated_by).toBe("admin");
  });

  it("skips inactive weekdays when back-filling", async () => {
    // GIVEN: a weekdays-only goal that started 9 days ago — weekend days
    // in that range should NOT get back-fill entries
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Los_Angeles",
    });
    const [ty, tm, td] = today.split("-").map(Number);

    function dateAt(offset: number): { date: string; dow: number } {
      const d = new Date(ty, tm - 1, td + offset);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return { date: `${y}-${m}-${dd}`, dow: d.getDay() };
    }

    const startDate = dateAt(-9).date;

    const db = createMockSupabase({
      goals: [
        {
          id: GOAL_ID,
          active_days: [1, 2, 3, 4, 5], // Mon-Fri only
          deadline_time: "08:00:00",
          start_date: startDate,
          timezone: "America/Los_Angeles",
        },
      ],
      daily_entries: [],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await bootstrapDailyEntries(db as any, GOAL_ID);

    // THEN: no entries exist for weekend dates in the range
    const entries = db.getRows("daily_entries");
    for (let i = -9; i <= 0; i++) {
      const { date, dow } = dateAt(i);
      const entry = entries.find((e) => e.date === date);
      if (dow === 0 || dow === 6) {
        expect(entry).toBeUndefined();
      } else {
        expect(entry).toBeDefined();
      }
    }
  });
});

// ── Behavior: Skip day ──

describe("skip day", () => {
  it("marks a day as skip and recalculates success numbers", async () => {
    const db = createMockSupabase({
      daily_entries: [
        entry({ id: "e1", date: "2026-03-23", status: "success", success_number: 1, decoration_seed: 1111 }),
        entry({ id: "e2", date: "2026-03-24", status: "success", success_number: 2, decoration_seed: 2222 }),
        entry({ id: "e3", date: "2026-03-25", status: "miss" }),
      ],
    });

    // Skip March 24 (was success #2)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await skipDay(db as any, GOAL_ID, "2026-03-24");

    const entries = db.getRows("daily_entries");
    const e2 = entries.find((e) => e.id === "e2");
    expect(e2?.status).toBe("skip");
    expect(e2?.updated_by).toBe("admin");

    // e1 should now be the only success, numbered #1
    const e1 = entries.find((e) => e.id === "e1");
    expect(e1?.success_number).toBe(1);
  });
});
