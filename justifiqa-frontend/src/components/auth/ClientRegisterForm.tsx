import type { FormEvent } from 'react';
import { CheckCircle2, CreditCard, Mail, Phone, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ClientRegistrationFields } from '@/types/authForms';

interface ClientRegisterFormProps { fields: ClientRegistrationFields; submitting: boolean; onChange: <K extends keyof ClientRegistrationFields>(key: K, value: ClientRegistrationFields[K]) => void; onSubmit: (event: FormEvent) => void }

export function ClientRegisterForm({ fields, submitting, onChange, onSubmit }: ClientRegisterFormProps) {
  const iconInput = (icon: React.ReactNode, input: React.ReactNode) => <div className="relative flex items-center"><span className="absolute left-3.5 text-muted-foreground">{icon}</span>{input}</div>;
  return (
    <form onSubmit={onSubmit} className="space-y-3.5 animate-fade-in">
      <label className="space-y-1.5 text-xs font-semibold text-foreground">Nomor Induk Kependudukan (NIK){iconInput(<CreditCard className="w-5 h-5" />, <Input value={fields.nik} onChange={(event) => onChange('nik', event.target.value)} placeholder="3171234567890001" maxLength={16} required style={{ paddingLeft: '3.25rem' }} className="w-full pr-4 h-11 rounded-xl bg-secondary border-border font-mono" />)}</label>
      <label className="space-y-1.5 text-xs font-semibold text-foreground">Nama Lengkap Sesuai KTP{iconInput(<UserCheck className="w-5 h-5" />, <Input value={fields.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Budi Santoso" required style={{ paddingLeft: '3.25rem' }} className="w-full pr-4 h-11 rounded-xl bg-secondary border-border" />)}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="space-y-1 text-xs font-semibold text-foreground">WhatsApp Aktif{iconInput(<Phone className="w-4 h-4" />, <Input type="tel" value={fields.phone} onChange={(event) => onChange('phone', event.target.value)} placeholder="+6281234567890" required style={{ paddingLeft: '2.5rem' }} className="w-full pr-3 h-10 rounded-xl bg-secondary border-border text-xs font-mono" />)}</label>
        <label className="space-y-1 text-xs font-semibold text-foreground">Alamat Email{iconInput(<Mail className="w-4 h-4" />, <Input type="email" value={fields.email} onChange={(event) => onChange('email', event.target.value)} placeholder="budi@email.com" required style={{ paddingLeft: '2.5rem' }} className="w-full pr-3 h-10 rounded-xl bg-secondary border-border text-xs" />)}</label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="space-y-1 text-xs font-semibold text-foreground">Kata Sandi Baru<Input type="password" value={fields.password} onChange={(event) => onChange('password', event.target.value)} placeholder="••••••••••••" required className="w-full px-3 h-10 rounded-xl bg-secondary border-border text-xs font-mono" /></label><label className="space-y-1 text-xs font-semibold text-foreground">Konfirmasi Sandi<Input type="password" value={fields.confirmPassword} onChange={(event) => onChange('confirmPassword', event.target.value)} placeholder="••••••••••••" required className="w-full px-3 h-10 rounded-xl bg-secondary border-border text-xs font-mono" /></label></div>
      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground"><input type="checkbox" checked={fields.agreeTerms} onChange={(event) => onChange('agreeTerms', event.target.checked)} required className="rounded border-border bg-secondary text-blue-600 mt-0.5 w-4 h-4" /><span className="leading-tight text-[11px]">Saya menyetujui <strong className="text-foreground">Ketentuan Layanan</strong> &amp; <strong className="text-foreground">Kebijakan Privasi NDA</strong> Justica.</span></label>
      <Button type="submit" size="lg" disabled={submitting} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl gap-2"><CheckCircle2 className="w-5 h-5" />{submitting ? 'MEMBUAT AKUN...' : 'DAFTAR SEKARANG'}</Button>
    </form>
  );
}
