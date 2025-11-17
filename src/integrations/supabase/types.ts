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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      photos: {
        Row: {
          ai_analysis: string | null
          alt_text: string | null
          artistic_score: number | null
          capture_date: string | null
          commercial_score: number | null
          created_at: string
          description: string | null
          emotional_score: number | null
          filename: string
          hashtags: Json | null
          height: number | null
          id: string
          instagram_caption: string | null
          is_top_10: boolean | null
          linkedin_caption: string | null
          overall_score: number | null
          score: number | null
          social_title: string | null
          status: string | null
          storage_path: string
          technical_score: number | null
          thumbnail_path: string | null
          tier: string | null
          twitter_caption: string | null
          updated_at: string
          user_id: string
          watermark_applied_at: string | null
          watermark_config: Json | null
          watermarked: boolean | null
          width: number | null
        }
        Insert: {
          ai_analysis?: string | null
          alt_text?: string | null
          artistic_score?: number | null
          capture_date?: string | null
          commercial_score?: number | null
          created_at?: string
          description?: string | null
          emotional_score?: number | null
          filename: string
          hashtags?: Json | null
          height?: number | null
          id?: string
          instagram_caption?: string | null
          is_top_10?: boolean | null
          linkedin_caption?: string | null
          overall_score?: number | null
          score?: number | null
          social_title?: string | null
          status?: string | null
          storage_path: string
          technical_score?: number | null
          thumbnail_path?: string | null
          tier?: string | null
          twitter_caption?: string | null
          updated_at?: string
          user_id: string
          watermark_applied_at?: string | null
          watermark_config?: Json | null
          watermarked?: boolean | null
          width?: number | null
        }
        Update: {
          ai_analysis?: string | null
          alt_text?: string | null
          artistic_score?: number | null
          capture_date?: string | null
          commercial_score?: number | null
          created_at?: string
          description?: string | null
          emotional_score?: number | null
          filename?: string
          hashtags?: Json | null
          height?: number | null
          id?: string
          instagram_caption?: string | null
          is_top_10?: boolean | null
          linkedin_caption?: string | null
          overall_score?: number | null
          score?: number | null
          social_title?: string | null
          status?: string | null
          storage_path?: string
          technical_score?: number | null
          thumbnail_path?: string | null
          tier?: string | null
          twitter_caption?: string | null
          updated_at?: string
          user_id?: string
          watermark_applied_at?: string | null
          watermark_config?: Json | null
          watermarked?: boolean | null
          width?: number | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          artistic_weight: number
          commercial_weight: number
          created_at: string
          emoji_preference: string
          emotional_weight: number
          id: string
          personality: string[]
          style: string
          technical_weight: number
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artistic_weight?: number
          commercial_weight?: number
          created_at?: string
          emoji_preference?: string
          emotional_weight?: number
          id?: string
          personality?: string[]
          style?: string
          technical_weight?: number
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artistic_weight?: number
          commercial_weight?: number
          created_at?: string
          emoji_preference?: string
          emotional_weight?: number
          id?: string
          personality?: string[]
          style?: string
          technical_weight?: number
          tone?: string
          updated_at?: string
          user_id?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
