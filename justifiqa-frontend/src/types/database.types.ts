export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      advocate_reviews: {
        Row: {
          advocate_id: string
          booking_id: string
          client_id: string
          created_at: string
          is_anonymous: boolean
          rating: number
          review_id: string
          review_text: string | null
        }
        Insert: {
          advocate_id: string
          booking_id: string
          client_id: string
          created_at?: string
          is_anonymous?: boolean
          rating: number
          review_id?: string
          review_text?: string | null
        }
        Update: {
          advocate_id?: string
          booking_id?: string
          client_id?: string
          created_at?: string
          is_anonymous?: boolean
          rating?: number
          review_id?: string
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_review_advocate"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "fk_review_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_sessions"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_review_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_client"
            referencedColumns: ["client_id"]
          },
        ]
      }
      advocate_sanctions_log: {
        Row: {
          advocate_id: string
          issued_at: string
          issued_by_admin_id: string
          reason_text: string
          sanction_id: string
          sanction_type: string
          warning_level: number
        }
        Insert: {
          advocate_id: string
          issued_at?: string
          issued_by_admin_id: string
          reason_text: string
          sanction_id?: string
          sanction_type: string
          warning_level: number
        }
        Update: {
          advocate_id?: string
          issued_at?: string
          issued_by_admin_id?: string
          reason_text?: string
          sanction_id?: string
          sanction_type?: string
          warning_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_sanction_admin"
            columns: ["issued_by_admin_id"]
            isOneToOne: false
            referencedRelation: "users_admin"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "fk_sanction_advocate"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
        ]
      }
      advocate_service_tiers: {
        Row: {
          advocate_id: string
          badge_text: string | null
          description: string | null
          duration_label: string | null
          duration_minutes: number | null
          features: Json
          highlight_color: string
          is_active: boolean
          is_escrow_required: boolean
          price_idr: number
          price_label: string | null
          recommended_for: string | null
          service_code: string | null
          tier_id: string
          tier_level: number
          tier_name: string
        }
        Insert: {
          advocate_id: string
          badge_text?: string | null
          description?: string | null
          duration_label?: string | null
          duration_minutes?: number | null
          features?: Json
          highlight_color?: string
          is_active?: boolean
          is_escrow_required?: boolean
          price_idr: number
          price_label?: string | null
          recommended_for?: string | null
          service_code?: string | null
          tier_id?: string
          tier_level: number
          tier_name: string
        }
        Update: {
          advocate_id?: string
          badge_text?: string | null
          description?: string | null
          duration_label?: string | null
          duration_minutes?: number | null
          features?: Json
          highlight_color?: string
          is_active?: boolean
          is_escrow_required?: boolean
          price_idr?: number
          price_label?: string | null
          recommended_for?: string | null
          service_code?: string | null
          tier_id?: string
          tier_level?: number
          tier_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tier_advocate"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
        ]
      }
      audit_logs_worm: {
        Row: {
          action_type: string
          actor_type: string
          actor_user_id: string
          audit_id: string
          created_at: string
          metadata_json: Json
          target_resource: string
          worm_sha256_hash: string
        }
        Insert: {
          action_type: string
          actor_type: string
          actor_user_id: string
          audit_id?: string
          created_at?: string
          metadata_json: Json
          target_resource: string
          worm_sha256_hash: string
        }
        Update: {
          action_type?: string
          actor_type?: string
          actor_user_id?: string
          audit_id?: string
          created_at?: string
          metadata_json?: Json
          target_resource?: string
          worm_sha256_hash?: string
        }
        Relationships: []
      }
      beneficial_owners: {
        Row: {
          ahu_submission_reference: string | null
          beneficial_owner_id: string
          case_id: string
          control_basis: string
          created_at: string
          declaration_version: number
          evidence_digest: string
          identity_reference: string
          natural_person_name: string
          percentage: number | null
          person_type: string
          reviewer_id: string | null
          reviewer_role: string | null
          updated_at: string
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          ahu_submission_reference?: string | null
          beneficial_owner_id?: string
          case_id: string
          control_basis: string
          created_at?: string
          declaration_version?: number
          evidence_digest: string
          identity_reference: string
          natural_person_name: string
          percentage?: number | null
          person_type?: string
          reviewer_id?: string | null
          reviewer_role?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          ahu_submission_reference?: string | null
          beneficial_owner_id?: string
          case_id?: string
          control_basis?: string
          created_at?: string
          declaration_version?: number
          evidence_digest?: string
          identity_reference?: string
          natural_person_name?: string
          percentage?: number | null
          person_type?: string
          reviewer_id?: string | null
          reviewer_role?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_beneficial_owners_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "corporate_service_cases"
            referencedColumns: ["case_id"]
          },
        ]
      }
      booking_sessions: {
        Row: {
          advocate_first_reply_at: string | null
          advocate_id: string
          booked_price_idr: number
          booking_code: string
          booking_id: string
          case_summary: string | null
          client_id: string
          created_at: string
          fair_clock_started_at: string | null
          meeting_method: string
          slot_id: string
          status: string
          timeout_job_id: string | null
          updated_at: string
        }
        Insert: {
          advocate_first_reply_at?: string | null
          advocate_id: string
          booked_price_idr?: number
          booking_code: string
          booking_id?: string
          case_summary?: string | null
          client_id: string
          created_at?: string
          fair_clock_started_at?: string | null
          meeting_method?: string
          slot_id: string
          status: string
          timeout_job_id?: string | null
          updated_at?: string
        }
        Update: {
          advocate_first_reply_at?: string | null
          advocate_id?: string
          booked_price_idr?: number
          booking_code?: string
          booking_id?: string
          case_summary?: string | null
          client_id?: string
          created_at?: string
          fair_clock_started_at?: string | null
          meeting_method?: string
          slot_id?: string
          status?: string
          timeout_job_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_booking_advocate"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "fk_booking_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_booking_slot"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "consultation_slots"
            referencedColumns: ["slot_id"]
          },
        ]
      }
      case_irac_notes: {
        Row: {
          advocate_id: string
          analysis_text: string
          booking_id: string
          case_title: string | null
          conclusion_text: string
          confidence_score: number | null
          created_at: string
          irac_id: string
          issue_text: string
          relevant_articles: Json
          rule_text: string
          story_of_facts: string | null
          worm_hash_sha256: string
        }
        Insert: {
          advocate_id: string
          analysis_text: string
          booking_id: string
          case_title?: string | null
          conclusion_text: string
          confidence_score?: number | null
          created_at?: string
          irac_id?: string
          issue_text: string
          relevant_articles?: Json
          rule_text: string
          story_of_facts?: string | null
          worm_hash_sha256: string
        }
        Update: {
          advocate_id?: string
          analysis_text?: string
          booking_id?: string
          case_title?: string | null
          conclusion_text?: string
          confidence_score?: number | null
          created_at?: string
          irac_id?: string
          issue_text?: string
          relevant_articles?: Json
          rule_text?: string
          story_of_facts?: string | null
          worm_hash_sha256?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_irac_advocate"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "fk_irac_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_sessions"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      chat_sessions_metadata: {
        Row: {
          advocate_ephemeral_pubkey: string
          booking_id: string
          chat_session_id: string
          client_ephemeral_pubkey: string
          created_at: string
          key_exchange_salt: string
          zero_knowledge_flag: boolean
        }
        Insert: {
          advocate_ephemeral_pubkey: string
          booking_id: string
          chat_session_id?: string
          client_ephemeral_pubkey: string
          created_at?: string
          key_exchange_salt: string
          zero_knowledge_flag?: boolean
        }
        Update: {
          advocate_ephemeral_pubkey?: string
          booking_id?: string
          chat_session_id?: string
          client_ephemeral_pubkey?: string
          created_at?: string
          key_exchange_salt?: string
          zero_knowledge_flag?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_meta_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_sessions"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      compliance_assessments: {
        Row: {
          assessed_at: string | null
          assessment_id: string
          assessment_level: string
          case_id: string
          created_at: string
          pep_check_status: string
          reviewer_decision: string
          reviewer_id: string
          reviewer_rationale: string | null
          reviewer_role: string
          risk_score: number | null
          rules_version: string
          sanctions_check_status: string
          updated_at: string
        }
        Insert: {
          assessed_at?: string | null
          assessment_id?: string
          assessment_level: string
          case_id: string
          created_at?: string
          pep_check_status?: string
          reviewer_decision?: string
          reviewer_id: string
          reviewer_rationale?: string | null
          reviewer_role: string
          risk_score?: number | null
          rules_version: string
          sanctions_check_status?: string
          updated_at?: string
        }
        Update: {
          assessed_at?: string | null
          assessment_id?: string
          assessment_level?: string
          case_id?: string
          created_at?: string
          pep_check_status?: string
          reviewer_decision?: string
          reviewer_id?: string
          reviewer_rationale?: string | null
          reviewer_role?: string
          risk_score?: number | null
          rules_version?: string
          sanctions_check_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_compliance_assessments_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "corporate_service_cases"
            referencedColumns: ["case_id"]
          },
        ]
      }
      compliance_workflow_events_worm: {
        Row: {
          actor_user_id: string | null
          corporate_case_id: string | null
          created_at: string
          envelope_id: string | null
          escrow_id: string | null
          event_digest_sha256: string
          event_id: string
          event_type: string
          idempotency_key: string
          occurred_at: string
          verification_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          corporate_case_id?: string | null
          created_at?: string
          envelope_id?: string | null
          escrow_id?: string | null
          event_digest_sha256: string
          event_id?: string
          event_type: string
          idempotency_key: string
          occurred_at: string
          verification_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          corporate_case_id?: string | null
          created_at?: string
          envelope_id?: string | null
          escrow_id?: string | null
          event_digest_sha256?: string
          event_id?: string
          event_type?: string
          idempotency_key?: string
          occurred_at?: string
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_workflow_events_worm_corporate_case_id_fkey"
            columns: ["corporate_case_id"]
            isOneToOne: false
            referencedRelation: "corporate_service_cases"
            referencedColumns: ["case_id"]
          },
          {
            foreignKeyName: "compliance_workflow_events_worm_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "signing_envelopes"
            referencedColumns: ["envelope_id"]
          },
          {
            foreignKeyName: "compliance_workflow_events_worm_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["escrow_id"]
          },
          {
            foreignKeyName: "compliance_workflow_events_worm_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "ekyc_verification_logs"
            referencedColumns: ["verification_id"]
          },
        ]
      }
      consultation_slots: {
        Row: {
          advocate_id: string
          end_time: string
          is_mutex_locked: boolean
          slot_id: string
          start_time: string
          status: string
          tier_id: string
          updated_at: string
        }
        Insert: {
          advocate_id: string
          end_time: string
          is_mutex_locked?: boolean
          slot_id?: string
          start_time: string
          status?: string
          tier_id: string
          updated_at?: string
        }
        Update: {
          advocate_id?: string
          end_time?: string
          is_mutex_locked?: boolean
          slot_id?: string
          start_time?: string
          status?: string
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_slot_advocate"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "fk_slot_tier"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "advocate_service_tiers"
            referencedColumns: ["tier_id"]
          },
        ]
      }
      corporate_parties: {
        Row: {
          case_id: string
          created_at: string
          display_name: string
          effective_from: string
          effective_to: string | null
          identity_reference: string
          ownership_percentage: number | null
          party_id: string
          party_type: string
          role: string
          updated_at: string
          voting_percentage: number | null
        }
        Insert: {
          case_id: string
          created_at?: string
          display_name: string
          effective_from?: string
          effective_to?: string | null
          identity_reference: string
          ownership_percentage?: number | null
          party_id?: string
          party_type?: string
          role: string
          updated_at?: string
          voting_percentage?: number | null
        }
        Update: {
          case_id?: string
          created_at?: string
          display_name?: string
          effective_from?: string
          effective_to?: string | null
          identity_reference?: string
          ownership_percentage?: number | null
          party_id?: string
          party_type?: string
          role?: string
          updated_at?: string
          voting_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_corporate_parties_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "corporate_service_cases"
            referencedColumns: ["case_id"]
          },
        ]
      }
      corporate_pricing_catalogs: {
        Row: {
          catalog_id: string
          created_at: string
          currency: string
          effective_from: string
          effective_until: string | null
          legal_scope_version: string
          quote_version: number
          service_type: string
          status: string
          total_amount_idr: number
          updated_at: string
        }
        Insert: {
          catalog_id?: string
          created_at?: string
          currency?: string
          effective_from: string
          effective_until?: string | null
          legal_scope_version: string
          quote_version: number
          service_type: string
          status?: string
          total_amount_idr: number
          updated_at?: string
        }
        Update: {
          catalog_id?: string
          created_at?: string
          currency?: string
          effective_from?: string
          effective_until?: string | null
          legal_scope_version?: string
          quote_version?: number
          service_type?: string
          status?: string
          total_amount_idr?: number
          updated_at?: string
        }
        Relationships: []
      }
      corporate_pricing_fee_lines: {
        Row: {
          amount: number
          catalog_id: string
          created_at: string
          description: string
          fee_line_code: string
          fee_line_id: string
          fee_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          catalog_id: string
          created_at?: string
          description: string
          fee_line_code: string
          fee_line_id?: string
          fee_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          catalog_id?: string
          created_at?: string
          description?: string
          fee_line_code?: string
          fee_line_id?: string
          fee_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_corporate_pricing_fee_lines_catalog"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "corporate_pricing_catalogs"
            referencedColumns: ["catalog_id"]
          },
        ]
      }
      corporate_pricing_milestones: {
        Row: {
          amount: number
          catalog_id: string
          created_at: string
          dispute_refund_rule: string
          due_offset_anchor: string | null
          due_offset_days: number | null
          evidence_condition: string
          milestone_id: string
          milestone_type: string
          releasable_party: string
          sequence_number: number
          updated_at: string
        }
        Insert: {
          amount: number
          catalog_id: string
          created_at?: string
          dispute_refund_rule: string
          due_offset_anchor?: string | null
          due_offset_days?: number | null
          evidence_condition: string
          milestone_id?: string
          milestone_type: string
          releasable_party: string
          sequence_number: number
          updated_at?: string
        }
        Update: {
          amount?: number
          catalog_id?: string
          created_at?: string
          dispute_refund_rule?: string
          due_offset_anchor?: string | null
          due_offset_days?: number | null
          evidence_condition?: string
          milestone_id?: string
          milestone_type?: string
          releasable_party?: string
          sequence_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_corporate_pricing_milestones_catalog"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "corporate_pricing_catalogs"
            referencedColumns: ["catalog_id"]
          },
        ]
      }
      corporate_service_cases: {
        Row: {
          assigned_compliance_reviewer_id: string | null
          assigned_notary_id: string | null
          authorized_capital_idr: number | null
          case_id: string
          created_at: string
          current_stage: string
          domicile_city: string
          domicile_province: string
          entity_type: string
          kbli_snapshot: Json
          legal_scope_version: string
          order_id: string
          paid_up_capital_idr: number | null
          proposed_name: string
          target_sla_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_compliance_reviewer_id?: string | null
          assigned_notary_id?: string | null
          authorized_capital_idr?: number | null
          case_id?: string
          created_at?: string
          current_stage?: string
          domicile_city: string
          domicile_province: string
          entity_type: string
          kbli_snapshot?: Json
          legal_scope_version: string
          order_id: string
          paid_up_capital_idr?: number | null
          proposed_name: string
          target_sla_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_compliance_reviewer_id?: string | null
          assigned_notary_id?: string | null
          authorized_capital_idr?: number | null
          case_id?: string
          created_at?: string
          current_stage?: string
          domicile_city?: string
          domicile_province?: string
          entity_type?: string
          kbli_snapshot?: Json
          legal_scope_version?: string
          order_id?: string
          paid_up_capital_idr?: number | null
          proposed_name?: string
          target_sla_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_corporate_cases_compliance_reviewer"
            columns: ["assigned_compliance_reviewer_id"]
            isOneToOne: false
            referencedRelation: "users_admin"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "fk_corporate_cases_notary"
            columns: ["assigned_notary_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "fk_corporate_cases_order"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "service_orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      dispute_cases: {
        Row: {
          booking_id: string
          created_at: string
          description: string
          dispute_category: string
          dispute_id: string
          escrow_frozen_at: string | null
          escrow_id: string
          evidence_paths: Json
          reported_by_client_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          description: string
          dispute_category: string
          dispute_id?: string
          escrow_frozen_at?: string | null
          escrow_id: string
          evidence_paths?: Json
          reported_by_client_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          description?: string
          dispute_category?: string
          dispute_id?: string
          escrow_frozen_at?: string | null
          escrow_id?: string
          evidence_paths?: Json
          reported_by_client_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_cases_reported_by_client_id_fkey"
            columns: ["reported_by_client_id"]
            isOneToOne: false
            referencedRelation: "users_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_dispute_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_sessions"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_dispute_escrow"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["escrow_id"]
          },
        ]
      }
      dispute_mediator_signatures: {
        Row: {
          decision_type: string
          dispute_id: string
          fido2_signature_hash: string
          mediator_admin_id: string
          signature_id: string
          signed_at: string
        }
        Insert: {
          decision_type: string
          dispute_id: string
          fido2_signature_hash: string
          mediator_admin_id: string
          signature_id?: string
          signed_at?: string
        }
        Update: {
          decision_type?: string
          dispute_id?: string
          fido2_signature_hash?: string
          mediator_admin_id?: string
          signature_id?: string
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_signature_admin"
            columns: ["mediator_admin_id"]
            isOneToOne: false
            referencedRelation: "users_admin"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "fk_signature_dispute"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "dispute_cases"
            referencedColumns: ["dispute_id"]
          },
        ]
      }
      document_integrity_anchors: {
        Row: {
          anchor_id: string
          anchor_source: Database["public"]["Enums"]["document_anchor_source"]
          anchored_at: string
          case_id: string | null
          document_id: string
          document_type: string
          public_verification_token: string
          serial_number: string | null
          sha256_document_hash: string
          signing_envelope_id: string | null
        }
        Insert: {
          anchor_id?: string
          anchor_source: Database["public"]["Enums"]["document_anchor_source"]
          anchored_at?: string
          case_id?: string | null
          document_id: string
          document_type: string
          public_verification_token?: string
          serial_number?: string | null
          sha256_document_hash: string
          signing_envelope_id?: string | null
        }
        Update: {
          anchor_id?: string
          anchor_source?: Database["public"]["Enums"]["document_anchor_source"]
          anchored_at?: string
          case_id?: string | null
          document_id?: string
          document_type?: string
          public_verification_token?: string
          serial_number?: string | null
          sha256_document_hash?: string
          signing_envelope_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_document_integrity_anchor_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "corporate_service_cases"
            referencedColumns: ["case_id"]
          },
          {
            foreignKeyName: "fk_document_integrity_anchor_envelope"
            columns: ["signing_envelope_id"]
            isOneToOne: false
            referencedRelation: "signing_envelopes"
            referencedColumns: ["envelope_id"]
          },
        ]
      }
      document_revisions: {
        Row: {
          client_feedback_text: string
          opinion_id: string
          revision_id: string
          revision_round: number
          submitted_at: string
        }
        Insert: {
          client_feedback_text: string
          opinion_id: string
          revision_id?: string
          revision_round: number
          submitted_at?: string
        }
        Update: {
          client_feedback_text?: string
          opinion_id?: string
          revision_id?: string
          revision_round?: number
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_revision_opinion"
            columns: ["opinion_id"]
            isOneToOne: false
            referencedRelation: "legal_opinions"
            referencedColumns: ["opinion_id"]
          },
        ]
      }
      ekyc_verification_logs: {
        Row: {
          created_at: string
          envelope_id: string | null
          liveness_attempt_count: number
          party_id: string | null
          provider_name: string
          provider_reference_id: string | null
          result_digest_sha256: string | null
          status: Database["public"]["Enums"]["ekyc_verification_status"]
          user_id: string
          user_role: Database["public"]["Enums"]["ekyc_user_role"]
          verification_id: string
          verification_type: Database["public"]["Enums"]["ekyc_verification_type"]
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          envelope_id?: string | null
          liveness_attempt_count?: number
          party_id?: string | null
          provider_name: string
          provider_reference_id?: string | null
          result_digest_sha256?: string | null
          status?: Database["public"]["Enums"]["ekyc_verification_status"]
          user_id: string
          user_role: Database["public"]["Enums"]["ekyc_user_role"]
          verification_id?: string
          verification_type: Database["public"]["Enums"]["ekyc_verification_type"]
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          envelope_id?: string | null
          liveness_attempt_count?: number
          party_id?: string | null
          provider_name?: string
          provider_reference_id?: string | null
          result_digest_sha256?: string | null
          status?: Database["public"]["Enums"]["ekyc_verification_status"]
          user_id?: string
          user_role?: Database["public"]["Enums"]["ekyc_user_role"]
          verification_id?: string
          verification_type?: Database["public"]["Enums"]["ekyc_verification_type"]
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ekyc_signing_party"
            columns: ["envelope_id", "party_id"]
            isOneToOne: false
            referencedRelation: "signing_envelope_parties"
            referencedColumns: ["envelope_id", "party_id"]
          },
        ]
      }
      emeterai_stamping_logs: {
        Row: {
          opinion_id: string
          peruri_serial_number: string
          public_verification_token: string
          sha256_document_hash: string
          stamped_at: string
          stamping_id: string
          status: string
        }
        Insert: {
          opinion_id: string
          peruri_serial_number: string
          public_verification_token?: string
          sha256_document_hash: string
          stamped_at?: string
          stamping_id?: string
          status?: string
        }
        Update: {
          opinion_id?: string
          peruri_serial_number?: string
          public_verification_token?: string
          sha256_document_hash?: string
          stamped_at?: string
          stamping_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_emeterai_opinion"
            columns: ["opinion_id"]
            isOneToOne: false
            referencedRelation: "legal_opinions"
            referencedColumns: ["opinion_id"]
          },
        ]
      }
      escrow_payout_ledgers: {
        Row: {
          amount_idr: number
          description: string
          escrow_id: string
          executed_at: string
          ledger_id: string
          mutation_type: string
          wallet_id: string
        }
        Insert: {
          amount_idr: number
          description: string
          escrow_id: string
          executed_at?: string
          ledger_id?: string
          mutation_type: string
          wallet_id: string
        }
        Update: {
          amount_idr?: number
          description?: string
          escrow_id?: string
          executed_at?: string
          ledger_id?: string
          mutation_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ledger_escrow"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["escrow_id"]
          },
          {
            foreignKeyName: "fk_ledger_wallet"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallet_balances"
            referencedColumns: ["wallet_id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          advocate_id: string | null
          advocate_payout_ratio: number
          booking_id: string | null
          client_id: string
          client_payout_ratio: number
          corporate_case_id: string | null
          created_at: string
          escrow_id: string
          funds_lock_time_reconstructed: boolean
          funds_locked_at: string | null
          holding_expires_at: string
          is_mutex_locked: boolean
          mutex_lock_id: string | null
          payment_gateway_ref: string
          resolution_notes: string | null
          status: string
          total_amount_idr: number
          updated_at: string
          worm_audit_hash: string | null
        }
        Insert: {
          advocate_id?: string | null
          advocate_payout_ratio?: number
          booking_id?: string | null
          client_id: string
          client_payout_ratio?: number
          corporate_case_id?: string | null
          created_at?: string
          escrow_id?: string
          funds_lock_time_reconstructed?: boolean
          funds_locked_at?: string | null
          holding_expires_at: string
          is_mutex_locked?: boolean
          mutex_lock_id?: string | null
          payment_gateway_ref: string
          resolution_notes?: string | null
          status: string
          total_amount_idr: number
          updated_at?: string
          worm_audit_hash?: string | null
        }
        Update: {
          advocate_id?: string | null
          advocate_payout_ratio?: number
          booking_id?: string | null
          client_id?: string
          client_payout_ratio?: number
          corporate_case_id?: string | null
          created_at?: string
          escrow_id?: string
          funds_lock_time_reconstructed?: boolean
          funds_locked_at?: string | null
          holding_expires_at?: string
          is_mutex_locked?: boolean
          mutex_lock_id?: string | null
          payment_gateway_ref?: string
          resolution_notes?: string | null
          status?: string
          total_amount_idr?: number
          updated_at?: string
          worm_audit_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_escrow_advocate"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "fk_escrow_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_sessions"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_escrow_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_escrow_corporate_case"
            columns: ["corporate_case_id"]
            isOneToOne: false
            referencedRelation: "corporate_service_cases"
            referencedColumns: ["case_id"]
          },
        ]
      }
      government_submission_jobs: {
        Row: {
          attempt_count: number
          authorized_notary_id: string
          authorized_submitter_id: string
          case_id: string
          created_at: string
          decided_at: string | null
          external_reference_id: string | null
          external_registration_number: string | null
          idempotency_key: string
          job_id: string
          last_error_code: string | null
          next_retry_at: string | null
          request_digest: string | null
          responded_at: string | null
          response_digest: string | null
          status: string
          submission_payload_digest_sha256: string
          submission_status: Database["public"]["Enums"]["notary_submission_status"]
          submitted_at: string | null
          system: string
          target_system: Database["public"]["Enums"]["notary_submission_target_system"]
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          authorized_notary_id: string
          authorized_submitter_id: string
          case_id: string
          created_at?: string
          decided_at?: string | null
          external_reference_id?: string | null
          external_registration_number?: string | null
          idempotency_key: string
          job_id?: string
          last_error_code?: string | null
          next_retry_at?: string | null
          request_digest?: string | null
          responded_at?: string | null
          response_digest?: string | null
          status?: string
          submission_payload_digest_sha256: string
          submission_status?: Database["public"]["Enums"]["notary_submission_status"]
          submitted_at?: string | null
          system: string
          target_system: Database["public"]["Enums"]["notary_submission_target_system"]
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          authorized_notary_id?: string
          authorized_submitter_id?: string
          case_id?: string
          created_at?: string
          decided_at?: string | null
          external_reference_id?: string | null
          external_registration_number?: string | null
          idempotency_key?: string
          job_id?: string
          last_error_code?: string | null
          next_retry_at?: string | null
          request_digest?: string | null
          responded_at?: string | null
          response_digest?: string | null
          status?: string
          submission_payload_digest_sha256?: string
          submission_status?: Database["public"]["Enums"]["notary_submission_status"]
          submitted_at?: string | null
          system?: string
          target_system?: Database["public"]["Enums"]["notary_submission_target_system"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_government_submission_jobs_case"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "corporate_service_cases"
            referencedColumns: ["case_id"]
          },
          {
            foreignKeyName: "fk_government_submission_jobs_submitter"
            columns: ["authorized_submitter_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
        ]
      }
      legal_opinions: {
        Row: {
          advocate_id: string
          booking_id: string
          clauses_jsonb: Json
          client_id: string
          created_at: string
          document_title: string
          opinion_id: string
          opponent_name: string | null
          pdf_storage_path: string
          revision_counter: number
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          advocate_id: string
          booking_id: string
          clauses_jsonb?: Json
          client_id: string
          created_at?: string
          document_title: string
          opinion_id?: string
          opponent_name?: string | null
          pdf_storage_path: string
          revision_counter?: number
          status: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          advocate_id?: string
          booking_id?: string
          clauses_jsonb?: Json
          client_id?: string
          created_at?: string
          document_title?: string
          opinion_id?: string
          opponent_name?: string | null
          pdf_storage_path?: string
          revision_counter?: number
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_opinion_advocate"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "fk_opinion_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_sessions"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_opinion_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_client"
            referencedColumns: ["client_id"]
          },
        ]
      }
      offline_handshakes_totp: {
        Row: {
          booking_id: string
          handshake_id: string
          office_lat_long: string
          scanned_at: string
          status: string
          totp_secret_hash: string
        }
        Insert: {
          booking_id: string
          handshake_id?: string
          office_lat_long: string
          scanned_at?: string
          status?: string
          totp_secret_hash: string
        }
        Update: {
          booking_id?: string
          handshake_id?: string
          office_lat_long?: string
          scanned_at?: string
          status?: string
          totp_secret_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_handshake_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_sessions"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      payment_milestones: {
        Row: {
          amount: number
          created_at: string
          currency: string
          dispute_refund_rule: string
          due_at: string | null
          evidence_condition: string
          funded_at: string | null
          milestone_id: string
          milestone_type: string
          order_id: string
          quote_version: number
          releasable_party: string
          released_at: string | null
          sequence_number: number
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          dispute_refund_rule: string
          due_at?: string | null
          evidence_condition: string
          funded_at?: string | null
          milestone_id?: string
          milestone_type: string
          order_id: string
          quote_version?: number
          releasable_party: string
          released_at?: string | null
          sequence_number: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          dispute_refund_rule?: string
          due_at?: string | null
          evidence_condition?: string
          funded_at?: string | null
          milestone_id?: string
          milestone_type?: string
          order_id?: string
          quote_version?: number
          releasable_party?: string
          released_at?: string | null
          sequence_number?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_milestones_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      payout_idempotency_keys: {
        Row: {
          amount: number
          created_at: string
          escrow_transaction_id: string
          idempotency_key: string
          key_id: string
          payout_channel: Database["public"]["Enums"]["payout_channel"]
          status: Database["public"]["Enums"]["payout_idempotency_status"]
          target_user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          escrow_transaction_id: string
          idempotency_key: string
          key_id?: string
          payout_channel: Database["public"]["Enums"]["payout_channel"]
          status?: Database["public"]["Enums"]["payout_idempotency_status"]
          target_user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          escrow_transaction_id?: string
          idempotency_key?: string
          key_id?: string
          payout_channel?: Database["public"]["Enums"]["payout_channel"]
          status?: Database["public"]["Enums"]["payout_idempotency_status"]
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_idempotency_keys_escrow_transaction_id_fkey"
            columns: ["escrow_transaction_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["escrow_id"]
          },
        ]
      }
      platform_governance_configs: {
        Row: {
          config_key: string
          config_value: string
          description: string
          updated_at: string
          updated_by_admin_id: string
        }
        Insert: {
          config_key: string
          config_value: string
          description: string
          updated_at?: string
          updated_by_admin_id: string
        }
        Update: {
          config_key?: string
          config_value?: string
          description?: string
          updated_at?: string
          updated_by_admin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_config_admin"
            columns: ["updated_by_admin_id"]
            isOneToOne: false
            referencedRelation: "users_admin"
            referencedColumns: ["admin_id"]
          },
        ]
      }
      probono_cases: {
        Row: {
          client_id: string
          created_at: string
          dtks_registration_no: string
          probono_id: string
          status: string
          verified_by_admin_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          dtks_registration_no: string
          probono_id?: string
          status?: string
          verified_by_admin_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          dtks_registration_no?: string
          probono_id?: string
          status?: string
          verified_by_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_probono_admin"
            columns: ["verified_by_admin_id"]
            isOneToOne: false
            referencedRelation: "users_admin"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "fk_probono_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_client"
            referencedColumns: ["client_id"]
          },
        ]
      }
      provider_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          order_id: string
          payload_digest_sha256: string
          processed_at: string | null
          processed_status: Database["public"]["Enums"]["webhook_processed_status"]
          provider_event_id: string
          provider_name: string
          received_at: string
          signature_verified: boolean
        }
        Insert: {
          event_id?: string
          event_type: string
          order_id: string
          payload_digest_sha256: string
          processed_at?: string | null
          processed_status?: Database["public"]["Enums"]["webhook_processed_status"]
          provider_event_id: string
          provider_name: string
          received_at?: string
          signature_verified?: boolean
        }
        Update: {
          event_id?: string
          event_type?: string
          order_id?: string
          payload_digest_sha256?: string
          processed_at?: string | null
          processed_status?: Database["public"]["Enums"]["webhook_processed_status"]
          provider_event_id?: string
          provider_name?: string
          received_at?: string
          signature_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "provider_webhook_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      service_fee_lines: {
        Row: {
          accepted_at: string | null
          amount: number
          created_at: string
          currency: string
          description: string
          fee_line_code: string
          fee_line_id: string
          fee_type: string
          order_id: string
          quote_version: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          amount: number
          created_at?: string
          currency?: string
          description: string
          fee_line_code: string
          fee_line_id?: string
          fee_type: string
          order_id: string
          quote_version?: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          amount?: number
          created_at?: string
          currency?: string
          description?: string
          fee_line_code?: string
          fee_line_id?: string
          fee_type?: string
          order_id?: string
          quote_version?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_fee_lines_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      service_orders: {
        Row: {
          accepted_quote_version: number | null
          assigned_professional_id: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          currency: string
          order_id: string
          origin_booking_id: string | null
          service_type: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          accepted_quote_version?: number | null
          assigned_professional_id?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          order_id?: string
          origin_booking_id?: string | null
          service_type: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          accepted_quote_version?: number | null
          assigned_professional_id?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          order_id?: string
          origin_booking_id?: string | null
          service_type?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_orders_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_service_orders_origin_booking"
            columns: ["origin_booking_id"]
            isOneToOne: false
            referencedRelation: "booking_sessions"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "fk_service_orders_professional"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
        ]
      }
      signing_envelope_parties: {
        Row: {
          created_at: string
          envelope_id: string
          party_id: string
          party_role: Database["public"]["Enums"]["signing_party_role"]
          party_user_id: string
          provider_recipient_id: string | null
          signed_at: string | null
          signer_email: string
          signing_order: number
          signing_status: Database["public"]["Enums"]["signing_party_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          envelope_id: string
          party_id?: string
          party_role: Database["public"]["Enums"]["signing_party_role"]
          party_user_id: string
          provider_recipient_id?: string | null
          signed_at?: string | null
          signer_email: string
          signing_order: number
          signing_status?: Database["public"]["Enums"]["signing_party_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          envelope_id?: string
          party_id?: string
          party_role?: Database["public"]["Enums"]["signing_party_role"]
          party_user_id?: string
          provider_recipient_id?: string | null
          signed_at?: string | null
          signer_email?: string
          signing_order?: number
          signing_status?: Database["public"]["Enums"]["signing_party_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signing_envelope_parties_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "signing_envelopes"
            referencedColumns: ["envelope_id"]
          },
        ]
      }
      signing_envelopes: {
        Row: {
          case_id: string
          case_type: Database["public"]["Enums"]["signing_case_type"]
          completed_at: string | null
          created_at: string
          created_by: string
          document_sha256_hash: string
          document_title: string
          envelope_id: string
          escrow_id: string | null
          escrow_locked_at: string | null
          expires_at: string | null
          external_envelope_id: string
          global_status: Database["public"]["Enums"]["signing_envelope_global_status"]
          halt_reason:
            | Database["public"]["Enums"]["signing_envelope_halt_reason"]
            | null
          halted_at: string | null
          is_legacy_halt_unclassified: boolean
          provider_name: string
          refunded_at: string | null
          status: Database["public"]["Enums"]["signing_envelope_status"]
          updated_at: string
        }
        Insert: {
          case_id: string
          case_type: Database["public"]["Enums"]["signing_case_type"]
          completed_at?: string | null
          created_at?: string
          created_by: string
          document_sha256_hash: string
          document_title: string
          envelope_id?: string
          escrow_id?: string | null
          escrow_locked_at?: string | null
          expires_at?: string | null
          external_envelope_id: string
          global_status?: Database["public"]["Enums"]["signing_envelope_global_status"]
          halt_reason?:
            | Database["public"]["Enums"]["signing_envelope_halt_reason"]
            | null
          halted_at?: string | null
          is_legacy_halt_unclassified?: boolean
          provider_name: string
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["signing_envelope_status"]
          updated_at?: string
        }
        Update: {
          case_id?: string
          case_type?: Database["public"]["Enums"]["signing_case_type"]
          completed_at?: string | null
          created_at?: string
          created_by?: string
          document_sha256_hash?: string
          document_title?: string
          envelope_id?: string
          escrow_id?: string | null
          escrow_locked_at?: string | null
          expires_at?: string | null
          external_envelope_id?: string
          global_status?: Database["public"]["Enums"]["signing_envelope_global_status"]
          halt_reason?:
            | Database["public"]["Enums"]["signing_envelope_halt_reason"]
            | null
          halted_at?: string | null
          is_legacy_halt_unclassified?: boolean
          provider_name?: string
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["signing_envelope_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_signing_envelope_escrow"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["escrow_id"]
          },
        ]
      }
      sipp_verifications: {
        Row: {
          advocate_id: string
          sipp_number: string
          status: string
          verification_id: string
          verification_notes: string | null
          verified_at: string
          verified_by_admin_id: string | null
        }
        Insert: {
          advocate_id: string
          sipp_number: string
          status?: string
          verification_id?: string
          verification_notes?: string | null
          verified_at?: string
          verified_by_admin_id?: string | null
        }
        Update: {
          advocate_id?: string
          sipp_number?: string
          status?: string
          verification_id?: string
          verification_notes?: string | null
          verified_at?: string
          verified_by_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sipp_admin"
            columns: ["verified_by_admin_id"]
            isOneToOne: false
            referencedRelation: "users_admin"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "fk_sipp_advocate"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
        ]
      }
      tax_pph21_withholdings: {
        Row: {
          advocate_id: string
          created_at: string
          einvoice_ref: string
          escrow_id: string
          gross_income_idr: number
          npwp_number: string
          tax_rate_percentage: number
          tax_receipt_id: string
          tax_withheld_idr: number
        }
        Insert: {
          advocate_id: string
          created_at?: string
          einvoice_ref: string
          escrow_id: string
          gross_income_idr: number
          npwp_number: string
          tax_rate_percentage: number
          tax_receipt_id?: string
          tax_withheld_idr: number
        }
        Update: {
          advocate_id?: string
          created_at?: string
          einvoice_ref?: string
          escrow_id?: string
          gross_income_idr?: number
          npwp_number?: string
          tax_rate_percentage?: number
          tax_receipt_id?: string
          tax_withheld_idr?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_tax_advocate"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "users_advocate"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "fk_tax_escrow"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["escrow_id"]
          },
        ]
      }
      user_active_devices: {
        Row: {
          device_name: string
          device_session_id: string
          hardware_token_hash: string
          ip_address: string
          last_active_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          device_name: string
          device_session_id?: string
          hardware_token_hash: string
          ip_address: string
          last_active_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          device_name?: string
          device_session_id?: string
          hardware_token_hash?: string
          ip_address?: string
          last_active_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          is_read: boolean
          message_body: string
          notification_id: string
          recipient_user_id: string
          title: string
        }
        Insert: {
          created_at?: string
          is_read?: boolean
          message_body: string
          notification_id?: string
          recipient_user_id: string
          title: string
        }
        Update: {
          created_at?: string
          is_read?: boolean
          message_body?: string
          notification_id?: string
          recipient_user_id?: string
          title?: string
        }
        Relationships: []
      }
      users_admin: {
        Row: {
          admin_id: string
          created_at: string
          email: string
          fido2_enabled: boolean
          full_name: string
          role_group: string
        }
        Insert: {
          admin_id?: string
          created_at?: string
          email: string
          fido2_enabled?: boolean
          full_name: string
          role_group: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          email?: string
          fido2_enabled?: boolean
          full_name?: string
          role_group?: string
        }
        Relationships: []
      }
      users_advocate: {
        Row: {
          advocate_id: string
          advocate_organization: string
          avatar_initials: string | null
          average_rating: number | null
          bio: string | null
          created_at: string
          email: string
          experience_years: number
          full_name: string
          has_probono_quota: boolean
          is_online: boolean
          kyc_status: string
          nik_ktp: string | null
          npwp_number: string | null
          payout_bank_account_holder: string | null
          payout_bank_account_no: string | null
          payout_bank_name: string | null
          peradi_card_no: string
          phone_e164: string
          profile_slug: string | null
          review_count: number
          sipp_license_no: string
          sla_strikes: number
          specialization_primary: string
          updated_at: string
        }
        Insert: {
          advocate_id?: string
          advocate_organization?: string
          avatar_initials?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          email: string
          experience_years?: number
          full_name: string
          has_probono_quota?: boolean
          is_online?: boolean
          kyc_status?: string
          nik_ktp?: string | null
          npwp_number?: string | null
          payout_bank_account_holder?: string | null
          payout_bank_account_no?: string | null
          payout_bank_name?: string | null
          peradi_card_no: string
          phone_e164: string
          profile_slug?: string | null
          review_count?: number
          sipp_license_no: string
          sla_strikes?: number
          specialization_primary: string
          updated_at?: string
        }
        Update: {
          advocate_id?: string
          advocate_organization?: string
          avatar_initials?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          email?: string
          experience_years?: number
          full_name?: string
          has_probono_quota?: boolean
          is_online?: boolean
          kyc_status?: string
          nik_ktp?: string | null
          npwp_number?: string | null
          payout_bank_account_holder?: string | null
          payout_bank_account_no?: string | null
          payout_bank_name?: string | null
          peradi_card_no?: string
          phone_e164?: string
          profile_slug?: string | null
          review_count?: number
          sipp_license_no?: string
          sla_strikes?: number
          specialization_primary?: string
          updated_at?: string
        }
        Relationships: []
      }
      users_client: {
        Row: {
          avatar_url: string | null
          client_id: string
          created_at: string
          email: string
          email_summary_enabled: boolean
          full_name: string
          kyc_status: string
          nik_ktp: string | null
          password_hash: string
          phone_e164: string
          review_anonymized_default: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          client_id?: string
          created_at?: string
          email: string
          email_summary_enabled?: boolean
          full_name: string
          kyc_status?: string
          nik_ktp?: string | null
          password_hash: string
          phone_e164: string
          review_anonymized_default?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          client_id?: string
          created_at?: string
          email?: string
          email_summary_enabled?: boolean
          full_name?: string
          kyc_status?: string
          nik_ktp?: string | null
          password_hash?: string
          phone_e164?: string
          review_anonymized_default?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      wallet_balances: {
        Row: {
          balance_available_idr: number
          balance_held_idr: number
          updated_at: string
          user_id: string
          user_type: string
          wallet_id: string
        }
        Insert: {
          balance_available_idr?: number
          balance_held_idr?: number
          updated_at?: string
          user_id: string
          user_type: string
          wallet_id?: string
        }
        Update: {
          balance_available_idr?: number
          balance_held_idr?: number
          updated_at?: string
          user_id?: string
          user_type?: string
          wallet_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      frontend_advocate_catalog_v: {
        Row: {
          avatarInitials: string | null
          bio: string | null
          experienceYears: number | null
          hasProBonoQuota: boolean | null
          id: string | null
          isOnline: boolean | null
          license: string | null
          licenseBody: string | null
          name: string | null
          rating: number | null
          reviewCount: number | null
          services: Json | null
          slug: string | null
          specialty: string | null
        }
        Relationships: []
      }
      frontend_consultation_slots_v: {
        Row: {
          advocateId: string | null
          advocateName: string | null
          advocateRating: number | null
          advocateTitle: string | null
          id: string | null
          isBooked: boolean | null
          slotTimeLabel: string | null
          specialty: string | null
        }
        Relationships: []
      }
      frontend_escrow_transactions_v: {
        Row: {
          advocateName: string | null
          amount: number | null
          clientEmail: string | null
          createdAt: string | null
          id: string | null
          mutexLockId: string | null
          slotId: string | null
          status: string | null
          tierId: string | null
          wormAuditHash: string | null
        }
        Relationships: []
      }
      frontend_irac_analysis_v: {
        Row: {
          application: string | null
          caseTitle: string | null
          conclusion: string | null
          confidenceScore: number | null
          generatedAt: string | null
          id: string | null
          issue: string | null
          relevantArticles: Json | null
          rule: string | null
          storyOfFacts: string | null
        }
        Insert: {
          application?: string | null
          caseTitle?: never
          conclusion?: string | null
          confidenceScore?: never
          generatedAt?: string | null
          id?: never
          issue?: string | null
          relevantArticles?: Json | null
          rule?: string | null
          storyOfFacts?: never
        }
        Update: {
          application?: string | null
          caseTitle?: never
          conclusion?: string | null
          confidenceScore?: never
          generatedAt?: string | null
          id?: never
          issue?: string | null
          relevantArticles?: Json | null
          rule?: string | null
          storyOfFacts?: never
        }
        Relationships: []
      }
      frontend_legal_document_drafts_v: {
        Row: {
          advocateName: string | null
          clauses: Json | null
          clientName: string | null
          createdAt: string | null
          id: string | null
          opponentName: string | null
          templateId: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      fn_activate_corporate_pricing_catalog: {
        Args: { p_catalog_id: string }
        Returns: undefined
      }
      fn_append_compliance_workflow_event: {
        Args: {
          p_actor_user_id: string
          p_corporate_case_id: string
          p_envelope_id: string
          p_escrow_id: string
          p_event_type: string
          p_idempotency_key: string
          p_occurred_at: string
          p_verification_id: string
        }
        Returns: string
      }
      fn_book_consultation_slot_mutex: {
        Args: {
          p_booking_type?: string
          p_case_summary: string
          p_slot_id: string
        }
        Returns: {
          advocate_id: string
          advocate_name: string
          amount_idr: number
          booking_code: string
          booking_id: string
          created_at: string
          escrow_id: string
          escrow_status: string
          mutex_lock_id: string
          payment_gateway_ref: string
          slot_id: string
          tier_id: string
        }[]
      }
      fn_can_read_signing_envelope: {
        Args: { p_envelope_id: string }
        Returns: boolean
      }
      fn_confirm_party_illegal_atomic: {
        Args: {
          p_actor_user_id: string
          p_envelope_id: string
          p_idempotency_key: string
          p_party_id: string
          p_verification_id: string
        }
        Returns: string
      }
      fn_create_corporate_intake_atomic: {
        Args: {
          p_actor_user_id: string
          p_authorized_capital_idr: number
          p_beneficial_owners: Json
          p_domicile_city: string
          p_domicile_province: string
          p_entity_type: string
          p_idempotency_key: string
          p_kbli_snapshot: Json
          p_legal_scope_version: string
          p_order_id: string
          p_paid_up_capital_idr: number
          p_payment_gateway_ref: string
          p_proposed_name: string
          p_total_amount_idr: number
        }
        Returns: {
          corporate_case_id: string
          escrow_id: string
          replayed: boolean
        }[]
      }
      fn_create_corporate_intake_complete_atomic: {
        Args: {
          p_actor_user_id: string
          p_authorized_capital_idr: number
          p_beneficial_owners: Json
          p_client_id: string
          p_corporate_parties: Json
          p_domicile_city: string
          p_domicile_province: string
          p_entity_type: string
          p_fee_lines: Json
          p_idempotency_key: string
          p_kbli_snapshot: Json
          p_legal_scope_version: string
          p_order_id: string
          p_paid_up_capital_idr: number
          p_payment_gateway_ref: string
          p_payment_milestones: Json
          p_proposed_name: string
          p_total_amount_idr: number
        }
        Returns: {
          corporate_case_id: string
          escrow_id: string
          order_id: string
          replayed: boolean
        }[]
      }
      fn_current_compliance_event_actor: { Args: never; Returns: string }
      fn_global_halt_ekyc_and_refund_atomic: {
        Args: {
          p_actor_user_id: string
          p_envelope_id: string
          p_halt_reason: Database["public"]["Enums"]["signing_envelope_halt_reason"]
          p_idempotency_key: string
          p_party_id: string
          p_verification_id: string
        }
        Returns: {
          envelope_id: string
          escrow_id: string
          escrow_status: string
          global_status: Database["public"]["Enums"]["signing_envelope_global_status"]
          replayed: boolean
        }[]
      }
      fn_is_verified_advocate: {
        Args: { p_advocate_id: string }
        Returns: boolean
      }
      fn_lock_corporate_escrow_atomic: {
        Args: {
          p_actor_user_id: string
          p_case_id: string
          p_escrow_id: string
          p_expected_amount_idr: number
          p_idempotency_key: string
          p_payment_gateway_ref: string
        }
        Returns: {
          corporate_case_id: string
          escrow_id: string
          escrow_locked_at: string
          expires_at: string
          replayed: boolean
        }[]
      }
      fn_lock_corporate_escrow_webhook_atomic: {
        Args: {
          p_case_id: string
          p_escrow_id: string
          p_expected_amount_idr: number
          p_idempotency_key: string
          p_order_id: string
          p_payment_gateway_ref: string
        }
        Returns: {
          corporate_case_id: string
          escrow_id: string
          escrow_locked_at: string
          expires_at: string
          replayed: boolean
        }[]
      }
      fn_mutate_wallet_balance_mutex: {
        Args: {
          p_amount: number
          p_mutation_type: string
          p_reference_id?: string
          p_wallet_id: string
        }
        Returns: number
      }
      fn_process_ekyc_callback_atomic: {
        Args: {
          p_envelope_id: string
          p_idempotency_key: string
          p_liveness_attempt_count: number
          p_outcome: string
          p_party_id: string
          p_provider_name: string
          p_provider_reference_id: string
          p_result_digest_sha256: string
          p_user_id: string
          p_user_role: Database["public"]["Enums"]["ekyc_user_role"]
          p_verification_type: Database["public"]["Enums"]["ekyc_verification_type"]
          p_verified_at: string
        }
        Returns: {
          expired: boolean
          global_status: Database["public"]["Enums"]["signing_envelope_global_status"]
          replayed: boolean
          verification_id: string
        }[]
      }
      fn_record_immutable_audit_log: {
        Args: {
          p_action_type: string
          p_actor_type: string
          p_actor_user_id: string
          p_metadata_json: Json
          p_target_resource: string
        }
        Returns: string
      }
      fn_refund_escrow_to_client_mutex: {
        Args: { p_escrow_id: string; p_refund_reason: string }
        Returns: boolean
      }
      fn_release_escrow_to_advocate_mutex: {
        Args: { p_escrow_id: string }
        Returns: boolean
      }
      fn_retire_corporate_pricing_catalog: {
        Args: { p_catalog_id: string }
        Returns: undefined
      }
      fn_transition_corporate_service_case: {
        Args: {
          p_case_id: string
          p_expected_stage: string
          p_next_stage: string
        }
        Returns: {
          assigned_compliance_reviewer_id: string | null
          assigned_notary_id: string | null
          authorized_capital_idr: number | null
          case_id: string
          created_at: string
          current_stage: string
          domicile_city: string
          domicile_province: string
          entity_type: string
          kbli_snapshot: Json
          legal_scope_version: string
          order_id: string
          paid_up_capital_idr: number | null
          proposed_name: string
          target_sla_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "corporate_service_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_verify_public_legal_document: {
        Args: { p_sha256_hash: string }
        Returns: {
          digest_match: boolean
          document_title: string
          document_type: string
          emeterai_serial: string
          emeterai_status: string
          finalized_at: string
          signature_provider_status: string
          verification_id: string
          warning: string
        }[]
      }
      fn_webhook_settle_escrow_mutex: {
        Args: {
          p_amount: number
          p_order_id: string
          p_provider_event_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      document_anchor_source:
        | "JUSTICA_WORM"
        | "PERURI_EMETERAI"
        | "PSRE_DIGITAL_SIGN"
      ekyc_user_role: "client" | "advocate"
      ekyc_verification_status:
        | "PENDING"
        | "PASSED"
        | "REJECTED"
        | "REQUIRES_MANUAL_REVIEW"
      ekyc_verification_type: "LIVENESS_OCR" | "SIPP_BIOMETRIC"
      notary_submission_status: "DRAFT" | "SUBMITTED" | "REJECTED" | "APPROVED"
      notary_submission_target_system:
        | "AHU_SABH"
        | "AHU_SABU"
        | "AHU_BO"
        | "OSS_RBA"
      payout_channel: "BI_FAST" | "RTGS" | "VIRTUAL_ACCOUNT"
      payout_idempotency_status: "INITIATED" | "SUCCESS" | "FAILED"
      signing_case_type: "CONSULTATION" | "CORPORATE"
      signing_envelope_global_status:
        | "ACTIVE"
        | "HALTED"
        | "REFUND_PENDING"
        | "REFUNDED"
        | "COMPLETED"
      signing_envelope_halt_reason:
        | "PARTY_ILLEGAL"
        | "LIVENESS_FAILED_3X"
        | "TTL_EXPIRED"
      signing_envelope_status:
        | "DRAFT"
        | "SENT"
        | "PARTIALLY_SIGNED"
        | "COMPLETED"
        | "VOIDED"
        | "EXPIRED"
      signing_party_role: "CLIENT" | "ADVOCATE" | "NOTARY" | "WITNESS"
      signing_party_status: "PENDING" | "SIGNED" | "REJECTED"
      webhook_processed_status: "PENDING" | "PROCESSED" | "FAILED" | "RETRYING"
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
      document_anchor_source: [
        "JUSTICA_WORM",
        "PERURI_EMETERAI",
        "PSRE_DIGITAL_SIGN",
      ],
      ekyc_user_role: ["client", "advocate"],
      ekyc_verification_status: [
        "PENDING",
        "PASSED",
        "REJECTED",
        "REQUIRES_MANUAL_REVIEW",
      ],
      ekyc_verification_type: ["LIVENESS_OCR", "SIPP_BIOMETRIC"],
      notary_submission_status: ["DRAFT", "SUBMITTED", "REJECTED", "APPROVED"],
      notary_submission_target_system: [
        "AHU_SABH",
        "AHU_SABU",
        "AHU_BO",
        "OSS_RBA",
      ],
      payout_channel: ["BI_FAST", "RTGS", "VIRTUAL_ACCOUNT"],
      payout_idempotency_status: ["INITIATED", "SUCCESS", "FAILED"],
      signing_case_type: ["CONSULTATION", "CORPORATE"],
      signing_envelope_global_status: [
        "ACTIVE",
        "HALTED",
        "REFUND_PENDING",
        "REFUNDED",
        "COMPLETED",
      ],
      signing_envelope_halt_reason: [
        "PARTY_ILLEGAL",
        "LIVENESS_FAILED_3X",
        "TTL_EXPIRED",
      ],
      signing_envelope_status: [
        "DRAFT",
        "SENT",
        "PARTIALLY_SIGNED",
        "COMPLETED",
        "VOIDED",
        "EXPIRED",
      ],
      signing_party_role: ["CLIENT", "ADVOCATE", "NOTARY", "WITNESS"],
      signing_party_status: ["PENDING", "SIGNED", "REJECTED"],
      webhook_processed_status: ["PENDING", "PROCESSED", "FAILED", "RETRYING"],
    },
  },
} as const
