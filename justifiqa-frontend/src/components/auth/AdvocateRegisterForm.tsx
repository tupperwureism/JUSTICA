import type { ChangeEvent, FormEvent } from 'react';
import { FileUp, Landmark, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdvocateRegistrationFields, SyncStatus } from '@/types/authForms';
import { AdvocateKycResult } from './AdvocateKycResult';

interface AdvocateRegisterFormProps { fields: AdvocateRegistrationFields; syncStatus: SyncStatus; onChange: <K extends keyof AdvocateRegistrationFields>(key: K, value: AdvocateRegistrationFields[K]) => void; onFileChange: (event: ChangeEvent<HTMLInputElement>) => void; onSubmit: (event: FormEvent) => void; onComplete: () => void }

export function AdvocateRegisterForm(props: AdvocateRegisterFormProps) {
  const upload = (title: string) => <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-secondary/60 p-4 text-xs text-muted-foreground hover:border-emerald-500"><FileUp className="size-5 shrink-0 text-emerald-500" /><span><strong className="block text-foreground">{title}</strong>JPG/PDF · Maksimal 10MB</span><input type="file" accept=".jpg,.jpeg,.pdf" required className="sr-only" onChange={props.onFileChange} /></label>;
  return (
    <form onSubmit={props.onSubmit} className="space-y-5 animate-fade-in">
      <section className="space-y-3"><h2 className="text-xs font-black uppercase tracking-wider text-emerald-500">1. Data Identitas &amp; Kredensial Advokat</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="space-y-1.5 text-xs font-semibold text-foreground">Nama Lengkap<Input value={props.fields.name} onChange={(event) => props.onChange('name', event.target.value)} placeholder="Dr. Mahendra Kusuma, S.H., M.H." required className="h-11 rounded-xl bg-secondary border-border" /></label>
        <label className="space-y-1.5 text-xs font-semibold text-foreground">Email Profesional<Input type="email" value={props.fields.email} onChange={(event) => props.onChange('email', event.target.value)} placeholder="mahendra.k@lawfirm.id" required className="h-11 rounded-xl bg-secondary border-border" /></label>
        <label className="space-y-1.5 text-xs font-semibold text-foreground">Kata Sandi GoTrue<Input type="password" value={props.fields.password} onChange={(event) => props.onChange('password', event.target.value)} required className="h-11 rounded-xl bg-secondary border-border" /></label>
        <label className="space-y-1.5 text-xs font-semibold text-foreground">Konfirmasi Kata Sandi<Input type="password" value={props.fields.confirmPassword} onChange={(event) => props.onChange('confirmPassword', event.target.value)} required className="h-11 rounded-xl bg-secondary border-border" /></label>
        <label className="space-y-1.5 text-xs font-semibold text-foreground">Nomor Induk Kependudukan (NIK KTP)<Input value={props.fields.nik} onChange={(event) => props.onChange('nik', event.target.value)} placeholder="3171234567890001" maxLength={16} required className="h-11 rounded-xl bg-secondary border-border font-mono" /></label>
        <label className="space-y-1.5 text-xs font-semibold text-foreground">Nomor SIPP Mahkamah Agung RI<Input value={props.fields.sipp} onChange={(event) => props.onChange('sipp', event.target.value)} placeholder="18293/PERADI/2015" required className="h-11 rounded-xl bg-secondary border-border font-mono" /></label>
        <label className="space-y-1.5 text-xs font-semibold text-foreground">Organisasi Advokat Menaungi<select value={props.fields.organization} onChange={(event) => props.onChange('organization', event.target.value)} className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground">{['PERADI', 'AAI', 'KAI', 'IKADIN'].map((organization) => <option key={organization}>{organization}</option>)}</select></label>
        <label className="space-y-1.5 text-xs font-semibold text-foreground">Nomor Rekening Bank Pencairan<Input value={props.fields.bank} onChange={(event) => props.onChange('bank', event.target.value)} placeholder="123-00-9876543-2 (Bank Mandiri/BCA/BNI)" required className="h-11 rounded-xl bg-secondary border-border" /></label>
      </div></section>
      <section className="space-y-3 border-t border-border pt-4"><h2 className="text-xs font-black uppercase tracking-wider text-emerald-500">2. Unggah Dokumen Legalitas Fisik Terverifikasi</h2>{upload('Foto Kartu Anggota Organisasi Advokat')}{upload('Foto Berita Acara Sumpah Advokat PT')}</section>
      <Button type="submit" disabled={props.syncStatus === 'syncing'} className="w-full min-h-12 rounded-xl bg-emerald-600 text-white font-black text-[10px] sm:text-xs whitespace-nowrap overflow-x-auto hover:bg-emerald-700">{props.syncStatus === 'syncing' ? <LoaderCircle className="size-5 animate-spin" /> : <Landmark className="size-5" />}{props.syncStatus === 'syncing' ? 'SINKRONISASI SIPP SEDANG BERJALAN...' : 'SINKRONISASIKAN SECARA REAL-TIME KE API MAHKAMAH AGUNG'}</Button>
      {props.syncStatus === 'verified' && <AdvocateKycResult onComplete={props.onComplete} />}
    </form>
  );
}
