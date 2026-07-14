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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      lens_usage: {
        Row: {
          created_at: string
          day: string
          id: string
          message_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          message_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          message_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_activity: {
        Row: {
          action: string
          category: string | null
          created_at: string
          headline: string | null
          id: string
          region: string | null
          story_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          category?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          region?: string | null
          story_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          category?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          region?: string | null
          story_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_stories: {
        Row: {
          category: string | null
          created_at: string
          headline: string
          id: string
          publisher: string | null
          region: string | null
          section: string | null
          source_url: string | null
          story_id: string
          summary: string | null
          user_id: string
          why_it_matters: string | null
          why_matters_to_you: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          headline: string
          id?: string
          publisher?: string | null
          region?: string | null
          section?: string | null
          source_url?: string | null
          story_id: string
          summary?: string | null
          user_id: string
          why_it_matters?: string | null
          why_matters_to_you?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          headline?: string
          id?: string
          publisher?: string | null
          region?: string | null
          section?: string | null
          source_url?: string | null
          story_id?: string
          summary?: string | null
          user_id?: string
          why_it_matters?: string | null
          why_matters_to_you?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan: string | null
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          countries: string[]
          created_at: string
          education: string | null
          goals: string[]
          interests: string[]
          onboarded: boolean
          region_preset: string
          updated_at: string
          user_id: string
        }
        Insert: {
          countries?: string[]
          created_at?: string
          education?: string | null
          goals?: string[]
          interests?: string[]
          onboarded?: boolean
          region_preset?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          countries?: string[]
          created_at?: string
          education?: string | null
          goals?: string[]
          interests?: string[]
          onboarded?: boolean
          region_preset?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_content: {
        Row: {
          content_type: Database["public"]["Enums"]["voice_content_type"]
          created_at: string
          created_by: string | null
          description: string | null
          duration: string | null
          id: string
          media_url: string | null
          publish_at: string | null
          published: boolean
          show_name: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content_type?: Database["public"]["Enums"]["voice_content_type"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          media_url?: string | null
          publish_at?: string | null
          published?: boolean
          show_name?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: Database["public"]["Enums"]["voice_content_type"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          media_url?: string | null
          publish_at?: string | null
          published?: boolean
          show_name?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      voice_content_type: "podcast" | "video" | "analysis"
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
      app_role: ["admin", "moderator", "user"],
      voice_content_type: ["podcast", "video", "analysis"],
    },
  },
} as const
