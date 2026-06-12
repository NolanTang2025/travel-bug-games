export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      user_archives: {
        Row: {
          id: string
          user_id: string
          title: string | null
          journal_text: string
          summary_json: Json | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          journal_text?: string
          summary_json?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          journal_text?: string
          summary_json?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      archive_media: {
        Row: {
          id: string
          archive_id: string
          user_id: string
          storage_path: string
          sort_order: number
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          archive_id: string
          user_id: string
          storage_path: string
          sort_order?: number
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          archive_id?: string
          user_id?: string
          storage_path?: string
          sort_order?: number
          caption?: string | null
          created_at?: string
        }
      }
      twin_personas: {
        Row: {
          id: string
          user_id: string
          archive_id: string
          display_name: string
          bio_short: string | null
          system_prompt: string
          traits_json: Json
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          archive_id: string
          display_name: string
          bio_short?: string | null
          system_prompt: string
          traits_json?: Json
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          archive_id?: string
          display_name?: string
          bio_short?: string | null
          system_prompt?: string
          traits_json?: Json
          is_active?: boolean
          created_at?: string
        }
      }
      slack_connections_safe: {
        Row: {
          id: string
          user_id: string
          team_id: string
          team_name: string | null
          slack_user_id: string
          scopes: string | null
          connected_at: string
        }
        Insert: Record<string, never>
        Update: Record<string, never>
      }
      slack_connections: {
        Row: {
          id: string
          user_id: string
          team_id: string
          team_name: string | null
          slack_user_id: string
          access_token: string
          scopes: string | null
          connected_at: string
        }
        Insert: {
          id?: string
          user_id: string
          team_id: string
          team_name?: string | null
          slack_user_id: string
          access_token: string
          scopes?: string | null
          connected_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string
          team_name?: string | null
          slack_user_id?: string
          access_token?: string
          scopes?: string | null
          connected_at?: string
        }
      }
      slack_drafts: {
        Row: {
          id: string
          user_id: string
          persona_id: string | null
          team_id: string
          channel_id: string
          thread_ts: string | null
          trigger_text: string
          draft_text: string
          status: string
          slack_message_ts: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          persona_id?: string | null
          team_id: string
          channel_id: string
          thread_ts?: string | null
          trigger_text?: string
          draft_text?: string
          status?: string
          slack_message_ts?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          persona_id?: string | null
          team_id?: string
          channel_id?: string
          thread_ts?: string | null
          trigger_text?: string
          draft_text?: string
          status?: string
          slack_message_ts?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      play_danmaku: {
        Row: {
          id: string
          message: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          message: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          message?: string
          color?: string
          created_at?: string
        }
      }
      community_games: {
        Row: {
          id: string
          user_id: string
          archive_id: string | null
          title: string
          author_name: string | null
          tagline: string | null
          template_id: string | null
          engine: string | null
          spec: Json
          cover_path: string | null
          upvote_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          archive_id?: string | null
          title: string
          author_name?: string | null
          tagline?: string | null
          template_id?: string | null
          engine?: string | null
          spec?: Json
          cover_path?: string | null
          upvote_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          archive_id?: string | null
          title?: string
          author_name?: string | null
          tagline?: string | null
          template_id?: string | null
          engine?: string | null
          spec?: Json
          cover_path?: string | null
          upvote_count?: number
          created_at?: string
        }
      }
      community_game_upvotes: {
        Row: {
          game_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          game_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          game_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
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
