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
      connected_providers: {
        Row: {
          access_token: string | null
          analyzed_count: number | null
          auto_sync_frequency: string | null
          connected_at: string | null
          created_at: string | null
          display_name: string | null
          id: string
          last_sync: string | null
          photo_count: number | null
          provider: string
          refresh_token: string | null
          settings: Json | null
          sync_enabled: boolean | null
          token_expiry: string | null
          updated_at: string | null
          user_id: string
          vault_worthy_count: number | null
        }
        Insert: {
          access_token?: string | null
          analyzed_count?: number | null
          auto_sync_frequency?: string | null
          connected_at?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          last_sync?: string | null
          photo_count?: number | null
          provider: string
          refresh_token?: string | null
          settings?: Json | null
          sync_enabled?: boolean | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id: string
          vault_worthy_count?: number | null
        }
        Update: {
          access_token?: string | null
          analyzed_count?: number | null
          auto_sync_frequency?: string | null
          connected_at?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          last_sync?: string | null
          photo_count?: number | null
          provider?: string
          refresh_token?: string | null
          settings?: Json | null
          sync_enabled?: boolean | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string
          vault_worthy_count?: number | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          ai_analysis: string | null
          alt_text: string | null
          analyzed_at: string | null
          artistic_score: number | null
          camera_data: Json | null
          capture_date: string | null
          commercial_score: number | null
          created_at: string
          custom_tags: string[] | null
          date_taken: string | null
          description: string | null
          edited_at: string | null
          edited_storage_path: string | null
          emotional_score: number | null
          external_id: string | null
          featured_order: number | null
          file_hash: string | null
          file_size: number | null
          filename: string
          hashtags: Json | null
          height: number | null
          hero_order: number | null
          highlight_reel_order: number | null
          highlight_reel_preset: string | null
          id: string
          instagram_caption: string | null
          is_favorite: boolean | null
          is_featured: boolean | null
          is_hero: boolean | null
          is_highlight_reel: boolean | null
          is_top_10: boolean | null
          linkedin_caption: string | null
          location_data: Json | null
          mime_type: string | null
          orientation: string | null
          overall_score: number | null
          provider: string | null
          provider_id: string | null
          provider_metadata: Json | null
          score: number | null
          social_title: string | null
          source_url: string | null
          status: string | null
          storage_path: string
          technical_score: number | null
          thumbnail_path: string | null
          tier: string | null
          twitter_caption: string | null
          updated_at: string
          user_id: string
          user_notes: string | null
          watermark_applied_at: string | null
          watermark_config: Json | null
          watermarked: boolean | null
          width: number | null
        }
        Insert: {
          ai_analysis?: string | null
          alt_text?: string | null
          analyzed_at?: string | null
          artistic_score?: number | null
          camera_data?: Json | null
          capture_date?: string | null
          commercial_score?: number | null
          created_at?: string
          custom_tags?: string[] | null
          date_taken?: string | null
          description?: string | null
          edited_at?: string | null
          edited_storage_path?: string | null
          emotional_score?: number | null
          external_id?: string | null
          featured_order?: number | null
          file_hash?: string | null
          file_size?: number | null
          filename: string
          hashtags?: Json | null
          height?: number | null
          hero_order?: number | null
          highlight_reel_order?: number | null
          highlight_reel_preset?: string | null
          id?: string
          instagram_caption?: string | null
          is_favorite?: boolean | null
          is_featured?: boolean | null
          is_hero?: boolean | null
          is_highlight_reel?: boolean | null
          is_top_10?: boolean | null
          linkedin_caption?: string | null
          location_data?: Json | null
          mime_type?: string | null
          orientation?: string | null
          overall_score?: number | null
          provider?: string | null
          provider_id?: string | null
          provider_metadata?: Json | null
          score?: number | null
          social_title?: string | null
          source_url?: string | null
          status?: string | null
          storage_path: string
          technical_score?: number | null
          thumbnail_path?: string | null
          tier?: string | null
          twitter_caption?: string | null
          updated_at?: string
          user_id: string
          user_notes?: string | null
          watermark_applied_at?: string | null
          watermark_config?: Json | null
          watermarked?: boolean | null
          width?: number | null
        }
        Update: {
          ai_analysis?: string | null
          alt_text?: string | null
          analyzed_at?: string | null
          artistic_score?: number | null
          camera_data?: Json | null
          capture_date?: string | null
          commercial_score?: number | null
          created_at?: string
          custom_tags?: string[] | null
          date_taken?: string | null
          description?: string | null
          edited_at?: string | null
          edited_storage_path?: string | null
          emotional_score?: number | null
          external_id?: string | null
          featured_order?: number | null
          file_hash?: string | null
          file_size?: number | null
          filename?: string
          hashtags?: Json | null
          height?: number | null
          hero_order?: number | null
          highlight_reel_order?: number | null
          highlight_reel_preset?: string | null
          id?: string
          instagram_caption?: string | null
          is_favorite?: boolean | null
          is_featured?: boolean | null
          is_hero?: boolean | null
          is_highlight_reel?: boolean | null
          is_top_10?: boolean | null
          linkedin_caption?: string | null
          location_data?: Json | null
          mime_type?: string | null
          orientation?: string | null
          overall_score?: number | null
          provider?: string | null
          provider_id?: string | null
          provider_metadata?: Json | null
          score?: number | null
          social_title?: string | null
          source_url?: string | null
          status?: string | null
          storage_path?: string
          technical_score?: number | null
          thumbnail_path?: string | null
          tier?: string | null
          twitter_caption?: string | null
          updated_at?: string
          user_id?: string
          user_notes?: string | null
          watermark_applied_at?: string | null
          watermark_config?: Json | null
          watermarked?: boolean | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "connected_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string | null
          lens_profile: Json | null
          lens_story: string | null
          lens_updated_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name: string
          id: string
          last_name?: string | null
          lens_profile?: Json | null
          lens_story?: string | null
          lens_updated_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string | null
          lens_profile?: Json | null
          lens_story?: string | null
          lens_updated_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_jobs: {
        Row: {
          archived_found: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          estimated_completion: string | null
          filters: Json | null
          high_value_found: number | null
          id: string
          last_error_at: string | null
          processed_photos: number | null
          provider_id: string
          retry_count: number | null
          started_at: string | null
          status: string | null
          total_photos: number | null
          updated_at: string | null
          user_id: string
          vault_worthy_found: number | null
        }
        Insert: {
          archived_found?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_completion?: string | null
          filters?: Json | null
          high_value_found?: number | null
          id?: string
          last_error_at?: string | null
          processed_photos?: number | null
          provider_id: string
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          total_photos?: number | null
          updated_at?: string | null
          user_id: string
          vault_worthy_found?: number | null
        }
        Update: {
          archived_found?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_completion?: string | null
          filters?: Json | null
          high_value_found?: number | null
          id?: string
          last_error_at?: string | null
          processed_photos?: number | null
          provider_id?: string
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          total_photos?: number | null
          updated_at?: string | null
          user_id?: string
          vault_worthy_found?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_jobs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "connected_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          artistic_weight: number
          auto_analyze_uploads: boolean | null
          auto_generate_captions: boolean | null
          commercial_weight: number
          created_at: string
          emoji_preference: string
          emotional_weight: number
          id: string
          notification_preferences: Json | null
          personality: string[]
          style: string
          technical_weight: number
          tone: string
          updated_at: string
          user_id: string
          vault_quality_threshold: number
        }
        Insert: {
          artistic_weight?: number
          auto_analyze_uploads?: boolean | null
          auto_generate_captions?: boolean | null
          commercial_weight?: number
          created_at?: string
          emoji_preference?: string
          emotional_weight?: number
          id?: string
          notification_preferences?: Json | null
          personality?: string[]
          style?: string
          technical_weight?: number
          tone?: string
          updated_at?: string
          user_id: string
          vault_quality_threshold?: number
        }
        Update: {
          artistic_weight?: number
          auto_analyze_uploads?: boolean | null
          auto_generate_captions?: boolean | null
          commercial_weight?: number
          created_at?: string
          emoji_preference?: string
          emotional_weight?: number
          id?: string
          notification_preferences?: Json | null
          personality?: string[]
          style?: string
          technical_weight?: number
          tone?: string
          updated_at?: string
          user_id?: string
          vault_quality_threshold?: number
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
