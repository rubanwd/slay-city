export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          condition_type: string
          condition_value: number
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          is_published: boolean
          name: string
          updated_at: string
        }
        Insert: {
          condition_type: string
          condition_value: number
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_published?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          condition_type?: string
          condition_value?: number
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_published?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_content_drafts: {
        Row: {
          content: Json
          created_at: string
          id: string
          mission_id: string
          status: Database["public"]["Enums"]["ai_content_draft_status"]
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          mission_id: string
          status?: Database["public"]["Enums"]["ai_content_draft_status"]
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          mission_id?: string
          status?: Database["public"]["Enums"]["ai_content_draft_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_drafts_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string
          description: string | null
          district_id: string
          id: string
          is_published: boolean
          map_x: number | null
          map_y: number | null
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          district_id: string
          id?: string
          is_published?: boolean
          map_x?: number | null
          map_y?: number | null
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          district_id?: string
          id?: string
          is_published?: boolean
          map_x?: number | null
          map_y?: number | null
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_tasks: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_published: boolean
          mission_id: string
          order_index: number
          task_type: Database["public"]["Enums"]["mission_task_type"]
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          mission_id: string
          order_index?: number
          task_type: Database["public"]["Enums"]["mission_task_type"]
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          mission_id?: string
          order_index?: number
          task_type?: Database["public"]["Enums"]["mission_task_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_tasks_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          coin_reward: number
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          location_id: string
          order_index: number
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          coin_reward?: number
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          location_id: string
          order_index?: number
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          coin_reward?: number
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          location_id?: string
          order_index?: number
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "missions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_child_links: {
        Row: {
          child_id: string
          created_at: string
          id: string
          parent_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          parent_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_child_links_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_child_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          username: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          username: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          username?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          profile_id: string
          unlocked_at: string
        }
        Insert: {
          achievement_id: string
          id?: string
          profile_id: string
          unlocked_at?: string
        }
        Update: {
          achievement_id?: string
          id?: string
          profile_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          location_id: string
          mission_id: string
          profile_id: string
          score: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          location_id: string
          mission_id: string
          profile_id: string
          score?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          location_id?: string
          mission_id?: string
          profile_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          coins: number
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          level: number
          longest_streak: number
          profile_id: string
          updated_at: string
          xp: number
        }
        Insert: {
          coins?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          profile_id: string
          updated_at?: string
          xp?: number
        }
        Update: {
          coins?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          profile_id?: string
          updated_at?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wardrobe_items: {
        Row: {
          acquired_at: string
          equipped: boolean
          id: string
          profile_id: string
          wardrobe_item_id: string
        }
        Insert: {
          acquired_at?: string
          equipped?: boolean
          id?: string
          profile_id: string
          wardrobe_item_id: string
        }
        Update: {
          acquired_at?: string
          equipped?: boolean
          id?: string
          profile_id?: string
          wardrobe_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wardrobe_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_wardrobe_items_wardrobe_item_id_fkey"
            columns: ["wardrobe_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_items: {
        Row: {
          audio_url: string | null
          created_at: string
          example_sentence: string | null
          id: string
          image_url: string | null
          is_published: boolean
          mission_id: string
          translation: string
          updated_at: string
          word: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          example_sentence?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          mission_id: string
          translation: string
          updated_at?: string
          word: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          example_sentence?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          mission_id?: string
          translation?: string
          updated_at?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_items_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      wardrobe_items: {
        Row: {
          cost_coins: number
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean
          item_type: string
          name: string
          updated_at: string
        }
        Insert: {
          cost_coins?: number
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          item_type: string
          name: string
          updated_at?: string
        }
        Update: {
          cost_coins?: number
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          item_type?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_mission: {
        Args: { p_mission_id: string }
        Returns: {
          already_completed: boolean
          xp_earned: number
          coins_earned: number
        }[]
      }
      claim_admin: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_linked_child: { Args: { p_child_id: string }; Returns: boolean }
      link_child_by_email: {
        Args: { p_child_email: string }
        Returns: {
          linked: boolean
          child_id: string
          reason: string
        }[]
      }
      reset_my_progress: { Args: never; Returns: undefined }
    }
    Enums: {
      ai_content_draft_status: "pending" | "approved" | "rejected"
      mission_task_type: "vocabulary" | "matching" | "listening" | "quiz"
      user_role: "child" | "parent" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_content_draft_status: ["pending", "approved", "rejected"],
      mission_task_type: ["vocabulary", "matching", "listening", "quiz"],
      user_role: ["child", "parent", "admin"],
    },
  },
} as const

