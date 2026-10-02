import type { FormEvent } from 'react';
import { CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ClientLoginFields } from '@/types/authForms';

interface ClientLoginFormProps { fields: ClientLoginFields; showSuccess: boolean; submitting: boolean; onChange: <K extends keyof ClientLoginFields>(key: K, value: ClientLoginFields[K]) => void; onSubmit: (event: FormEvent) => void }

export function ClientLoginForm({ fields, showSuccess, submitting, onChange, onSubmit }: ClientLoginFormProps) {
  return (
    <>
      {showSuccess && <div role="status" className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-start gap-3 animate-fade-in text-xs"><CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" /><p className="font-semibold leading-relaxed text-emerald-600 dark:text-emerald-300">Registrasi akun GoTrue berhasil! Silakan masuk menggunakan kata sandi Anda untuk memverifikasi kredensial dan melanjutkan ke dasbor.</p></div>}
      <form onSubmit={onSubmit} className="space-y-4 animate-fade-in">
        <div className="space-y-1.5"><label className="text-xs font-semibold text-foreground flex items-center justify-between"><span>Email atau NIK Terdaftar</span><span className="text-[11px] text-muted-foreground font-mono">16-Digit NIK / Email</span></label><div className="relative flex items-center"><Mail className="absolute left-3.5 w-5 h-5 text-muted-foreground" /><Input value={fields.identifier} onChange={(event) => onChange('identifier', event.target.value)} placeholder="budi.santoso@email.com" required style={{ paddingLeft: '3.25rem' }} className="w-full pr-4 h-12 rounded-xl bg-secondary border-border text-sm" /></div></div>
        <div className="space-y-1.5"><div className="flex justify-between items-center"><label className="text-xs font-semibold text-foreground">Kata Sandi</label><button type="button" onClick={() => alert('Instruksi pemulihan kata sandi telah dikirim ke email dan WhatsApp terdaftar.')} className="text-xs text-blue-400 hover:text-blue-300 font-medium">Lupa Kata Sandi?</button></div><div className="relative flex items-center"><KeyRound className="absolute left-3.5 w-5 h-5 text-muted-foreground" /><Input type="password" value={fields.password} onChange={(event) => onChange('password', event.target.value)} placeholder="••••••••••••••••" required style={{ paddingLeft: '3.25rem' }} className="w-full pr-4 h-12 rounded-xl bg-secondary border-border text-sm font-mono" /></div></div>
        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-muted-foreground"><input type="checkbox" checked={fields.rememberMe} onChange={(event) => onChange('rememberMe', event.target.checked)} className="rounded border-border bg-secondary text-blue-600 w-4 h-4" />Ingat saya di perangkat ini</label>
        <div className="p-4 rounded-2xl bg-secondary/60 border border-border space-y-2.5"><div className="flex justify-between items-center"><label className="text-xs font-semibold text-foreground flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-blue-400" />Kode Keamanan OTP (6-Digit)</label><button type="button" onClick={() => alert('Kode OTP baru telah dikirimkan ke WhatsApp & Email Anda.')} className="text-[11px] text-blue-400 font-mono font-bold">Kirim Ulang Kode (00:59)</button></div><Input value={fields.otp} onChange={(event) => onChange('otp', event.target.value)} placeholder="8  4  9  2  0  1" maxLength={6} required className="w-full h-11 rounded-xl bg-background border-border text-base text-center text-blue-400 font-mono font-extrabold tracking-[0.5em]" /></div>
        <Button type="submit" size="lg" disabled={submitting} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl gap-2"><CheckCircle2 className="w-5 h-5" />{submitting ? 'MEMVERIFIKASI SESI...' : 'MASUK SEKARANG'}</Button>
      </form>
    </>
  );
}
