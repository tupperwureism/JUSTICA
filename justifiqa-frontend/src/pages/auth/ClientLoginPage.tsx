/**
 * ClientLoginPage — Alias entry point untuk halaman autentikasi klien.
 * Re-exports ClientAuthPage agar router dapat mount via path /client/login
 * sesuai naming convention Batch 1 CLAUDE_FRONTEND_BATCHING_PLAN.md.
 *
 * Konten full ada di ClientAuthPage.tsx (NIK/Email login + Registrasi + FIDO2).
 */
export { ClientAuthPage as ClientLoginPage } from '../ClientAuthPage';
