export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
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
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
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
        ]
      }
      rooms: {
        Row: {
          contribution_per_member: number
          created_at: string
          created_by: string | null
          current_period_start_date: string
          id: string
          invite_code: string
          name: string
          period_duration_days: number
        }
        Insert: {
          contribution_per_member?: number
          created_at?: string
          created_by?: string | null
          current_period_start_date?: string
          id?: string
          invite_code?: string
          name: string
          period_duration_days?: number
        }
        Update: {
          contribution_per_member?: number
          created_at?: string
          created_by?: string | null
          current_period_start_date?: string
          id?: string
          invite_code?: string
          name?: string
          period_duration_days?: number
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
          recurrence_pattern: string
          room_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          points_reward?: number
          recurrence_pattern?: string
          room_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          points_reward?: number
          recurrence_pattern?: string
          room_id?: string
          title?: string
        }
        Relationships: [
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
      end_period: { Args: { p_room_id: string }; Returns: string }
      generate_task_instances: {
        Args: { p_count?: number; p_start_date?: string; p_template_id: string }
        Returns: undefined
      }
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
