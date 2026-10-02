/**
 * AdvocateLoginPage — Alias entry point untuk halaman autentikasi advokat.
 * Re-exports AdvocateAuthPage agar router dapat mount via path /advocate/login
 * sesuai naming convention Batch 1 CLAUDE_FRONTEND_BATCHING_PLAN.md.
 *
 * Konten full ada di AdvocateAuthPage.tsx (NIA + FIDO2 biometric + KYC verification).
 */
export { AdvocateAuthPage as AdvocateLoginPage } from '../AdvocateAuthPage';
