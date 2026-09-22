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
      abuse_reports: {
        Row: {
          admin_notes: string
          created_at: string
          details: string
          id: string
          reason: string
          reporter_email: string
          reporter_id: string | null
          status: string
          target_id: string | null
          target_type: string
          tracking_code: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string
          created_at?: string
          details: string
          id?: string
          reason: string
          reporter_email?: string
          reporter_id?: string | null
          status?: string
          target_id?: string | null
          target_type?: string
          tracking_code: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string
          created_at?: string
          details?: string
          id?: string
          reason?: string
          reporter_email?: string
          reporter_id?: string | null
          status?: string
          target_id?: string | null
          target_type?: string
          tracking_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_feedback: {
        Row: {
          additions: string
          changes: string
          created_at: string
          design_rating: number | null
          ease_rating: number | null
          email: string
          id: string
          likes: string
          overall_rating: number
          speed_rating: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          additions?: string
          changes?: string
          created_at?: string
          design_rating?: number | null
          ease_rating?: number | null
          email?: string
          id?: string
          likes?: string
          overall_rating: number
          speed_rating?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          additions?: string
          changes?: string
          created_at?: string
          design_rating?: number | null
          ease_rating?: number | null
          email?: string
          id?: string
          likes?: string
          overall_rating?: number
          speed_rating?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      church_members: {
        Row: {
          added_by: string | null
          church_id: string
          created_at: string
          id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          church_id: string
          created_at?: string
          id?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          church_id?: string
          created_at?: string
          id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_members_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      church_payments: {
        Row: {
          amount_cents: number
          church_id: string
          created_at: string
          id: string
          is_mock: boolean
          payer_id: string
          status: string
        }
        Insert: {
          amount_cents?: number
          church_id: string
          created_at?: string
          id?: string
          is_mock?: boolean
          payer_id: string
          status?: string
        }
        Update: {
          amount_cents?: number
          church_id?: string
          created_at?: string
          id?: string
          is_mock?: boolean
          payer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_payments_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      church_posts: {
        Row: {
          church_id: string
          created_at: string
          id: string
          post_id: string
          post_type: Database["public"]["Enums"]["post_kind"]
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          church_id: string
          created_at?: string
          id?: string
          post_id: string
          post_type: Database["public"]["Enums"]["post_kind"]
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          church_id?: string
          created_at?: string
          id?: string
          post_id?: string
          post_type?: Database["public"]["Enums"]["post_kind"]
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_posts_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      church_prayer_views: {
        Row: {
          church_id: string
          created_at: string
          id: string
          last_seen_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          church_id: string
          created_at?: string
          id?: string
          last_seen_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          church_id?: string
          created_at?: string
          id?: string
          last_seen_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_prayer_views_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      churches: {
        Row: {
          address: string
          avatar_url: string | null
          city: string
          created_at: string
          current_period_end: string | null
          description: string
          gallery: Json
          icon_id: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          owner_id: string
          phone: string
          plan_status: string
          service_times: string
          status: string
          updated_at: string
          website: string
          zip: string
        }
        Insert: {
          address?: string
          avatar_url?: string | null
          city?: string
          created_at?: string
          current_period_end?: string | null
          description?: string
          gallery?: Json
          icon_id?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          owner_id: string
          phone?: string
          plan_status?: string
          service_times?: string
          status?: string
          updated_at?: string
          website?: string
          zip?: string
        }
        Update: {
          address?: string
          avatar_url?: string | null
          city?: string
          created_at?: string
          current_period_end?: string | null
          description?: string
          gallery?: Json
          icon_id?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string
          phone?: string
          plan_status?: string
          service_times?: string
          status?: string
          updated_at?: string
          website?: string
          zip?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          post_id: string | null
          post_type: Database["public"]["Enums"]["post_kind"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          post_id?: string | null
          post_type?: Database["public"]["Enums"]["post_kind"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          post_id?: string | null
          post_type?: Database["public"]["Enums"]["post_kind"] | null
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          post_id: string
          post_type: Database["public"]["Enums"]["post_kind"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          post_type: Database["public"]["Enums"]["post_kind"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          post_type?: Database["public"]["Enums"]["post_kind"]
          user_id?: string
        }
        Relationships: []
      }
      feedback_replies: {
        Row: {
          body: string
          created_at: string
          delivered: boolean
          error: string | null
          feedback_id: string
          id: string
          sender_id: string
          subject: string
          to_email: string
        }
        Insert: {
          body: string
          created_at?: string
          delivered?: boolean
          error?: string | null
          feedback_id: string
          id?: string
          sender_id: string
          subject: string
          to_email: string
        }
        Update: {
          body?: string
          created_at?: string
          delivered?: boolean
          error?: string | null
          feedback_id?: string
          id?: string
          sender_id?: string
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_replies_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "app_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_cache: {
        Row: {
          city: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          place_key: string
          updated_at: string
          zip: string
        }
        Insert: {
          city?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          place_key: string
          updated_at?: string
          zip?: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          place_key?: string
          updated_at?: string
          zip?: string
        }
        Relationships: []
      }
      gift_references: {
        Row: {
          code: string
          contact_name: string
          created_at: string
          gifts: Json
          id: string
          note: string
          owner_id: string
          responded_at: string | null
          updated_at: string
        }
        Insert: {
          code?: string
          contact_name?: string
          created_at?: string
          gifts?: Json
          id?: string
          note?: string
          owner_id: string
          responded_at?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          contact_name?: string
          created_at?: string
          gifts?: Json
          id?: string
          note?: string
          owner_id?: string
          responded_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meetup_requests: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          location: string
          meet_at: string
          recipient_id: string
          reminder_sent_at: string | null
          requester_id: string
          response_note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location: string
          meet_at: string
          recipient_id: string
          reminder_sent_at?: string | null
          requester_id: string
          response_note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string
          meet_at?: string
          recipient_id?: string
          reminder_sent_at?: string | null
          requester_id?: string
          response_note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetup_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          link: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind: string
          link?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          post_type: Database["public"]["Enums"]["post_kind"]
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          post_type: Database["public"]["Enums"]["post_kind"]
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          post_type?: Database["public"]["Enums"]["post_kind"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          kind: string
          post_id: string
          post_type: Database["public"]["Enums"]["post_kind"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          post_id: string
          post_type: Database["public"]["Enums"]["post_kind"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          post_id?: string
          post_type?: Database["public"]["Enums"]["post_kind"]
          user_id?: string
        }
        Relationships: []
      }
      post_translations: {
        Row: {
          content_hash: string
          created_at: string
          id: string
          lang: string
          translated: string
        }
        Insert: {
          content_hash: string
          created_at?: string
          id?: string
          lang: string
          translated: string
        }
        Update: {
          content_hash?: string
          created_at?: string
          id?: string
          lang?: string
          translated?: string
        }
        Relationships: []
      }
      prayers: {
        Row: {
          anonymous: boolean
          body: string
          church_id: string | null
          city: string
          created_at: string
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          owner_id: string
          short_title: string
          status: string
          updated_at: string
          zip: string
        }
        Insert: {
          anonymous?: boolean
          body?: string
          church_id?: string | null
          city?: string
          created_at?: string
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          owner_id: string
          short_title?: string
          status?: string
          updated_at?: string
          zip?: string
        }
        Update: {
          anonymous?: boolean
          body?: string
          church_id?: string | null
          city?: string
          created_at?: string
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          owner_id?: string
          short_title?: string
          status?: string
          updated_at?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayers_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          city: string
          created_at: string
          display_name: string | null
          id: string
          is_demo: boolean
          onboarded_at: string | null
          zip: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          city?: string
          created_at?: string
          display_name?: string | null
          id: string
          is_demo?: boolean
          onboarded_at?: string | null
          zip?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          city?: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_demo?: boolean
          onboarded_at?: string | null
          zip?: string
        }
        Relationships: []
      }
      shape_profiles: {
        Row: {
          answers: Json
          children: Json
          city: string
          created_at: string
          free_talk: string
          id: string
          owner_id: string
          transcripts: Json
          updated_at: string
          zip: string
        }
        Insert: {
          answers?: Json
          children?: Json
          city?: string
          created_at?: string
          free_talk?: string
          id?: string
          owner_id: string
          transcripts?: Json
          updated_at?: string
          zip?: string
        }
        Update: {
          answers?: Json
          children?: Json
          city?: string
          created_at?: string
          free_talk?: string
          id?: string
          owner_id?: string
          transcripts?: Json
          updated_at?: string
          zip?: string
        }
        Relationships: []
      }
      shape_suggestions: {
        Row: {
          created_at: string
          id: string
          ideas: Json
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ideas?: Json
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ideas?: Json
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_ministries: {
        Row: {
          avatar_url: string | null
          city: string
          created_at: string
          description: string
          gallery: Json
          icon_id: string | null
          id: string
          lat: number | null
          lng: number | null
          owner_id: string
          short_title: string
          status: string
          title: string | null
          updated_at: string
          zip: string
        }
        Insert: {
          avatar_url?: string | null
          city: string
          created_at?: string
          description: string
          gallery?: Json
          icon_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          owner_id: string
          short_title: string
          status?: string
          title?: string | null
          updated_at?: string
          zip?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string
          created_at?: string
          description?: string
          gallery?: Json
          icon_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          owner_id?: string
          short_title?: string
          status?: string
          title?: string | null
          updated_at?: string
          zip?: string
        }
        Relationships: []
      }
      user_needs: {
        Row: {
          avatar_url: string | null
          category: string | null
          city: string
          created_at: string
          description: string
          gallery: Json
          id: string
          lat: number | null
          lng: number | null
          owner_id: string
          short_title: string
          status: string
          title: string | null
          updated_at: string
          zip: string
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          city?: string
          created_at?: string
          description: string
          gallery?: Json
          id?: string
          lat?: number | null
          lng?: number | null
          owner_id: string
          short_title: string
          status?: string
          title?: string | null
          updated_at?: string
          zip?: string
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          city?: string
          created_at?: string
          description?: string
          gallery?: Json
          id?: string
          lat?: number | null
          lng?: number | null
          owner_id?: string
          short_title?: string
          status?: string
          title?: string | null
          updated_at?: string
          zip?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_church_moderator: {
        Args: { _church_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      post_kind: "ministry" | "need" | "prayer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      post_kind: ["ministry", "need", "prayer"],
    },
  },
} as const
