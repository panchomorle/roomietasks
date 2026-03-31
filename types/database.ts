export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      notification_log: {
        Row: {
          cycle_key: string
          id: string
          notification_type: string
          room_id: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          cycle_key: string
          id?: string
          notification_type: string
          room_id?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          cycle_key?: string
          id?: string
          notification_type?: string
          room_id?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      period_history: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          room_id: string
          total_points: number
          total_pool: number
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          room_id: string
          total_points?: number
          total_pool?: number
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          room_id?: string
          total_points?: number
          total_pool?: number
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "period_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      period_user_history: {
        Row: {
          id: string
          money_received: number
          period_id: string
          points_earned: number
          user_id: string
        }
        Insert: {
          id?: string
          money_received?: number
          period_id: string
          points_earned?: number
          user_id: string
        }
        Update: {
          id?: string
          money_received?: number
          period_id?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "period_user_history_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "period_history"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          language: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          language?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          subscription: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          subscription: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          subscription?: Json
          user_id?: string
        }
        Relationships: []
      }
      room_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          contribution_per_member: number
          created_at: string
          created_by: string | null
          current_period_start_date: string
          cycle_anchor_weekday: number | null
          cycle_fixed_days: number | null
          cycle_mode: string
          cycles_per_period: number
          id: string
          invite_code: string
          name: string
          period_duration_days: number
          point_limit: number | null
          point_limit_period: string | null
          recurrent_cooldown_days: number | null
        }
        Insert: {
          contribution_per_member?: number
          created_at?: string
          created_by?: string | null
          current_period_start_date?: string
          cycle_anchor_weekday?: number | null
          cycle_fixed_days?: number | null
          cycle_mode?: string
          cycles_per_period?: number
          id?: string
          invite_code?: string
          name: string
          period_duration_days?: number
          point_limit?: number | null
          point_limit_period?: string | null
          recurrent_cooldown_days?: number | null
        }
        Update: {
          contribution_per_member?: number
          created_at?: string
          created_by?: string | null
          current_period_start_date?: string
          cycle_anchor_weekday?: number | null
          cycle_fixed_days?: number | null
          cycle_mode?: string
          cycles_per_period?: number
          id?: string
          invite_code?: string
          name?: string
          period_duration_days?: number
          point_limit?: number | null
          point_limit_period?: string | null
          recurrent_cooldown_days?: number | null
        }
        Relationships: []
      }
      task_instances: {
        Row: {
          assigned_user_id: string | null
          completed_at: string | null
          completed_by_user_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          points_reward: number
          room_id: string
          status: Database["public"]["Enums"]["task_status"]
          template_id: string
          title: string
        }
        Insert: {
          assigned_user_id?: string | null
          completed_at?: string | null
          completed_by_user_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          points_reward?: number
          room_id: string
          status?: Database["public"]["Enums"]["task_status"]
          template_id: string
          title: string
        }
        Update: {
          assigned_user_id?: string | null
          completed_at?: string | null
          completed_by_user_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          points_reward?: number
          room_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_instances_assigned_user_id_profiles_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_completed_by_user_id_profiles_fkey"
            columns: ["completed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          points_reward: number
          recurrence_pattern: Json | null
          room_id: string
          spawn_on_completion: boolean
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          points_reward?: number
          recurrence_pattern?: Json | null
          room_id: string
          spawn_on_completion?: boolean
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          points_reward?: number
          recurrence_pattern?: Json | null
          room_id?: string
          spawn_on_completion?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_task_instance: {
        Args: { p_force?: boolean; p_task_id: string; p_user_id: string }
        Returns: Json
      }
      complete_task_instance: {
        Args: { p_force?: boolean; p_task_id: string; p_user_id: string }
        Returns: Json
      }
      end_period: { Args: { p_room_id: string }; Returns: string }
      generate_task_instances: {
        Args: { p_count?: number; p_start_date?: string; p_template_id: string }
        Returns: undefined
      }
      get_current_cycle_start: { Args: { p_room_id: string }; Returns: string }
      get_user_point_status: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: Json
      }
      is_room_admin: { Args: { p_room_id: string }; Returns: boolean }
      is_room_member: { Args: { p_room_id: string }; Returns: boolean }
    }
    Enums: {
      task_status: "pending" | "completed"
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
  public: {
    Enums: {
      task_status: ["pending", "completed"],
    },
  },
} as const
