-- ============================================================================
-- JUSTICA PHYSICAL DATABASE MIGRATION SCRIPT
-- Phase 4B - Batch 3: Domain 3 (Escrow Transactions, Tax PPh 21 & Ledgers)
-- Target DBMS: PostgreSQL 15+ / Supabase
-- Compliance: 1-to-1 Bi-Directional Mapping with Baseline commit 0cad127
-- Includes: ACID Mutex Row Lock PL/pgSQL Transition Functions
-- ============================================================================

-- ============================================================================
-- 13. TABLE: escrow_transactions (Rekening Bersama & Masa Sanggah 24 Jam)
-- ============================================================================
CREATE TABLE IF NOT EXISTS escrow_transactions (
    escrow_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id            UUID          NOT NULL,
    client_id             UUID          NOT NULL,
    advocate_id           UUID          NOT NULL,
    total_amount_idr      NUMERIC(15,2) NOT NULL,
    status                VARCHAR(32)   NOT NULL,
    holding_expires_at    TIMESTAMPTZ   NOT NULL,
    client_payout_ratio   NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
    advocate_payout_ratio NUMERIC(5,2)  NOT NULL DEFAULT 100.00,
    payment_gateway_ref   VARCHAR(64)   NOT NULL,
    is_mutex_locked       BOOLEAN       NOT NULL DEFAULT false,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_escrow_booking FOREIGN KEY (booking_id)
        REFERENCES booking_sessions(booking_id) ON DELETE RESTRICT,
    CONSTRAINT fk_escrow_client FOREIGN KEY (client_id)
        REFERENCES users_client(client_id) ON DELETE RESTRICT,
    CONSTRAINT fk_escrow_advocate FOREIGN KEY (advocate_id)
        REFERENCES users_advocate(advocate_id) ON DELETE RESTRICT,
    CONSTRAINT chk_escrow_total_amount CHECK (total_amount_idr >= 0),
    CONSTRAINT chk_escrow_status CHECK (
        status IN (
            'PENDING_PAYMENT',
            'HELD_IN_ESCROW',
            'HOLDING_PERIOD_24H',
            'FROZEN_DISPUTE',
            'RELEASED_TO_ADVOCATE',
            'REFUNDED_TO_CLIENT',
            'RESOLVED_SPLIT_SETTLEMENT'
        )
    ),
    CONSTRAINT chk_escrow_ratios CHECK (
        client_payout_ratio >= 0.00 AND client_payout_ratio <= 100.00 AND
        advocate_payout_ratio >= 0.00 AND advocate_payout_ratio <= 100.00
    )
);

-- Indexing for holding period expiration cron jobs and dispute lookups
CREATE INDEX IF NOT EXISTS idx_escrow_holding_expires ON escrow_transactions(status, holding_expires_at);
CREATE INDEX IF NOT EXISTS idx_escrow_client_advocate ON escrow_transactions(client_id, advocate_id);

-- Enable Row-Level Security (RLS)
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can read their own escrow records
CREATE POLICY rls_escrow_transactions_client_read ON escrow_transactions
    FOR SELECT
    USING (client_id = auth.uid());

-- RLS Policy: Advocates can read their own escrow records
CREATE POLICY rls_escrow_transactions_advocate_read ON escrow_transactions
    FOR SELECT
    USING (advocate_id = auth.uid());


-- ============================================================================
-- 14. TABLE: wallet_balances (Dompet Saldo Klien & Advokat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallet_balances (
    wallet_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID          NOT NULL,
    user_type             VARCHAR(16)   NOT NULL,
    balance_available_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    balance_held_idr      NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wallet_user UNIQUE (user_id, user_type),
    CONSTRAINT chk_wallet_user_type CHECK (user_type IN ('CLIENT', 'ADVOCATE')),
    CONSTRAINT chk_wallet_available CHECK (balance_available_idr >= 0),
    CONSTRAINT chk_wallet_held CHECK (balance_held_idr >= 0)
);

-- Indexing for user wallet lookup
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user ON wallet_balances(user_id, user_type);

-- Enable Row-Level Security (RLS)
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own wallet balances (MOCK-J-AD-05)
CREATE POLICY rls_wallet_balances_self_read ON wallet_balances
    FOR SELECT
    USING (user_id = auth.uid());


-- ============================================================================
-- 15. TABLE: escrow_payout_ledgers (Buku Besar Mutasi Finansial)
-- ============================================================================
CREATE TABLE IF NOT EXISTS escrow_payout_ledgers (
    ledger_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id     UUID          NOT NULL,
    wallet_id     UUID          NOT NULL,
    mutation_type VARCHAR(32)   NOT NULL,
    amount_idr    NUMERIC(15,2) NOT NULL,
    description   VARCHAR(256)  NOT NULL,
    executed_at   TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_escrow_payout_mutation UNIQUE (escrow_id, mutation_type, wallet_id),
    CONSTRAINT fk_ledger_escrow FOREIGN KEY (escrow_id)
        REFERENCES escrow_transactions(escrow_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_wallet FOREIGN KEY (wallet_id)
        REFERENCES wallet_balances(wallet_id) ON DELETE RESTRICT,
    CONSTRAINT chk_ledger_mutation_type CHECK (
        mutation_type IN ('RELEASE_ADVOCATE', 'REFUND_CLIENT', 'SPLIT_SETTLEMENT')
    )
);

-- Indexing for payout auditing and wallet ledger history
CREATE INDEX IF NOT EXISTS idx_payout_ledgers_wallet ON escrow_payout_ledgers(wallet_id, executed_at);

-- Enable Row-Level Security (RLS)
ALTER TABLE escrow_payout_ledgers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Wallet owners can read their ledger mutation history
CREATE POLICY rls_payout_ledgers_wallet_owner_read ON escrow_payout_ledgers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM wallet_balances wb
            WHERE wb.wallet_id = escrow_payout_ledgers.wallet_id
              AND wb.user_id = auth.uid()
        )
    );


-- ============================================================================
-- 16. TABLE: tax_pph21_withholdings (Bukti Potong PPh 21 Otomatis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tax_pph21_withholdings (
    tax_receipt_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id         UUID          NOT NULL,
    escrow_id           UUID          NOT NULL,
    gross_income_idr    NUMERIC(15,2) NOT NULL,
    tax_rate_percentage NUMERIC(5,2)  NOT NULL,
    tax_withheld_idr    NUMERIC(15,2) NOT NULL,
    npwp_number         VARCHAR(32)   NOT NULL,
    einvoice_ref        VARCHAR(64)   NOT NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tax_advocate FOREIGN KEY (advocate_id)
        REFERENCES users_advocate(advocate_id) ON DELETE RESTRICT,
    CONSTRAINT fk_tax_escrow FOREIGN KEY (escrow_id)
        REFERENCES escrow_transactions(escrow_id) ON DELETE RESTRICT
);

-- Indexing for advocate tax reporting (MOCK-J-AD-05) and admin audit (MOCK-J-AM-04)
CREATE INDEX IF NOT EXISTS idx_tax_pph21_advocate ON tax_pph21_withholdings(advocate_id, created_at);

-- Enable Row-Level Security (RLS)
ALTER TABLE tax_pph21_withholdings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Advocates can view their own PPh 21 withholding receipts
CREATE POLICY rls_tax_pph21_advocate_read ON tax_pph21_withholdings
    FOR SELECT
    USING (advocate_id = auth.uid());


-- ============================================================================
-- 17. TABLE: platform_governance_configs (Konfigurasi Parameter Escrow)
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_governance_configs (
    config_key          VARCHAR(64) PRIMARY KEY,
    config_value        VARCHAR(256) NOT NULL,
    description         TEXT         NOT NULL,
    updated_by_admin_id UUID         NOT NULL,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_config_admin FOREIGN KEY (updated_by_admin_id)
        REFERENCES users_admin(admin_id) ON DELETE RESTRICT
);

-- Enable Row-Level Security (RLS)
ALTER TABLE platform_governance_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read-only for transparency on escrow parameters
CREATE POLICY rls_governance_configs_public_read ON platform_governance_configs
    FOR SELECT
    USING (true);


-- ============================================================================
-- ACID MUTEX ROW LOCK PL/pgSQL TRANSITION FUNCTION
-- Function: fn_release_escrow_to_advocate_mutex(p_escrow_id UUID)
-- Guarantees atomic transition from HOLDING_PERIOD_24H -> RELEASED_TO_ADVOCATE
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_release_escrow_to_advocate_mutex(
    p_escrow_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_escrow RECORD;
    v_advocate_wallet_id UUID;
    v_net_payout NUMERIC(15,2);
BEGIN
    -- 1. Mutex Row Lock on escrow_transactions
    SELECT * INTO v_escrow
    FROM escrow_transactions
    WHERE escrow_id = p_escrow_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Escrow Transaction % not found.', p_escrow_id;
    END IF;

    -- 2. State Guard Rule validation
    IF v_escrow.status <> 'HOLDING_PERIOD_24H' THEN
        RAISE EXCEPTION 'Guard Rule Failed: Escrow status is %, expected HOLDING_PERIOD_24H.', v_escrow.status;
    END IF;

    -- 3. Lock or create target advocate wallet balance row
    SELECT wallet_id INTO v_advocate_wallet_id
    FROM wallet_balances
    WHERE user_id = v_escrow.advocate_id AND user_type = 'ADVOCATE'
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO wallet_balances (user_id, user_type, balance_available_idr, balance_held_idr)
        VALUES (v_escrow.advocate_id, 'ADVOCATE', 0.00, 0.00)
        RETURNING wallet_id INTO v_advocate_wallet_id;
    END IF;

    -- 4. Calculate Net Payout (75% to advocate after platform fee)
    v_net_payout := v_escrow.total_amount_idr * 0.75;

    -- 5. Atomic Updates
    UPDATE escrow_transactions
    SET status = 'RELEASED_TO_ADVOCATE',
        is_mutex_locked = false
    WHERE escrow_id = p_escrow_id;

    UPDATE wallet_balances
    SET balance_available_idr = balance_available_idr + v_net_payout,
        updated_at = CURRENT_TIMESTAMP
    WHERE wallet_id = v_advocate_wallet_id;

    INSERT INTO escrow_payout_ledgers (
        escrow_id, wallet_id, mutation_type, amount_idr, description
    ) VALUES (
        p_escrow_id, v_advocate_wallet_id, 'RELEASE_ADVOCATE', v_net_payout,
        'Pencairan dana Escrow 75% setelah melewati masa sanggah 24 jam'
    );

    RETURN TRUE;
END;
$$;

-- ============================================================================
-- END OF BATCH 3 DDL, RLS & ACID MIGRATION (DOMAIN 3: TABLES 13 TO 17)
-- ============================================================================
