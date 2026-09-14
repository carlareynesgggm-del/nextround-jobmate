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
      activity_feed: {
        Row: {
          application_id: string | null
          created_at: string
          detail: string | null
          email_event_id: string | null
          id: string
          kind: string
          occurred_at: string
          source: string
          title: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          detail?: string | null
          email_event_id?: string | null
          id?: string
          kind: string
          occurred_at?: string
          source?: string
          title: string
          user_id?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          detail?: string | null
          email_event_id?: string | null
          id?: string
          kind?: string
          occurred_at?: string
          source?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_email_event_id_fkey"
            columns: ["email_event_id"]
            isOneToOne: false
            referencedRelation: "email_events"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          application_id: string | null
          category: string
          created_at: string
          detail: string | null
          due_at: string | null
          email_event_id: string | null
          id: string
          priority: string
          read: boolean
          resolved: boolean
          title: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          category: string
          created_at?: string
          detail?: string | null
          due_at?: string | null
          email_event_id?: string | null
          id?: string
          priority?: string
          read?: boolean
          resolved?: boolean
          title: string
          user_id?: string
        }
        Update: {
          application_id?: string | null
          category?: string
          created_at?: string
          detail?: string | null
          due_at?: string | null
          email_event_id?: string | null
          id?: string
          priority?: string
          read?: boolean
          resolved?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_email_event_id_fkey"
            columns: ["email_event_id"]
            isOneToOne: false
            referencedRelation: "email_events"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          document_id: string
          is_demo: boolean
          note: string | null
          role: string | null
          submitted: boolean
          user_id: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          document_id: string
          is_demo?: boolean
          note?: string | null
          role?: string | null
          submitted?: boolean
          user_id?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          document_id?: string
          is_demo?: boolean
          note?: string | null
          role?: string | null
          submitted?: boolean
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
          assessment_url: string | null
          attachments: string[]
          created_at: string
          deadline_at: string | null
          detail: string | null
          duration_min: number | null
          expected_response_at: string | null
          from_stage: Database["public"]["Enums"]["app_stage"] | null
          id: string
          instructions: string | null
          interviewer: string | null
          interviewer_email: string | null
          interviewer_linkedin: string | null
          interviewer_role: string | null
          is_demo: boolean
          kind: Database["public"]["Enums"]["event_kind"] | null
          location: string | null
          meeting_url: string | null
          next_steps: string | null
          occurred_at: string
          outcome: string | null
          position: number
          prep_notes: string | null
          provider: string | null
          questions_asked: string | null
          salary_mentioned: string | null
          scheduled_at: string | null
          stage: Database["public"]["Enums"]["app_stage"] | null
          stage_type: string | null
          status: string
          timezone: string | null
          title: string
          to_stage: Database["public"]["Enums"]["app_stage"] | null
          user_id: string | null
          went_poorly: string | null
          went_well: string | null
        }
        Insert: {
          application_id: string
          assessment_url?: string | null
          attachments?: string[]
          created_at?: string
          deadline_at?: string | null
          detail?: string | null
          duration_min?: number | null
          expected_response_at?: string | null
          from_stage?: Database["public"]["Enums"]["app_stage"] | null
          id?: string
          instructions?: string | null
          interviewer?: string | null
          interviewer_email?: string | null
          interviewer_linkedin?: string | null
          interviewer_role?: string | null
          is_demo?: boolean
          kind?: Database["public"]["Enums"]["event_kind"] | null
          location?: string | null
          meeting_url?: string | null
          next_steps?: string | null
          occurred_at?: string
          outcome?: string | null
          position?: number
          prep_notes?: string | null
          provider?: string | null
          questions_asked?: string | null
          salary_mentioned?: string | null
          scheduled_at?: string | null
          stage?: Database["public"]["Enums"]["app_stage"] | null
          stage_type?: string | null
          status?: string
          timezone?: string | null
          title: string
          to_stage?: Database["public"]["Enums"]["app_stage"] | null
          user_id?: string | null
          went_poorly?: string | null
          went_well?: string | null
        }
        Update: {
          application_id?: string
          assessment_url?: string | null
          attachments?: string[]
          created_at?: string
          deadline_at?: string | null
          detail?: string | null
          duration_min?: number | null
          expected_response_at?: string | null
          from_stage?: Database["public"]["Enums"]["app_stage"] | null
          id?: string
          instructions?: string | null
          interviewer?: string | null
          interviewer_email?: string | null
          interviewer_linkedin?: string | null
          interviewer_role?: string | null
          is_demo?: boolean
          kind?: Database["public"]["Enums"]["event_kind"] | null
          location?: string | null
          meeting_url?: string | null
          next_steps?: string | null
          occurred_at?: string
          outcome?: string | null
          position?: number
          prep_notes?: string | null
          provider?: string | null
          questions_asked?: string | null
          salary_mentioned?: string | null
          scheduled_at?: string | null
          stage?: Database["public"]["Enums"]["app_stage"] | null
          stage_type?: string | null
          status?: string
          timezone?: string | null
          title?: string
          to_stage?: Database["public"]["Enums"]["app_stage"] | null
          user_id?: string | null
          went_poorly?: string | null
          went_well?: string | null
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
          academic_credits: string | null
          application_plan: string | null
          application_ref: string | null
          application_type: string | null
          applied_at: string | null
          archived: boolean
          availability: string | null
          candidate_portal_url: string | null
          company_id: string | null
          country: string | null
          created_at: string
          currency: string
          deadline_at: string | null
          degree_requirement: string | null
          description: string | null
          duration_months: number | null
          employment_type: string | null
          end_date: string | null
          excitement: number
          gpa_requirement: string | null
          id: string
          is_demo: boolean
          jd_benefits: string | null
          jd_preferred: string | null
          jd_requirements: string | null
          jd_responsibilities: string | null
          jd_salary_text: string | null
          jd_saved_at: string | null
          jd_skills: string[]
          job_ref: string | null
          job_url: string | null
          language_requirements: string | null
          location: string | null
          next_action: string | null
          next_action_at: string | null
          offer_benefits: string | null
          offer_bonus: string | null
          offer_currency: string | null
          offer_deadline_at: string | null
          offer_decision: string | null
          offer_equity: string | null
          offer_rating: number | null
          offer_salary: number | null
          offer_start_date: string | null
          portal_notes: string | null
          portal_password_ref: string | null
          portal_provider: string | null
          portal_username: string | null
          priority: string
          referral_name: string | null
          relocation_support: boolean | null
          role_title: string
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          source: string | null
          stage: Database["public"]["Enums"]["app_stage"]
          start_date: string | null
          timezone: string | null
          university_agreement: boolean | null
          updated_at: string
          user_id: string | null
          visa_sponsorship: boolean | null
          why_interested: string | null
          work_authorisation: string | null
          work_mode: Database["public"]["Enums"]["work_mode"] | null
        }
        Insert: {
          academic_credits?: string | null
          application_plan?: string | null
          application_ref?: string | null
          application_type?: string | null
          applied_at?: string | null
          archived?: boolean
          availability?: string | null
          candidate_portal_url?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          deadline_at?: string | null
          degree_requirement?: string | null
          description?: string | null
          duration_months?: number | null
          employment_type?: string | null
          end_date?: string | null
          excitement?: number
          gpa_requirement?: string | null
          id?: string
          is_demo?: boolean
          jd_benefits?: string | null
          jd_preferred?: string | null
          jd_requirements?: string | null
          jd_responsibilities?: string | null
          jd_salary_text?: string | null
          jd_saved_at?: string | null
          jd_skills?: string[]
          job_ref?: string | null
          job_url?: string | null
          language_requirements?: string | null
          location?: string | null
          next_action?: string | null
          next_action_at?: string | null
          offer_benefits?: string | null
          offer_bonus?: string | null
          offer_currency?: string | null
          offer_deadline_at?: string | null
          offer_decision?: string | null
          offer_equity?: string | null
          offer_rating?: number | null
          offer_salary?: number | null
          offer_start_date?: string | null
          portal_notes?: string | null
          portal_password_ref?: string | null
          portal_provider?: string | null
          portal_username?: string | null
          priority?: string
          referral_name?: string | null
          relocation_support?: boolean | null
          role_title: string
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["app_stage"]
          start_date?: string | null
          timezone?: string | null
          university_agreement?: boolean | null
          updated_at?: string
          user_id?: string | null
          visa_sponsorship?: boolean | null
          why_interested?: string | null
          work_authorisation?: string | null
          work_mode?: Database["public"]["Enums"]["work_mode"] | null
        }
        Update: {
          academic_credits?: string | null
          application_plan?: string | null
          application_ref?: string | null
          application_type?: string | null
          applied_at?: string | null
          archived?: boolean
          availability?: string | null
          candidate_portal_url?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          deadline_at?: string | null
          degree_requirement?: string | null
          description?: string | null
          duration_months?: number | null
          employment_type?: string | null
          end_date?: string | null
          excitement?: number
          gpa_requirement?: string | null
          id?: string
          is_demo?: boolean
          jd_benefits?: string | null
          jd_preferred?: string | null
          jd_requirements?: string | null
          jd_responsibilities?: string | null
          jd_salary_text?: string | null
          jd_saved_at?: string | null
          jd_skills?: string[]
          job_ref?: string | null
          job_url?: string | null
          language_requirements?: string | null
          location?: string | null
          next_action?: string | null
          next_action_at?: string | null
          offer_benefits?: string | null
          offer_bonus?: string | null
          offer_currency?: string | null
          offer_deadline_at?: string | null
          offer_decision?: string | null
          offer_equity?: string | null
          offer_rating?: number | null
          offer_salary?: number | null
          offer_start_date?: string | null
          portal_notes?: string | null
          portal_password_ref?: string | null
          portal_provider?: string | null
          portal_username?: string | null
          priority?: string
          referral_name?: string | null
          relocation_support?: boolean | null
          role_title?: string
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["app_stage"]
          start_date?: string | null
          timezone?: string | null
          university_agreement?: boolean | null
          updated_at?: string
          user_id?: string | null
          visa_sponsorship?: boolean | null
          why_interested?: string | null
          work_authorisation?: string | null
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
          application_id: string | null
          company_id: string | null
          contact_type: string | null
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
          application_id?: string | null
          company_id?: string | null
          contact_type?: string | null
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
          application_id?: string | null
          company_id?: string | null
          contact_type?: string | null
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
            foreignKeyName: "contacts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
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
          language: string | null
          mime_type: string | null
          name: string
          notes: string | null
          size_bytes: number | null
          storage_path: string | null
          tags: string[]
          target_industry: string | null
          target_role: string | null
          user_id: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_demo?: boolean
          kind?: Database["public"]["Enums"]["doc_kind"]
          language?: string | null
          mime_type?: string | null
          name: string
          notes?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          tags?: string[]
          target_industry?: string | null
          target_role?: string | null
          user_id?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_demo?: boolean
          kind?: Database["public"]["Enums"]["doc_kind"]
          language?: string | null
          mime_type?: string | null
          name?: string
          notes?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          tags?: string[]
          target_industry?: string | null
          target_role?: string | null
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      email_connections: {
        Row: {
          ask_before_update: boolean
          connection_key_ciphertext: string | null
          created_at: string
          email_address: string | null
          id: string
          last_error: string | null
          last_sync_at: string | null
          provider: string
          provider_account_id: string | null
          scope: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ask_before_update?: boolean
          connection_key_ciphertext?: string | null
          created_at?: string
          email_address?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          provider: string
          provider_account_id?: string | null
          scope?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          ask_before_update?: boolean
          connection_key_ciphertext?: string | null
          created_at?: string
          email_address?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          provider?: string
          provider_account_id?: string | null
          scope?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          application_id: string | null
          body_text: string | null
          confidence: number | null
          created_at: string
          email_type: string | null
          extracted: Json
          from_email: string | null
          from_name: string | null
          id: string
          message_id: string
          provider: string
          received_at: string
          snippet: string | null
          status: string
          subject: string | null
          thread_id: string | null
          user_id: string
        }
        Insert: {
          application_id?: string | null
          body_text?: string | null
          confidence?: number | null
          created_at?: string
          email_type?: string | null
          extracted?: Json
          from_email?: string | null
          from_name?: string | null
          id?: string
          message_id: string
          provider?: string
          received_at?: string
          snippet?: string | null
          status?: string
          subject?: string | null
          thread_id?: string | null
          user_id?: string
        }
        Update: {
          application_id?: string | null
          body_text?: string | null
          confidence?: number | null
          created_at?: string
          email_type?: string | null
          extracted?: Json
          from_email?: string | null
          from_name?: string | null
          id?: string
          message_id?: string
          provider?: string
          received_at?: string
          snippet?: string | null
          status?: string
          subject?: string | null
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      email_suggestions: {
        Row: {
          application_id: string | null
          created_at: string
          detail: string | null
          email_event_id: string
          id: string
          kind: string
          label: string
          payload: Json
          position: number
          status: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          detail?: string | null
          email_event_id: string
          id?: string
          kind: string
          label: string
          payload?: Json
          position?: number
          status?: string
          user_id?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          detail?: string | null
          email_event_id?: string
          id?: string
          kind?: string
          label?: string
          payload?: Json
          position?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_suggestions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_suggestions_email_event_id_fkey"
            columns: ["email_event_id"]
            isOneToOne: false
            referencedRelation: "email_events"
            referencedColumns: ["id"]
          },
        ]
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
          follow_up_days: number
          full_name: string | null
          graduation_year: number | null
          headline: string | null
          id: string
          location: string | null
          target_role: string | null
          updated_at: string
          weekly_goal: number
        }
        Insert: {
          created_at?: string
          follow_up_days?: number
          full_name?: string | null
          graduation_year?: number | null
          headline?: string | null
          id: string
          location?: string | null
          target_role?: string | null
          updated_at?: string
          weekly_goal?: number
        }
        Update: {
          created_at?: string
          follow_up_days?: number
          full_name?: string | null
          graduation_year?: number | null
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
        | "assessment"
        | "interview"
        | "technical"
        | "final"
        | "offer"
        | "accepted"
        | "rejected"
        | "withdrawn"
        | "ghosted"
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
        "assessment",
        "interview",
        "technical",
        "final",
        "offer",
        "accepted",
        "rejected",
        "withdrawn",
        "ghosted",
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
