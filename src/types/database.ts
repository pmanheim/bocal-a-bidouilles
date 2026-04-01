export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GoalStatus = "active" | "completed" | "archived";
export type EntryStatus = "pending" | "success" | "miss" | "skip";
export type ProfileRole = "child" | "parent";

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          avatar: string;
          role: ProfileRole;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          avatar: string;
          role: ProfileRole;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string;
          avatar?: string;
          role?: ProfileRole;
          color?: string | null;
          created_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          description: string | null;
          checklist_items: Json;
          target_count: number;
          prize_text: string;
          prize_emoji: string | null;
          deadline_time: string | null;
          active_days: Json;
          is_team: boolean;
          status: GoalStatus;
          start_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          description?: string | null;
          checklist_items?: Json;
          target_count: number;
          prize_text: string;
          prize_emoji?: string | null;
          deadline_time?: string | null;
          active_days?: Json;
          is_team?: boolean;
          status?: GoalStatus;
          start_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string;
          description?: string | null;
          checklist_items?: Json;
          target_count?: number;
          prize_text?: string;
          prize_emoji?: string | null;
          deadline_time?: string | null;
          active_days?: Json;
          is_team?: boolean;
          status?: GoalStatus;
          start_date?: string;
          created_at?: string;
        };
      };
      goal_participants: {
        Row: {
          id: string;
          goal_id: string;
          profile_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          profile_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          profile_id?: string;
          created_at?: string;
        };
      };
      daily_entries: {
        Row: {
          id: string;
          goal_id: string;
          date: string;
          status: EntryStatus;
          success_number: number | null;
          decoration_seed: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          date: string;
          status?: EntryStatus;
          success_number?: number | null;
          decoration_seed?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          date?: string;
          status?: EntryStatus;
          success_number?: number | null;
          decoration_seed?: number | null;
          created_at?: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          profile_id: string;
          goal_id: string;
          date: string;
          checked_in_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          goal_id: string;
          date: string;
          checked_in_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          goal_id?: string;
          date?: string;
          checked_in_at?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      goal_status: GoalStatus;
      entry_status: EntryStatus;
      profile_role: ProfileRole;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type ParticipantProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "name" | "avatar" | "color"
>;
