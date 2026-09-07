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
      application_documents: {
        Row: {
          application_id: string
          document_id: string
          is_demo: boolean
          user_id: string | null
        }
        Insert: {
          application_id: string
          document_id: string
          is_demo?: boolean
          user_id?: string | null
        }
        Update: {
          application_id?: string
          document_id?: string
          is_demo?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      application_events: {
        Row: {
          application_id: string
          created_at: string
          detail: string | null
          from_stage: Database["public"]["Enums"]["app_stage"] | null
          id: string
          is_demo: boolean
          occurred_at: string
          title: string
          to_stage: Database["public"]["Enums"]["app_stage"] | null
          user_id: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          detail?: string | null
          from_stage?: Database["public"]["Enums"]["app_stage"] | null
          id?: string
          is_demo?: boolean
          occurred_at?: string
          title: string
          to_stage?: Database["public"]["Enums"]["app_stage"] | null
          user_id?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          detail?: string | null
          from_stage?: Database["public"]["Enums"]["app_stage"] | null
          id?: string
          is_demo?: boolean
          occurred_at?: string
          title?: string
          to_stage?: Database["public"]["Enums"]["app_stage"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string | null
          archived: boolean
          company_id: string | null
          created_at: string
          currency: string
          description: string | null
          excitement: number
          id: string
          is_demo: boolean
          job_url: string | null
          location: string | null
          next_action: string | null
          next_action_at: string | null
          priority: string
          role_title: string
          salary_max: number | null
          salary_min: number | null
          source: string | null
          stage: Database["public"]["Enums"]["app_stage"]
          updated_at: string
          user_id: string | null
          work_mode: Database["public"]["Enums"]["work_mode"] | null
        }
        Insert: {
          applied_at?: string | null
          archived?: boolean
          company_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          excitement?: number
          id?: string
          is_demo?: boolean
          job_url?: string | null
          location?: string | null
          next_action?: string | null
          next_action_at?: string | null
          priority?: string
          role_title: string
          salary_max?: number | null
          salary_min?: number | null
          source?: string | null
          stage?: Database["public"]["Enums"]["app_stage"]
          updated_at?: string
          user_id?: string | null
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
        }
        Update: {
          applied_at?: string | null
          archived?: boolean
          company_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          excitement?: number
          id?: string
          is_demo?: boolean
          job_url?: string | null
          location?: string | null
          next_action?: string | null
          next_action_at?: string | null
          priority?: string
          role_title?: string
          salary_max?: number | null
          salary_min?: number | null
          source?: string | null
          stage?: Database["public"]["Enums"]["app_stage"]
          updated_at?: string
          user_id?: string | null
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          application_id: string | null
          created_at: string
          duration_min: number
          id: string
          is_demo: boolean
          kind: Database["public"]["Enums"]["event_kind"]
          location: string | null
          notes: string | null
          starts_at: string
          title: string
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          duration_min?: number
          id?: string
          is_demo?: boolean
          kind?: Database["public"]["Enums"]["event_kind"]
          location?: string | null
          notes?: string | null
          starts_at: string
          title: string
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          duration_min?: number
          id?: string
          is_demo?: boolean
          kind?: Database["public"]["Enums"]["event_kind"]
          location?: string | null
          notes?: string | null
          starts_at?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          is_demo: boolean
          location: string | null
          logo_hint: string | null
          name: string
          notes: string | null
          size: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          is_demo?: boolean
          location?: string | null
          logo_hint?: string | null
          name: string
          notes?: string | null
          size?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          is_demo?: boolean
          location?: string | null
          logo_hint?: string | null
          name?: string
          notes?: string | null
          size?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          is_demo: boolean
          linkedin: string | null
          name: string
          notes: string | null
          phone: string | null
          role_title: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          linkedin?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role_title?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          linkedin?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role_title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          is_demo: boolean
          kind: Database["public"]["Enums"]["doc_kind"]
          mime_type: string | null
          name: string
          size_bytes: number | null
          storage_path: string | null
          tags: string[]
          user_id: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_demo?: boolean
          kind?: Database["public"]["Enums"]["doc_kind"]
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          storage_path?: string | null
          tags?: string[]
          user_id?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_demo?: boolean
          kind?: Database["public"]["Enums"]["doc_kind"]
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          storage_path?: string | null
          tags?: string[]
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          application_id: string | null
          body: string
          company_id: string | null
          created_at: string
          id: string
          is_demo: boolean
          pinned: boolean
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          body: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          pinned?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          body?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          pinned?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          headline: string | null
          id: string
          location: string | null
          target_role: string | null
          updated_at: string
          weekly_goal: number
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id: string
          location?: string | null
          target_role?: string | null
          updated_at?: string
          weekly_goal?: number
        }
        Update: {
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id?: string
          location?: string | null
          target_role?: string | null
          updated_at?: string
          weekly_goal?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          application_id: string | null
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          is_demo: boolean
          priority: string
          title: string
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          is_demo?: boolean
          priority?: string
          title: string
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          is_demo?: boolean
          priority?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_stage:
        | "saved"
        | "applied"
        | "screening"
        | "interview"
        | "technical"
        | "final"
        | "offer"
        | "rejected"
        | "withdrawn"
      doc_kind: "cv" | "cover_letter" | "portfolio" | "certificate" | "other"
      event_kind:
        | "interview"
        | "call"
        | "test"
        | "deadline"
        | "followup"
        | "other"
      work_mode: "onsite" | "hybrid" | "remote"
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
      app_stage: [
        "saved",
        "applied",
        "screening",
        "interview",
        "technical",
        "final",
        "offer",
        "rejected",
        "withdrawn",
      ],
      doc_kind: ["cv", "cover_letter", "portfolio", "certificate", "other"],
      event_kind: [
        "interview",
        "call",
        "test",
        "deadline",
        "followup",
        "other",
      ],
      work_mode: ["onsite", "hybrid", "remote"],
    },
  },
} as const
