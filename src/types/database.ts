/**
 * Hand-authored types matching the SLAY CITY MVP database schema.
 * Once real migrations land in `supabase/migrations/`, regenerate this file with:
 *   npx supabase gen types typescript --local > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "child" | "parent" | "admin";
export type ContentStatus = "draft" | "published";
export type ProgressStatus = "locked" | "unlocked" | "in_progress" | "completed";
export type MissionTaskType = "vocabulary" | "matching" | "listening" | "quiz";
export type AiContentDraftStatus = "pending" | "approved" | "rejected";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string;
          avatar_url: string | null;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          display_name: string;
          avatar_url?: string | null;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          display_name?: string;
          avatar_url?: string | null;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      districts: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          district_id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          position_x: number | null;
          position_y: number | null;
          required_location_id: string | null;
          sort_order: number;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          district_id: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          position_x?: number | null;
          position_y?: number | null;
          required_location_id?: string | null;
          sort_order?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          district_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          position_x?: number | null;
          position_y?: number | null;
          required_location_id?: string | null;
          sort_order?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      missions: {
        Row: {
          id: string;
          location_id: string;
          title: string;
          description: string | null;
          xp_reward: number;
          coin_reward: number;
          sort_order: number;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          title: string;
          description?: string | null;
          xp_reward?: number;
          coin_reward?: number;
          sort_order?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          title?: string;
          description?: string | null;
          xp_reward?: number;
          coin_reward?: number;
          sort_order?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      vocabulary_items: {
        Row: {
          id: string;
          word: string;
          translation: string;
          image_url: string | null;
          audio_url: string | null;
          example_sentence: string | null;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          word: string;
          translation: string;
          image_url?: string | null;
          audio_url?: string | null;
          example_sentence?: string | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          word?: string;
          translation?: string;
          image_url?: string | null;
          audio_url?: string | null;
          example_sentence?: string | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      mission_tasks: {
        Row: {
          id: string;
          mission_id: string;
          vocabulary_item_id: string | null;
          task_type: MissionTaskType;
          prompt: string | null;
          options: Json | null;
          correct_answer: Json | null;
          sort_order: number;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          vocabulary_item_id?: string | null;
          task_type: MissionTaskType;
          prompt?: string | null;
          options?: Json | null;
          correct_answer?: Json | null;
          sort_order?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          vocabulary_item_id?: string | null;
          task_type?: MissionTaskType;
          prompt?: string | null;
          options?: Json | null;
          correct_answer?: Json | null;
          sort_order?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          mission_id: string;
          location_id: string;
          status: ProgressStatus;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mission_id: string;
          location_id: string;
          status?: ProgressStatus;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mission_id?: string;
          location_id?: string;
          status?: ProgressStatus;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          xp: number;
          coins: number;
          level: number;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          xp?: number;
          coins?: number;
          level?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          xp?: number;
          coins?: number;
          level?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      wardrobe_items: {
        Row: {
          id: string;
          name: string;
          category: string;
          image_url: string | null;
          price_coins: number;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          image_url?: string | null;
          price_coins?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          image_url?: string | null;
          price_coins?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_wardrobe_items: {
        Row: {
          id: string;
          user_id: string;
          wardrobe_item_id: string;
          is_equipped: boolean;
          acquired_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wardrobe_item_id: string;
          is_equipped?: boolean;
          acquired_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wardrobe_item_id?: string;
          is_equipped?: boolean;
          acquired_at?: string;
          created_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon_url: string | null;
          criteria: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon_url?: string | null;
          criteria?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon_url?: string | null;
          criteria?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
          created_at?: string;
        };
      };
      ai_content_drafts: {
        Row: {
          id: string;
          content_type: string;
          target_table: string | null;
          target_id: string | null;
          payload: Json;
          status: AiContentDraftStatus;
          generated_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_type: string;
          target_table?: string | null;
          target_id?: string | null;
          payload: Json;
          status?: AiContentDraftStatus;
          generated_by?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content_type?: string;
          target_table?: string | null;
          target_id?: string | null;
          payload?: Json;
          status?: AiContentDraftStatus;
          generated_by?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      content_status: ContentStatus;
      progress_status: ProgressStatus;
      mission_task_type: MissionTaskType;
      ai_content_draft_status: AiContentDraftStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
