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
          country_code: string
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
          country_code?: string
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
          country_code?: string
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
      follows: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      geo_cache: {
        Row: {
          city: string
          country_code: string
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
          country_code?: string
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
          country_code?: string
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
          photo_path: string | null
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
          photo_path?: string | null
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
          photo_path?: string | null
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
      member_reviews: {
        Row: {
          communication: number
          created_at: string
          id: string
          kindness: number
          meetup_id: string
          note: string
          punctuality: number
          reliability: number
          reviewee_id: string
          reviewer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          communication: number
          created_at?: string
          id?: string
          kindness: number
          meetup_id: string
          note?: string
          punctuality: number
          reliability: number
          reviewee_id: string
          reviewer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          communication?: number
          created_at?: string
          id?: string
          kindness?: number
          meetup_id?: string
          note?: string
          punctuality?: number
          reliability?: number
          reviewee_id?: string
          reviewer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_reviews_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "meetup_requests"
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
      ministry_type_follows: {
        Row: {
          created_at: string
          id: string
          ministry_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ministry_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ministry_type?: string
          user_id?: string
        }
        Relationships: []
      }
      neighborhood_videos: {
        Row: {
          city: string
          country_code: string
          created_at: string
          description: string
          duration_seconds: number
          id: string
          kind: string
          lat: number
          lng: number
          owner_id: string
          status: string
          thumbnail_path: string | null
          title: string
          updated_at: string
          video_path: string
          zip: string
        }
        Insert: {
          city?: string
          country_code?: string
          created_at?: string
          description?: string
          duration_seconds: number
          id?: string
          kind: string
          lat: number
          lng: number
          owner_id: string
          status?: string
          thumbnail_path?: string | null
          title: string
          updated_at?: string
          video_path: string
          zip?: string
        }
        Update: {
          city?: string
          country_code?: string
          created_at?: string
          description?: string
          duration_seconds?: number
          id?: string
          kind?: string
          lat?: number
          lng?: number
          owner_id?: string
          status?: string
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
          video_path?: string
          zip?: string
        }
        Relationships: []
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
          country_code: string
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
          country_code?: string
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
          country_code?: string
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
          country_code: string
          created_at: string
          display_name: string | null
          id: string
          is_demo: boolean
          onboarded_at: string | null
          show_ministries: boolean
          show_needs: boolean
          show_prayers: boolean
          suspended_at: string | null
          zip: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          city?: string
          country_code?: string
          created_at?: string
          display_name?: string | null
          id: string
          is_demo?: boolean
          onboarded_at?: string | null
          show_ministries?: boolean
          show_needs?: boolean
          show_prayers?: boolean
          suspended_at?: string | null
          zip?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          city?: string
          country_code?: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_demo?: boolean
          onboarded_at?: string | null
          show_ministries?: boolean
          show_needs?: boolean
          show_prayers?: boolean
          suspended_at?: string | null
          zip?: string
        }
        Relationships: []
      }
      room_memberships: {
        Row: {
          created_at: string
          hidden: boolean
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hidden?: boolean
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          hidden?: boolean
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "room_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      room_post_saves: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "room_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      room_posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          image_url: string | null
          media_path: string | null
          media_type: string | null
          parent_id: string | null
          room_id: string
          source_name: string | null
          source_url: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          media_path?: string | null
          media_type?: string | null
          parent_id?: string | null
          room_id: string
          source_name?: string | null
          source_url?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          media_path?: string | null
          media_type?: string | null
          parent_id?: string | null
          room_id?: string
          source_name?: string | null
          source_url?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "room_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_posts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string
          icon: string
          id: string
          in_default_feed: boolean
          pinned: boolean
          slug: string
          sort: number
          status: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          icon?: string
          id?: string
          in_default_feed?: boolean
          pinned?: boolean
          slug: string
          sort?: number
          status?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          icon?: string
          id?: string
          in_default_feed?: boolean
          pinned?: boolean
          slug?: string
          sort?: number
          status?: string
          title?: string
        }
        Relationships: []
      }
      shape_profiles: {
        Row: {
          answers: Json
          children: Json
          city: string
          country_code: string
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
          country_code?: string
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
          country_code?: string
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
      site_content: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      user_ministries: {
        Row: {
          avatar_url: string | null
          city: string
          country_code: string
          created_at: string
          description: string
          gallery: Json
          icon_id: string | null
          id: string
          lat: number | null
          lng: number | null
          motivation_ref: string | null
          motivation_text: string | null
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
          country_code?: string
          created_at?: string
          description: string
          gallery?: Json
          icon_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          motivation_ref?: string | null
          motivation_text?: string | null
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
          country_code?: string
          created_at?: string
          description?: string
          gallery?: Json
          icon_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          motivation_ref?: string | null
          motivation_text?: string | null
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
          country_code: string
          created_at: string
          description: string
          gallery: Json
          id: string
          lat: number | null
          lng: number | null
          met_at: string | null
          met_by: string | null
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
          country_code?: string
          created_at?: string
          description: string
          gallery?: Json
          id?: string
          lat?: number | null
          lng?: number | null
          met_at?: string | null
          met_by?: string | null
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
          country_code?: string
          created_at?: string
          description?: string
          gallery?: Json
          id?: string
          lat?: number | null
          lng?: number | null
          met_at?: string | null
          met_by?: string | null
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
      volunteer_projects: {
        Row: {
          city: string
          country_code: string
          created_at: string
          description: string
          id: string
          lat: number | null
          lng: number | null
          location: string
          owner_id: string
          starts_at: string
          status: string
          title: string
          updated_at: string
          zip: string
        }
        Insert: {
          city?: string
          country_code?: string
          created_at?: string
          description?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string
          owner_id: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
          zip?: string
        }
        Update: {
          city?: string
          country_code?: string
          created_at?: string
          description?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string
          owner_id?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          zip?: string
        }
        Relationships: []
      }
      volunteer_rsvps: {
        Row: {
          created_at: string
          id: string
          project_id: string
          signup_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          signup_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          signup_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_rsvps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "volunteer_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_rsvps_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "volunteer_signups"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_signups: {
        Row: {
          city: string
          country_code: string
          created_at: string
          display_name: string
          id: string
          is_demo: boolean
          user_id: string | null
          zip: string
        }
        Insert: {
          city?: string
          country_code?: string
          created_at?: string
          display_name?: string
          id?: string
          is_demo?: boolean
          user_id?: string | null
          zip?: string
        }
        Update: {
          city?: string
          country_code?: string
          created_at?: string
          display_name?: string
          id?: string
          is_demo?: boolean
          user_id?: string | null
          zip?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cms_user_emails: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      complete_user_need: {
        Args: {
          _helper_conversation_id: string
          _need_id: string
          _replies: Json
        }
        Returns: undefined
      }
      follower_count: { Args: { _id: string; _type: string }; Returns: number }
      get_site_activity_stats: { Args: never; Returns: Json }
      is_church_moderator: {
        Args: { _church_id: string; _user_id: string }
        Returns: boolean
      }
      is_suspended: { Args: { _user_id: string }; Returns: boolean }
      notify_followers: {
        Args: {
          _actor: string
          _body: string
          _id: string
          _link: string
          _title: string
          _type: string
        }
        Returns: undefined
      }
      reopen_user_need: { Args: { _need_id: string }; Returns: undefined }
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
