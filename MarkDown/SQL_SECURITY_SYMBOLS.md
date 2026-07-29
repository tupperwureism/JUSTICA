# SQL SECURITY SYMBOLS

> GENERATED FILE — jangan edit manual. Baca file ini secara on-demand setelah `SYMBOLS_MAP.md` mengarahkan ke area database.
> Perbarui/verifikasi bersama peta utama memakai `node Tools/generate_symbol_map.mjs [--check]`.

- 146 canonical policies/triggers.
- Lokasi memakai `S/` = `supabase/migrations/` dan `D/` = `database/migrations/`; `+N` berarti ada N deklarasi lama.

| Kind | Symbol/relation | Deklarasi pilihan/terbaru |
| --- | --- | --- |
| policy | "consultationparticipantsreceivebroadcasts" ON realtime.messages | S/20260721000013_add_realtime_room_and_client_release.sql:L4 |
| policy | "consultationparticipantssendbroadcasts" ON realtime.messages | S/20260721000013_add_realtime_room_and_client_release.sql:L16 |
| policy | "participantsdownloadlegalopinions" ON storage.objects | S/20260721000013_add_realtime_room_and_client_release.sql:L32 |
| policy | rls_advocate_reviews_client_submit ON public.advocate_reviews | S/20260721000010_align_frontend_schema_contracts.sql:L470 +2 |
| policy | rls_advocate_reviews_participant_read ON public.advocate_reviews | S/20260721000010_align_frontend_schema_contracts.sql:L467 |
| policy | rls_advocate_reviews_public_read ON advocate_reviews | S/20260715000002_domain2_consultation_fairclock_sla.sql:L187 +1 |
| policy | rls_advocate_sanctions_advocate_read ON advocate_sanctions_log | S/20260715000001_domain1_identity_rbac_licensing.sql:L247 +1 |
| policy | rls_advocate_sanctions_compliance_insert ON public.advocate_sanctions_log | S/20260721000010_align_frontend_schema_contracts.sql:L550 |
| policy | rls_advocate_sanctions_compliance_read ON public.advocate_sanctions_log | S/20260721000010_align_frontend_schema_contracts.sql:L545 |
| policy | rls_advocate_service_tiers_advocate_manage ON public.advocate_service_tiers | S/20260721000010_align_frontend_schema_contracts.sql:L333 +2 |
| policy | rls_advocate_service_tiers_public_read ON advocate_service_tiers | S/20260715000001_domain1_identity_rbac_licensing.sql:L211 +1 |
| policy | rls_audit_logs_compliance_read ON public.audit_logs_worm | S/20260721000010_align_frontend_schema_contracts.sql:L627 |
| policy | rls_audit_logs_worm_self_read ON audit_logs_worm | S/20260715000005_domain5_probono_disputes_worm_audit.sql:L139 +1 |
| policy | rls_beneficial_owners_participant_read ON public.beneficial_owners | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L438 |
| policy | rls_booking_sessions_advocate_access ON booking_sessions | S/20260715000002_domain2_consultation_fairclock_sla.sql:L87 +1 |
| policy | rls_booking_sessions_advocate_read ON public.booking_sessions | S/20260721000015_harden_verified_advocate_rls_helper.sql:L18 +1 |
| policy | rls_booking_sessions_advocate_update ON public.booking_sessions | S/20260721000010_align_frontend_schema_contracts.sql:L309 |
| policy | rls_booking_sessions_client_access ON booking_sessions | S/20260715000002_domain2_consultation_fairclock_sla.sql:L81 +1 |
| policy | rls_booking_sessions_client_insert ON public.booking_sessions | S/20260721000010_align_frontend_schema_contracts.sql:L296 |
| policy | rls_booking_sessions_client_read ON public.booking_sessions | S/20260721000010_align_frontend_schema_contracts.sql:L294 |
| policy | rls_booking_sessions_client_update ON public.booking_sessions | S/20260721000010_align_frontend_schema_contracts.sql:L298 |
| policy | rls_booking_sessions_mediator_read ON public.booking_sessions | S/20260721000010_align_frontend_schema_contracts.sql:L606 |
| policy | rls_case_irac_advocate_insert ON public.case_irac_notes | S/20260721000010_align_frontend_schema_contracts.sql:L390 |
| policy | rls_case_irac_advocate_read ON public.case_irac_notes | S/20260721000010_align_frontend_schema_contracts.sql:L385 +2 |
| policy | rls_chat_sessions_metadata_participant_insert ON public.chat_sessions_metadata | S/20260721000010_align_frontend_schema_contracts.sql:L458 |
| policy | rls_chat_sessions_metadata_participant_read ON public.chat_sessions_metadata | S/20260721000010_align_frontend_schema_contracts.sql:L452 |
| policy | rls_chat_sessions_metadata_participants ON chat_sessions_metadata | S/20260715000002_domain2_consultation_fairclock_sla.sql:L148 +1 |
| policy | rls_compliance_assessments_restricted_insert ON public.compliance_assessments | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L480 |
| policy | rls_compliance_assessments_restricted_read ON public.compliance_assessments | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L459 |
| policy | rls_compliance_assessments_restricted_update ON public.compliance_assessments | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L504 |
| policy | rls_compliance_workflow_events_compliance_read ON public.compliance_workflow_events_worm | S/20260722000022_p2_b5a_ekyc_and_escrow_schema.sql:L300 |
| policy | rls_consultation_slots_advocate_manage ON public.consultation_slots | S/20260721000010_align_frontend_schema_contracts.sql:L321 +2 |
| policy | rls_consultation_slots_public_read ON consultation_slots | S/20260715000002_domain2_consultation_fairclock_sla.sql:L36 +1 |
| policy | rls_corporate_cases_participant_read ON public.corporate_service_cases | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L398 |
| policy | rls_corporate_parties_participant_read ON public.corporate_parties | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L417 |
| policy | rls_dispute_cases_client_insert ON public.dispute_cases | S/20260721000010_align_frontend_schema_contracts.sql:L410 |
| policy | rls_dispute_cases_mediator_read ON public.dispute_cases | S/20260721000010_align_frontend_schema_contracts.sql:L576 |
| policy | rls_dispute_cases_mediator_update ON public.dispute_cases | S/20260721000010_align_frontend_schema_contracts.sql:L581 |
| policy | rls_dispute_cases_participant_read ON public.dispute_cases | S/20260721000010_align_frontend_schema_contracts.sql:L398 +2 |
| policy | rls_dispute_signatures_mediator_insert ON public.dispute_mediator_signatures | S/20260721000010_align_frontend_schema_contracts.sql:L598 |
| policy | rls_dispute_signatures_mediator_read ON public.dispute_mediator_signatures | S/20260721000010_align_frontend_schema_contracts.sql:L593 +2 |
| policy | rls_document_anchors_assigned_notary_insert ON public.document_integrity_anchors | S/20260722000021_phase2_holistic_security_hardening.sql:L111 +1 |
| policy | rls_document_anchors_assigned_notary_read ON public.document_integrity_anchors | S/20260722000020_p2_b8_notary_workspace_and_kemenkumham_seams.sql:L152 |
| policy | rls_document_anchors_client_read ON public.document_integrity_anchors | S/20260722000020_p2_b8_notary_workspace_and_kemenkumham_seams.sql:L158 |
| policy | rls_document_revisions_client_insert ON public.document_revisions | S/20260721000010_align_frontend_schema_contracts.sql:L427 |
| policy | rls_document_revisions_participant_access ON document_revisions | S/20260715000004_domain4_legal_opinions_worm_emeterai.sql:L98 +1 |
| policy | rls_document_revisions_participant_read ON public.document_revisions | S/20260721000010_align_frontend_schema_contracts.sql:L421 |
| policy | rls_ekyc_logs_subject_read ON public.ekyc_verification_logs | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L321 |
| policy | rls_emeterai_participant_read ON public.emeterai_stamping_logs | S/20260722000016_p2_b3_service_orders_expand_only.sql:L178 |
| policy | rls_emeterai_public_verify ON emeterai_stamping_logs | S/20260715000004_domain4_legal_opinions_worm_emeterai.sql:L131 +1 |
| policy | rls_escrow_transactions_advocate_read ON public.escrow_transactions | S/20260721000015_harden_verified_advocate_rls_helper.sql:L23 +3 |
| policy | rls_escrow_transactions_client_read ON escrow_transactions | S/20260715000003_domain3_escrow_tax_ledgers_acid.sql:L57 +1 |
| policy | rls_escrow_transactions_corporate_participant_read ON public.escrow_transactions | S/20260722000022_p2_b5a_ekyc_and_escrow_schema.sql:L197 |
| policy | rls_escrow_transactions_mediator_read ON public.escrow_transactions | S/20260721000010_align_frontend_schema_contracts.sql:L620 |
| policy | rls_governance_configs_admin_insert ON public.platform_governance_configs | S/20260721000010_align_frontend_schema_contracts.sql:L636 |
| policy | rls_governance_configs_admin_update ON public.platform_governance_configs | S/20260721000010_align_frontend_schema_contracts.sql:L641 |
| policy | rls_governance_configs_public_read ON platform_governance_configs | S/20260715000003_domain3_escrow_tax_ledgers_acid.sql:L182 +1 |
| policy | rls_government_jobs_assigned_notary_insert ON public.government_submission_jobs | S/20260722000021_phase2_holistic_security_hardening.sql:L98 +1 |
| policy | rls_government_jobs_assigned_notary_read ON public.government_submission_jobs | S/20260722000020_p2_b8_notary_workspace_and_kemenkumham_seams.sql:L125 |
| policy | rls_government_jobs_assigned_notary_update ON public.government_submission_jobs | S/20260722000021_phase2_holistic_security_hardening.sql:L104 +1 |
| policy | rls_government_jobs_client_read ON public.government_submission_jobs | S/20260722000020_p2_b8_notary_workspace_and_kemenkumham_seams.sql:L131 |
| policy | rls_government_jobs_professional_read ON public.government_submission_jobs | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L547 |
| policy | rls_legal_opinions_advocate_access ON legal_opinions | S/20260715000004_domain4_legal_opinions_worm_emeterai.sql:L71 +1 |
| policy | rls_legal_opinions_advocate_insert ON public.legal_opinions | S/20260721000010_align_frontend_schema_contracts.sql:L367 |
| policy | rls_legal_opinions_advocate_read ON public.legal_opinions | S/20260721000015_harden_verified_advocate_rls_helper.sql:L28 +1 |
| policy | rls_legal_opinions_advocate_update ON public.legal_opinions | S/20260721000010_align_frontend_schema_contracts.sql:L372 |
| policy | rls_legal_opinions_client_access ON legal_opinions | S/20260715000004_domain4_legal_opinions_worm_emeterai.sql:L65 +1 |
| policy | rls_legal_opinions_client_read ON public.legal_opinions | S/20260721000010_align_frontend_schema_contracts.sql:L354 |
| policy | rls_legal_opinions_mediator_read ON public.legal_opinions | S/20260721000010_align_frontend_schema_contracts.sql:L613 |
| policy | rls_offline_handshakes_participant_access ON offline_handshakes_totp | S/20260715000002_domain2_consultation_fairclock_sla.sql:L114 +1 |
| policy | rls_offline_handshakes_participant_insert ON public.offline_handshakes_totp | S/20260721000010_align_frontend_schema_contracts.sql:L442 |
| policy | rls_offline_handshakes_participant_read ON public.offline_handshakes_totp | S/20260721000010_align_frontend_schema_contracts.sql:L436 |
| policy | rls_payment_milestones_participant_read ON public.payment_milestones | S/20260722000016_p2_b3_service_orders_expand_only.sql:L563 |
| policy | rls_payout_ledgers_wallet_owner_read ON public.escrow_payout_ledgers | S/20260728000025_phase2_backend_forensic_hardening.sql:L989 +2 |
| policy | rls_probono_cases_client_insert ON public.probono_cases | S/20260721000010_align_frontend_schema_contracts.sql:L482 |
| policy | rls_probono_cases_client_read ON probono_cases | S/20260715000005_domain5_probono_disputes_worm_audit.sql:L35 +1 |
| policy | rls_probono_cases_compliance_read ON public.probono_cases | S/20260721000010_align_frontend_schema_contracts.sql:L559 |
| policy | rls_probono_cases_compliance_update ON public.probono_cases | S/20260721000010_align_frontend_schema_contracts.sql:L564 |
| policy | rls_provider_webhook_events_client_read ON public.provider_webhook_events | S/20260722000019_p2_b7_b8_payment_webhook_and_idempotency_seams.sql:L122 |
| policy | rls_service_fee_lines_participant_read ON public.service_fee_lines | S/20260722000016_p2_b3_service_orders_expand_only.sql:L541 |
| policy | rls_service_orders_participant_read ON public.service_orders | S/20260722000016_p2_b3_service_orders_expand_only.sql:L525 |
| policy | rls_signing_envelopes_authorized_read ON public.signing_envelopes | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L332 |
| policy | rls_signing_parties_authorized_read ON public.signing_envelope_parties | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L336 |
| policy | rls_sipp_verifications_advocate_read ON sipp_verifications | S/20260715000001_domain1_identity_rbac_licensing.sql:L182 +1 |
| policy | rls_sipp_verifications_compliance_insert ON public.sipp_verifications | S/20260721000010_align_frontend_schema_contracts.sql:L528 |
| policy | rls_sipp_verifications_compliance_read ON public.sipp_verifications | S/20260721000010_align_frontend_schema_contracts.sql:L523 |
| policy | rls_sipp_verifications_compliance_update ON public.sipp_verifications | S/20260721000010_align_frontend_schema_contracts.sql:L533 |
| policy | rls_tax_pph21_advocate_read ON tax_pph21_withholdings | S/20260715000003_domain3_escrow_tax_ledgers_acid.sql:L160 +1 |
| policy | rls_user_active_devices_self_manage ON user_active_devices | S/20260715000001_domain1_identity_rbac_licensing.sql:L142 +1 |
| policy | rls_user_notifications_self_read ON user_notifications | S/20260715000005_domain5_probono_disputes_worm_audit.sql:L169 +1 |
| policy | rls_user_notifications_self_select ON public.user_notifications | S/20260721000010_align_frontend_schema_contracts.sql:L488 |
| policy | rls_user_notifications_self_update ON public.user_notifications | S/20260721000010_align_frontend_schema_contracts.sql:L490 |
| policy | rls_users_admin_internal_access ON users_admin | S/20260715000001_domain1_identity_rbac_licensing.sql:L114 +1 |
| policy | rls_users_admin_self_read ON public.users_admin | S/20260721000010_align_frontend_schema_contracts.sql:L498 |
| policy | rls_users_admin_self_update ON public.users_admin | S/20260721000010_align_frontend_schema_contracts.sql:L500 |
| policy | rls_users_advocate_compliance_read ON public.users_advocate | S/20260721000010_align_frontend_schema_contracts.sql:L505 |
| policy | rls_users_advocate_compliance_update ON public.users_advocate | S/20260721000010_align_frontend_schema_contracts.sql:L510 |
| policy | rls_users_advocate_public_read ON users_advocate | S/20260715000001_domain1_identity_rbac_licensing.sql:L83 +1 |
| policy | rls_users_advocate_self_update ON public.users_advocate | S/20260721000010_align_frontend_schema_contracts.sql:L285 +2 |
| policy | rls_users_client_self_access ON users_client | S/20260715000001_domain1_identity_rbac_licensing.sql:L42 +1 |
| policy | rls_users_client_self_read ON public.users_client | S/20260721000010_align_frontend_schema_contracts.sql:L279 |
| policy | rls_users_client_self_update ON public.users_client | S/20260721000010_align_frontend_schema_contracts.sql:L281 |
| policy | rls_wallet_balances_self_read ON wallet_balances | S/20260715000003_domain3_escrow_tax_ledgers_acid.sql:L90 +1 |
| trigger | trg_assert_completed_envelope_anchor ON public.signing_envelopes | S/20260722000021_phase2_holistic_security_hardening.sql:L75 |
| trigger | trg_audit_corporate_escrow_lock ON public.corporate_service_cases | S/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql:L238 |
| trigger | trg_audit_escrow_state_transition ON public.escrow_transactions | S/20260728000025_phase2_backend_forensic_hardening.sql:L131 +1 |
| trigger | trg_audit_signing_global_transition ON public.signing_envelopes | S/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql:L246 |
| trigger | trg_guard_corporate_case_stage_mutation ON public.corporate_service_cases | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L320 |
| trigger | trg_guard_corporate_notary_assignment ON public.corporate_service_cases | S/20260728000025_phase2_backend_forensic_hardening.sql:L267 |
| trigger | trg_guard_corporate_pricing_catalog_mutation ON public.corporate_pricing_catalogs | S/20260729021138_add_versioned_corporate_pricing_catalog.sql:L349 |
| trigger | trg_guard_corporate_pricing_fee_lines_mutation ON public.corporate_pricing_fee_lines | S/20260729021138_add_versioned_corporate_pricing_catalog.sql:L353 |
| trigger | trg_guard_corporate_pricing_milestones_mutation ON public.corporate_pricing_milestones | S/20260729021138_add_versioned_corporate_pricing_catalog.sql:L357 |
| trigger | trg_guard_ekyc_log_mutation ON public.ekyc_verification_logs | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L253 |
| trigger | trg_guard_escrow_financial_state ON public.escrow_transactions | S/20260728000025_phase2_backend_forensic_hardening.sql:L83 |
| trigger | trg_guard_payout_idempotency_mutation ON public.payout_idempotency_keys | S/20260728000025_phase2_backend_forensic_hardening.sql:L978 |
| trigger | trg_guard_provider_webhook_event_mutation ON public.provider_webhook_events | S/20260728000025_phase2_backend_forensic_hardening.sql:L932 |
| trigger | trg_guard_signing_envelope_mutation ON public.signing_envelopes | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L256 |
| trigger | trg_guard_signing_party_mutation ON public.signing_envelope_parties | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L259 |
| trigger | trg_protect_accepted_service_fee_line ON public.service_fee_lines | S/20260722000016_p2_b3_service_orders_expand_only.sql:L402 |
| trigger | trg_protect_payment_milestone_terms ON public.payment_milestones | S/20260722000016_p2_b3_service_orders_expand_only.sql:L435 |
| trigger | trg_reconcile_payment_milestones ON public.payment_milestones | S/20260722000016_p2_b3_service_orders_expand_only.sql:L513 |
| trigger | trg_reconcile_service_fee_lines ON public.service_fee_lines | S/20260722000016_p2_b3_service_orders_expand_only.sql:L508 |
| trigger | trg_reconcile_service_order ON public.service_orders | S/20260722000016_p2_b3_service_orders_expand_only.sql:L503 |
| trigger | trg_sync_notary_submission_contract ON public.government_submission_jobs | S/20260722000020_p2_b8_notary_workspace_and_kemenkumham_seams.sql:L103 |
| trigger | trg_touch_beneficial_owners ON public.beneficial_owners | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L296 |
| trigger | trg_touch_compliance_assessments ON public.compliance_assessments | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L299 |
| trigger | trg_touch_corporate_parties ON public.corporate_parties | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L293 |
| trigger | trg_touch_corporate_pricing_catalogs ON public.corporate_pricing_catalogs | S/20260729021138_add_versioned_corporate_pricing_catalog.sql:L361 |
| trigger | trg_touch_corporate_pricing_fee_lines ON public.corporate_pricing_fee_lines | S/20260729021138_add_versioned_corporate_pricing_catalog.sql:L365 |
| trigger | trg_touch_corporate_pricing_milestones ON public.corporate_pricing_milestones | S/20260729021138_add_versioned_corporate_pricing_catalog.sql:L369 |
| trigger | trg_touch_corporate_service_cases ON public.corporate_service_cases | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L290 |
| trigger | trg_touch_government_submission_jobs ON public.government_submission_jobs | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L302 |
| trigger | trg_validate_corporate_service_case_order ON public.corporate_service_cases | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L275 |
| trigger | trg_validate_document_integrity_anchor ON public.document_integrity_anchors | S/20260722000021_phase2_holistic_security_hardening.sql:L51 |
| trigger | trg_validate_signing_envelope_case ON public.signing_envelopes | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L250 |
| trigger | trg_validate_signing_envelope_escrow_binding ON public.signing_envelopes | S/20260728000025_phase2_backend_forensic_hardening.sql:L219 |
| trigger | trg_worm_advocate_sanctions_vault ON public.advocate_sanctions_log | S/20260716000006_domain_hardening_worm_and_acid_mutex.sql:L22 +1 |
| trigger | trg_worm_audit_logs_vault ON public.audit_logs_worm | S/20260721000011_fix_plpgsql_mutex_and_worm_functions.sql:L33 +2 |
| trigger | trg_worm_case_irac_notes ON case_irac_notes | S/20260715000004_domain4_legal_opinions_worm_emeterai.sql:L174 +1 |
| trigger | trg_worm_compliance_workflow_events ON public.compliance_workflow_events_worm | S/20260722000022_p2_b5a_ekyc_and_escrow_schema.sql:L285 |
| trigger | trg_worm_dispute_signatures_vault ON public.dispute_mediator_signatures | S/20260716000006_domain_hardening_worm_and_acid_mutex.sql:L29 +1 |
| trigger | trg_worm_document_integrity_anchors ON public.document_integrity_anchors | S/20260722000019_p2_b7_b8_payment_webhook_and_idempotency_seams.sql:L57 |
| trigger | trg_worm_emeterai_stamping_logs ON public.emeterai_stamping_logs | S/20260721000011_fix_plpgsql_mutex_and_worm_functions.sql:L27 +2 |
| trigger | trg_worm_escrow_payout_ledgers_vault ON public.escrow_payout_ledgers | S/20260716000006_domain_hardening_worm_and_acid_mutex.sql:L36 +1 |
| trigger | trg_worm_legal_opinions_vault ON public.legal_opinions | S/20260721000011_fix_plpgsql_mutex_and_worm_functions.sql:L21 |
| trigger | trg_z_guard_government_submission_transition ON public.government_submission_jobs | S/20260728000025_phase2_backend_forensic_hardening.sql:L336 |
