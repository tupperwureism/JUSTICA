# SYMBOLS MAP

> GENERATED FILE — jangan edit manual. Kode adalah sumber kebenaran.
> Perbarui: `node Tools/generate_symbol_map.mjs`; verifikasi: `node Tools/generate_symbol_map.mjs --check`.

## Cakupan

- 186 source files dipindai.
- 239 exported TypeScript symbols dalam 155 files.
- 95 core PostgreSQL objects dari 333 deklarasi migrasi.
- 134 policies/triggers tersedia on-demand di `MarkDown/SQL_SECURITY_SYMBOLS.md`.
- Lokasi SQL memakai `S/` = `supabase/migrations/` dan `D/` = `database/migrations/`; `+N` berarti ada N deklarasi lama.
- Migrasi `supabase/` diprioritaskan di atas salinan `database/`; peta deklarasi ini bukan rekonstruksi state database setelah seluruh migrasi.
- Indeks SQL sengaja tidak dimuat agar peta tetap ringkas; cari dengan `rg "CREATE .*INDEX" database supabase` bila diperlukan.
- Kode simbol frontend: `f` function, `v` variable/const, `i` interface, `t` type, `c` class, `e` enum, `d` default, `x` re-export.
- Import internal dipindai tetapi tidak dicetak; gunakan `rg` setelah menemukan simbol sasaran.

## Frontend TypeScript

| File (relatif ke `justifiqa-frontend/src`) | Exported symbols |
| --- | --- |
| App.tsx | 4v App |
| components/BaseLayout.tsx | 12v BaseLayout |
| components/ConsultationBookingModal.tsx | 14v ConsultationBookingModal |
| components/ConsultationSection.tsx | 7i ConsultationSectionProps, 11v ConsultationSection |
| components/DocumentDraftingModal.tsx | 18v DocumentDraftingModal |
| components/Footer.tsx | 4v Footer |
| components/IracCard.tsx | 7i IracCardProps, 12v IracCard |
| components/IracFormCard.tsx | 5i PresetFact, 10i IracFormCardProps, 22v IracFormCard |
| components/IracHeaderSection.tsx | 4v IracHeaderSection |
| components/IracPillarCard.tsx | 3i IracPillarCardProps, 15v IracPillarCard |
| components/IracSection.tsx | 8i IracSectionProps, 27v IracSection |
| components/Navbar.tsx | 12v Navbar |
| components/TierSelectorCard.tsx | 11v TierSelectorCard |
| components/admin/AdminComplianceTab.tsx | 11f AdminComplianceTab |
| components/admin/AdminDisputeCenterTab.tsx | 19f AdminDisputeCenterTab |
| components/admin/AdminHeaderAndTabs.tsx | 5t AdminTabKey, 22f AdminHeaderAndTabs |
| components/admin/AdminSettingsPanel.tsx | 8f AdminSettingsPanel |
| components/admin/AdminVerificationQueueTab.tsx | 11f AdminVerificationQueueTab |
| components/advocate/AdvocateE2EEChatPanel.tsx | 16f AdvocateE2EEChatPanel |
| components/advocate/AdvocateE2EEHeaderAndSla.tsx | 13f AdvocateE2EEHeaderAndSla |
| components/advocate/AdvocateGreetingCard.tsx | 13f AdvocateGreetingCard |
| components/advocate/AdvocateHeaderAndTabs.tsx | 8t AdvocateTabKey, 33f AdvocateHeaderAndTabs |
| components/advocate/CommandCenterActiveCasesTable.tsx | 13f CommandCenterActiveCasesTable |
| components/advocate/ScheduleManagementCard.tsx | 6t ScheduleDayKey, 7t ScheduleSlots, 20f ScheduleManagementCard |
| components/auth/AdvocateAuthIntro.tsx | 7f AdvocateAuthIntro |
| components/auth/AdvocateAuthPromoPanel.tsx | 9f AdvocateAuthPromoPanel |
| components/auth/AdvocateKycResult.tsx | 11f AdvocateKycResult |
| components/auth/AdvocateLoginForm.tsx | 9f AdvocateLoginForm |
| components/auth/AdvocateRegisterForm.tsx | 10f AdvocateRegisterForm |
| components/auth/AuthPortalHeader.tsx | 8f AuthPortalHeader |
| components/auth/ClientAuthIntro.tsx | 7f ClientAuthIntro |
| components/auth/ClientAuthPromoPanel.tsx | 9f ClientAuthPromoPanel |
| components/auth/ClientLoginForm.tsx | 9f ClientLoginForm |
| components/auth/ClientRegisterForm.tsx | 9f ClientRegisterForm |
| components/client/AccountSettingsTab.tsx | 10f AccountSettingsTab |
| components/client/AdvocateBookingPanel.tsx | 21v AdvocateBookingPanel |
| components/client/AdvocateCatalogCard.tsx | 10v AdvocateCatalogCard |
| components/client/AdvocateCatalogFilters.tsx | 18v AdvocateCatalogFilters |
| components/client/AdvocateCatalogTab.tsx | 11v AdvocateCatalogTab |
| components/client/AdvocateProfileDetailModal.tsx | 15v AdvocateProfileDetailModal |
| components/client/AdvocateProfileDetails.tsx | 7v AdvocateProfileDetails |
| components/client/CheckoutEscrowModal.tsx | 24v CheckoutEscrowModal |
| components/client/CheckoutOrderForm.tsx | 8v CheckoutOrderForm |
| components/client/CheckoutOrderSummary.tsx | 6v CheckoutOrderSummary |
| components/client/CheckoutPaymentInstructions.tsx | 21v CheckoutPaymentInstructions |
| components/client/CheckoutSuccessReceipt.tsx | 8v CheckoutSuccessReceipt |
| components/client/ClientActiveConsultationsTable.tsx | 9v ClientActiveConsultationsTable |
| components/client/ClientCatalogFilterBar.tsx | 5i ClientCatalogFilterBarProps, 12v ClientCatalogFilterBar |
| components/client/ClientCatalogTab.tsx | 6i ClientCatalogTabProps, 14v ClientCatalogTab |
| components/client/ClientGreetingCard.tsx | 12v ClientGreetingCard |
| components/client/ClientHeaderAndTabs.tsx | 16f ClientHeaderAndTabs |
| components/client/ClientHistoryDocumentsTable.tsx | 8v ClientHistoryDocumentsTable |
| components/client/ClientIracHeader.tsx | 5v ClientIracHeader |
| components/client/ClientIracTab.tsx | 6i ClientIracTabProps, 10v ClientIracTab |
| components/client/ClientOverviewTab.tsx | 7i ClientOverviewTabProps, 15v ClientOverviewTab |
| components/client/ClientOverviewTables.tsx | 15v ClientOverviewTables |
| components/client/ClientTabNav.tsx | 17f ClientTabNav |
| components/client/EscrowPaymentForm.tsx | 13v EscrowPaymentForm |
| components/client/EscrowStatusBanner.tsx | 7i EscrowStatusBannerProps, 12v EscrowStatusBanner |
| components/client/ProBonoApplicationForm.tsx | 6v ProBonoApplicationForm |
| components/client/checkoutPricing.ts | 1v formatCurrency, 3v getEscrowTotal |
| components/client/dispute/DisputeCenterHeader.tsx | 11f DisputeCenterHeader |
| components/client/dispute/DisputeFormModal.tsx | 11f DisputeFormModal |
| components/client/dispute/DisputeInvestigationTimeline.tsx | 4f DisputeInvestigationTimeline |
| components/client/dispute/DisputeMonitoringPanel.tsx | 11f DisputeMonitoringPanel |
| components/client/dispute/DisputeTicketTable.tsx | 3f DisputeTicketTable |
| components/client/dispute/disputeData.ts | 1v disputeCategories, 8v investigationLogs |
| components/client/modals/FairClockGuardrailModal.tsx | 8f FairClockGuardrailModal |
| components/client/modals/OfflineConsultationQRModal.tsx | 10f OfflineConsultationQRModal |
| components/client/modals/ReviewRatingModal.tsx | 12f ReviewRatingModal |
| components/client/room/ChatComposer.tsx | 14f ChatComposer |
| components/client/room/ChatTranscript.tsx | 8f ChatTranscript |
| components/client/room/ConsultationInfoPanel.tsx | 11f ConsultationInfoPanel |
| components/client/room/ConsultationRoomHeader.tsx | 16f ConsultationRoomHeader |
| components/client/room/ConsultationViewSwitcher.tsx | 4t ConsultationView, 11f ConsultationViewSwitcher |
| components/client/room/DeliverableVaultPanel.tsx | 13f DeliverableVaultPanel |
| components/client/room/EncryptedChatPanel.tsx | 16f EncryptedChatPanel |
| components/client/room/roomData.ts | 1i ChatMessage |
| components/client/settings/ActiveDevicesTable.tsx | 6f ActiveDevicesTable |
| components/client/settings/PrivacySettingsPanel.tsx | 5f PrivacySettingsPanel |
| components/client/settings/SecuritySettingsPanel.tsx | 5f SecuritySettingsPanel |
| components/common/PreChatMoUModal.tsx | 19f PreChatMoUModal |
| components/consultation/ConsultationBookingForm.tsx | 17f ConsultationBookingForm |
| components/consultation/ConsultationBookingReceipt.tsx | 6f ConsultationBookingReceipt |
| components/corporate/AdvocateCorporateCaseManager.tsx | 9f AdvocateCorporateCaseManager |
| components/corporate/ClientCorporateSuiteTab.tsx | 5f ClientCorporateSuiteTab |
| components/corporate/CorporateCaseTrackerPanel.tsx | 13f CorporateCaseTrackerPanel |
| components/corporate/CorporateIntakeStepFields.tsx | 22f CorporateIntakeStepFields |
| components/corporate/CorporateIntakeWizard.tsx | 11f CorporateIntakeWizard |
| components/corporate/corporateUiModel.ts | 1t CorporateEntityType, 3t CorporateIntakeDraft, 13v INTAKE_STEPS, 21v CORPORATE_STAGES, 34v EMPTY_INTAKE_DRAFT |
| components/corporate/notary/KemenkumhamStampingModal.tsx | 8t NotaryStampingRequest, 20f KemenkumhamStampingModal |
| components/corporate/notary/NotaryCaseWorkspacePanel.tsx | 14f NotaryCaseWorkspacePanel |
| components/document/DocumentDraftActions.tsx | 6f DocumentDraftActions |
| components/document/DocumentDraftPreview.tsx | 6f DocumentDraftPreview |
| components/document/DocumentDraftingForm.tsx | 18f DocumentDraftingForm |
| components/gateway/AdvocateQuickProfile.tsx | 11v AdvocateQuickProfile |
| components/gateway/HeroSearchSection.tsx | 21v HeroSearchSection |
| components/gateway/NavbarGateway.tsx | 15v NavbarGateway |
| components/gateway/PortalCardItem.tsx | 20v PortalCardItem |
| components/gateway/PortalCardsGrid.tsx | 9v PortalCardsGrid |
| components/gateway/SearchPreviewCard.tsx | 16v SearchPreviewCard |
| components/gateway/TrustBarSection.tsx | 8v TrustBarSection |
| components/gateway/VerifierPanel.tsx | 13v VerifierPanel |
| components/payment/EscrowDisbursementTrackerPanel.tsx | 19f EscrowDisbursementTrackerPanel |
| components/payment/PaymentGatewaySelectorModal.tsx | 7t PaymentGatewayMethod, 19f PaymentGatewaySelectorModal |
| components/signing/EkycVerificationWizard.tsx | 14f EkycVerificationWizard |
| components/signing/MultiPartySigningPanel.tsx | 7t SigningParty, 10f MultiPartySigningPanel |
| components/ui/badge.tsx | 50x Badge, 50x badgeVariants |
| components/ui/button.tsx | 66x Button, 66x buttonVariants |
| components/ui/card.tsx | 84x Card, 84x CardHeader, 84x CardFooter, 84x CardTitle, 84x CardAction, 84x CardDescription, 84x CardContent |
| components/ui/input.tsx | 21x Input |
| components/verifier/PublicVerifierFormCard.tsx | 20f PublicVerifierFormCard |
| components/verifier/PublicVerifierHero.tsx | 3f PublicVerifierHero |
| components/verifier/PublicVerifierResult.tsx | 9f PublicVerifierResult |
| data/clientAdvocates.ts | 3v MOCK_ADVOCATES |
| data/clientPortalData.ts | 3v DEFAULT_CLIENT_SESSION_ID, 5v ACTIVE_CONSULTATIONS, 24v HISTORY_DOCUMENTS |
| data/documentDraftingData.ts | 3v DOCUMENT_TEMPLATES |
| hooks/authSessionContext.ts | 5i AuthSessionState, 11v AuthSessionContext |
| hooks/useAuthSession.tsx | 14f AuthSessionProvider |
| hooks/useDocumentDrafting.ts | 7f useDocumentDrafting |
| hooks/usePortalSession.ts | 4f usePortalSession |
| hooks/usePublicVerifier.ts | 9t VerifyStatus, 11t PublicVerificationResult, 17f usePublicVerifier |
| hooks/useRealtimeChat.ts | 7t RealtimeChatStatus, 19f useRealtimeChat |
| hooks/useVaultDelivery.ts | 4f useVaultDelivery |
| lib/supabase.ts | 20v supabase |
| lib/utils.ts | 4f cn |
| pages/AdminDashboardPage.tsx | 10f AdminDashboardPage |
| pages/AdvocateAuthPage.tsx | 15v AdvocateAuthPage |
| pages/AdvocateDashboardPage.tsx | 20v AdvocateDashboardPage |
| pages/AiNavigatorPage.tsx | 10v AiNavigatorPage |
| pages/ClientAuthPage.tsx | 15v ClientAuthPage |
| pages/ClientConsultationRoomPage.tsx | 13f ClientConsultationRoomPage |
| pages/ClientDashboardPage.tsx | 16v ClientDashboardPage |
| pages/ClientDisputeCenterPage.tsx | 7f ClientDisputeCenterPage |
| pages/GatewayPage.tsx | 7x GatewayPage |
| pages/LandingGatewayPage.tsx | 15v LandingGatewayPage |
| pages/PublicDocumentVerifierPage.tsx | 9v PublicDocumentVerifierPage |
| pages/admin/AdminLoginPage.tsx | 10f AdminLoginPage |
| pages/auth/AdvocateLoginPage.tsx | 8x AdvocateLoginPage |
| pages/auth/ClientLoginPage.tsx | 8x ClientLoginPage |
| router/AppRouter.tsx | 28v AppRouter |
| router/PortalProtectedRoute.tsx | 11f PortalProtectedRoute |
| services/consultationService.ts | 15f getAvailableConsultationSlots, 52f checkoutConsultation |
| services/mockConsultationService.ts | 8v TIER_CATALOG, 65v MOCK_ADVOCATE_SLOTS, 98c MockConsultationService |
| services/mockIracService.ts | 8c MockIracService |
| services/portalAuthService.ts | 12f signInPortal, 22f registerPortal, 39f signOutPortal, 44f authErrorMessage |
| services/roomSessionService.ts | 3i RoomSession, 11f resolveRoomSession |
| services/vaultDeliveryService.ts | 4i VaultDocument, 23f getVaultDocument, 41f createVaultDownloadUrl, 47f releaseVaultEscrow |
| types/auth.ts | 1t UserRole, 3i AuthSession, 12v DEFAULT_SESSIONS |
| types/authForms.ts | 1t ThemeMode, 2t AuthTab, 3t SyncStatus, 5i ClientLoginFields, 6i ClientRegistrationFields, 7i AdvocateLoginFields, 8i AdvocateRegistrationFields |
| types/client.ts | 4t ClientTabKey, 6i ActiveConsultation, 15i HistoryDocument, 23i ServiceOption, 32i Advocate, 49i TimeSlot, 54i CheckoutDraft |
| types/consultation.ts | 1t ConsultationTierId, 3t EscrowStatus, 5i ConsultationTier, 18i ConsultationSlot, 29i LiveConsultationSlot, 31i ConsultationCheckout, 46i EscrowTransaction, 59i BookingRequest |
| types/database.types.ts | 1t Json, 9t Database, 2327t Tables, 2356t TablesInsert, 2381t TablesUpdate, 2406t Enums, 2423t CompositeTypes, 2440v Constants |
| types/irac.ts | 1t LegalDocumentTemplateId, 3i IracAnalysis, 16i DocumentClause, 22i LegalDocumentDraft |
| types/portalAuth.ts | 3t PortalRole, 5v portalHome, 11v portalLogin, 17f getPortalRole, 22f safePortalRedirect |

## Database PostgreSQL

| Kind | Symbol/signature | Deklarasi pilihan/terbaru |
| --- | --- | --- |
| function | public.fn_append_compliance_workflow_event( p_corporate_case_id UUID, p_escrow_id UUID, p… | S/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql:L30 |
| function | public.fn_assert_completed_envelope_anchor() | S/20260722000021_phase2_holistic_security_hardening.sql:L55 |
| function | public.fn_assert_service_order_financial_reconciliation() | S/20260722000016_p2_b3_service_orders_expand_only.sql:L439 |
| function | public.fn_audit_corporate_escrow_lock() | S/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql:L138 |
| function | public.fn_audit_escrow_state_transition() | S/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql:L162 |
| function | public.fn_audit_signing_global_transition() | S/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql:L200 |
| function | public.fn_book_consultation_slot_mutex( p_slot_id UUID, p_case_summary TEXT, p_booking_ty… | S/20260722000016_p2_b3_service_orders_expand_only.sql:L11 +4 |
| function | public.fn_can_read_signing_envelope(p_envelope_id UUID) | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L263 |
| function | public.fn_client_checkout_consultation_mutex( p_slot_id UUID, p_case_summary TEXT, p_book… | S/20260721000012_add_authenticated_checkout_rpc_facade.sql:L1 |
| function | public.fn_guard_corporate_case_stage_mutation() | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L306 |
| function | public.fn_confirm_party_illegal_atomic( p_envelope_id UUID, p_party_id UUID, p_verificati… | S/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql:L858 |
| function | public.fn_create_corporate_intake_atomic( p_order_id UUID, p_entity_type VARCHAR, p_propo… | S/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql:L261 |
| function | public.fn_current_compliance_event_actor() | S/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql:L9 |
| function | public.fn_global_halt_ekyc_and_refund_atomic( p_envelope_id UUID, p_party_id UUID, p_veri… | S/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql:L961 |
| function | public.fn_guard_ekyc_log_mutation() | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L136 |
| function | public.fn_guard_signing_envelope_mutation() | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L161 |
| function | public.fn_guard_signing_party_mutation() | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L206 |
| function | public.fn_is_verified_advocate(p_advocate_id UUID) | S/20260721000015_harden_verified_advocate_rls_helper.sql:L1 |
| function | public.fn_mutate_wallet_balance_mutex( p_wallet_id UUID, p_amount NUMERIC, p_mutation_typ… | S/20260721000011_fix_plpgsql_mutex_and_worm_functions.sql:L92 +3 |
| function | public.fn_prevent_worm_mutation() | S/20260721000011_fix_plpgsql_mutex_and_worm_functions.sql:L9 +5 |
| function | public.fn_lock_corporate_escrow_atomic( p_case_id UUID, p_escrow_id UUID, p_expected_amou… | S/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql:L617 |
| function | public.fn_protect_accepted_service_fee_line() | S/20260722000016_p2_b3_service_orders_expand_only.sql:L383 |
| function | public.fn_protect_payment_milestone_terms() | S/20260722000016_p2_b3_service_orders_expand_only.sql:L406 |
| function | public.fn_record_immutable_audit_log( p_actor_user_id UUID, p_actor_type VARCHAR, p_actio… | S/20260721000011_fix_plpgsql_mutex_and_worm_functions.sql:L212 +3 |
| function | public.fn_refund_escrow_to_client_mutex( p_escrow_id UUID, p_refund_reason TEXT ) | S/20260721000011_fix_plpgsql_mutex_and_worm_functions.sql:L149 +3 |
| function | public.fn_release_escrow_to_advocate_mutex(p_escrow_id UUID) | S/20260721000013_add_realtime_room_and_client_release.sql:L42 +3 |
| function | public.fn_sync_notary_submission_contract() | S/20260722000020_p2_b8_notary_workspace_and_kemenkumham_seams.sql:L56 |
| function | public.fn_touch_corporate_record_updated_at() | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L279 |
| function | public.fn_transition_corporate_service_case( p_case_id UUID, p_expected_stage VARCHAR, p_… | S/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql:L748 +1 |
| function | public.fn_validate_corporate_service_case_order() | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L250 |
| function | public.fn_validate_document_integrity_anchor() | S/20260722000021_phase2_holistic_security_hardening.sql:L20 |
| function | public.fn_validate_signing_envelope_case() | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L117 |
| function | public.fn_verify_public_legal_document(p_sha256_hash TEXT) | S/20260722000021_phase2_holistic_security_hardening.sql:L118 +1 |
| function | public.fn_webhook_settle_escrow_mutex( p_provider_event_id VARCHAR, p_order_id UUID, p_am… | S/20260722000019_p2_b7_b8_payment_webhook_and_idempotency_seams.sql:L61 |
| table | advocate_reviews | S/20260715000002_domain2_consultation_fairclock_sla.sql:L162 +1 |
| table | advocate_sanctions_log | S/20260715000001_domain1_identity_rbac_licensing.sql:L225 +1 |
| table | advocate_service_tiers | S/20260715000001_domain1_identity_rbac_licensing.sql:L190 +1 |
| table | audit_logs_worm | S/20260715000005_domain5_probono_disputes_worm_audit.sql:L117 +1 |
| table | booking_sessions | S/20260715000002_domain2_consultation_fairclock_sla.sql:L50 +1 |
| table | case_irac_notes | S/20260715000004_domain4_legal_opinions_worm_emeterai.sql:L145 +1 |
| table | chat_sessions_metadata | S/20260715000002_domain2_consultation_fairclock_sla.sql:L128 +1 |
| table | consultation_slots | S/20260715000002_domain2_consultation_fairclock_sla.sql:L11 +1 |
| table | dispute_cases | S/20260715000005_domain5_probono_disputes_worm_audit.sql:L43 +1 |
| table | dispute_mediator_signatures | S/20260715000005_domain5_probono_disputes_worm_audit.sql:L85 +1 |
| table | document_revisions | S/20260715000004_domain4_legal_opinions_worm_emeterai.sql:L80 +1 |
| table | emeterai_stamping_logs | S/20260715000004_domain4_legal_opinions_worm_emeterai.sql:L112 +1 |
| table | escrow_payout_ledgers | S/20260715000003_domain3_escrow_tax_ledgers_acid.sql:L98 +1 |
| table | escrow_transactions | S/20260715000003_domain3_escrow_tax_ledgers_acid.sql:L12 +1 |
| table | legal_opinions | S/20260715000004_domain4_legal_opinions_worm_emeterai.sql:L27 +1 |
| table | offline_handshakes_totp | S/20260715000002_domain2_consultation_fairclock_sla.sql:L96 +1 |
| table | platform_governance_configs | S/20260715000003_domain3_escrow_tax_ledgers_acid.sql:L168 +1 |
| table | probono_cases | S/20260715000005_domain5_probono_disputes_worm_audit.sql:L12 +1 |
| table | public.beneficial_owners | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L92 |
| table | public.compliance_assessments | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L145 |
| table | public.corporate_parties | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L56 |
| table | public.corporate_service_cases | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L7 |
| table | public.document_integrity_anchors | S/20260722000019_p2_b7_b8_payment_webhook_and_idempotency_seams.sql:L39 |
| table | public.ekyc_verification_logs | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L17 |
| table | public.government_submission_jobs | S/20260722000017_p2_b4_corporate_concierge_and_bo.sql:L189 |
| table | public.payment_milestones | S/20260722000016_p2_b3_service_orders_expand_only.sql:L317 |
| table | public.payout_idempotency_keys | S/20260722000019_p2_b7_b8_payment_webhook_and_idempotency_seams.sql:L26 |
| table | public.compliance_workflow_events_worm | S/20260722000022_p2_b5a_ekyc_and_escrow_schema.sql:L233 |
| table | public.provider_webhook_events | S/20260722000019_p2_b7_b8_payment_webhook_and_idempotency_seams.sql:L9 |
| table | public.service_fee_lines | S/20260722000016_p2_b3_service_orders_expand_only.sql:L287 |
| table | public.service_orders | S/20260722000016_p2_b3_service_orders_expand_only.sql:L246 |
| table | public.signing_envelope_parties | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L66 |
| table | public.signing_envelopes | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L42 |
| table | sipp_verifications | S/20260715000001_domain1_identity_rbac_licensing.sql:L151 +1 |
| table | tax_pph21_withholdings | S/20260715000003_domain3_escrow_tax_ledgers_acid.sql:L137 +1 |
| table | user_active_devices | S/20260715000001_domain1_identity_rbac_licensing.sql:L122 +1 |
| table | user_notifications | S/20260715000005_domain5_probono_disputes_worm_audit.sql:L153 +1 |
| table | users_admin | S/20260715000001_domain1_identity_rbac_licensing.sql:L97 +1 |
| table | users_advocate | S/20260715000001_domain1_identity_rbac_licensing.sql:L51 +1 |
| table | users_client | S/20260715000001_domain1_identity_rbac_licensing.sql:L14 +1 |
| table | wallet_balances | S/20260715000003_domain3_escrow_tax_ledgers_acid.sql:L70 +1 |
| type | public.document_anchor_source | S/20260722000019_p2_b7_b8_payment_webhook_and_idempotency_seams.sql:L7 |
| type | public.ekyc_user_role | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L5 |
| type | public.ekyc_verification_status | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L7 |
| type | public.ekyc_verification_type | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L6 |
| type | public.notary_submission_status | S/20260722000020_p2_b8_notary_workspace_and_kemenkumham_seams.sql:L5 |
| type | public.notary_submission_target_system | S/20260722000020_p2_b8_notary_workspace_and_kemenkumham_seams.sql:L4 |
| type | public.payout_channel | S/20260722000019_p2_b7_b8_payment_webhook_and_idempotency_seams.sql:L5 |
| type | public.payout_idempotency_status | S/20260722000019_p2_b7_b8_payment_webhook_and_idempotency_seams.sql:L6 |
| type | public.signing_envelope_global_status | S/20260722000022_p2_b5a_ekyc_and_escrow_schema.sql:L5 |
| type | public.signing_envelope_halt_reason | S/20260722000022_p2_b5a_ekyc_and_escrow_schema.sql:L13 |
| type | public.signing_case_type | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L10 |
| type | public.signing_envelope_status | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L11 |
| type | public.signing_party_role | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L14 |
| type | public.signing_party_status | S/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql:L15 |
| type | public.webhook_processed_status | S/20260722000019_p2_b7_b8_payment_webhook_and_idempotency_seams.sql:L4 |
| view | public.frontend_advocate_catalog_v | S/20260721000010_align_frontend_schema_contracts.sql:L138 |
| view | public.frontend_consultation_slots_v | S/20260721000010_align_frontend_schema_contracts.sql:L173 |
| view | public.frontend_escrow_transactions_v | S/20260721000010_align_frontend_schema_contracts.sql:L188 |
| view | public.frontend_irac_analysis_v | S/20260721000010_align_frontend_schema_contracts.sql:L213 |
| view | public.frontend_legal_document_drafts_v | S/20260721000010_align_frontend_schema_contracts.sql:L228 |
