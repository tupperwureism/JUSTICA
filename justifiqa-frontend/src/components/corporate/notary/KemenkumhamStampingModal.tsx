import { useState, type FormEvent } from 'react';
import { FileKey2, ShieldCheck, Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export type NotaryStampingRequest = {
  file: File;
  kemenkumhamNumber: string;
  nibNumber: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: NotaryStampingRequest) => void | Promise<void>;
  submitting?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function KemenkumhamStampingModal({
  open, onClose, onSubmit, submitting = false, error, onRetry,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [kemenkumhamNumber, setKemenkumhamNumber] = useState('');
  const [nibNumber, setNibNumber] = useState('');
  if (!open) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!file || (!kemenkumhamNumber.trim() && !nibNumber.trim())) return;
    void onSubmit({
      file,
      kemenkumhamNumber: kemenkumhamNumber.trim(),
      nibNumber: nibNumber.trim(),
    });
  };

  return (
    <div className="client-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="notary-stamping-title">
      <Card className="client-modal-shell max-w-2xl gap-0">
        <CardHeader className="client-modal-header flex-row items-center">
          <div><Badge variant="outline" className="mb-2 rounded-full border-primary/40 bg-primary/10 px-3.5 py-1 text-primary"><ShieldCheck />WORM SHA-256</Badge><CardTitle id="notary-stamping-title" className="font-heading text-xl font-extrabold">Pengesahan Dokumen Korporasi</CardTitle></div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} disabled={submitting} aria-label="Tutup modal"><X /></Button>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-5">
            <label className="block space-y-2 text-sm font-semibold">Draf Akta / Dokumen Final
              <span className="flex min-h-12 items-center gap-3 rounded-xl border border-dashed border-border bg-secondary/30 px-4"><Upload className="size-5 shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate text-muted-foreground">{file?.name ?? 'Pilih PDF untuk karantina dan scan'}</span><Input type="file" accept="application/pdf" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="w-32 shrink-0" /></span>
            </label>
            <label className="block space-y-2 text-sm font-semibold">Nomor SK Kemenkumham<Input value={kemenkumhamNumber} onChange={(event) => setKemenkumhamNumber(event.target.value)} placeholder="Contoh: AHU-0012345.AH.01.01" className="min-h-11 rounded-xl" /></label>
            <label className="block space-y-2 text-sm font-semibold">Nomor Induk Berusaha<Input value={nibNumber} onChange={(event) => setNibNumber(event.target.value)} placeholder="Masukkan NIB bila sudah terbit" className="min-h-11 rounded-xl" /></label>
            <p className="rounded-xl border border-border bg-secondary/30 p-4 text-xs leading-relaxed text-muted-foreground"><FileKey2 className="mr-2 inline size-4 text-primary" />Server wajib memindai file, menghitung SHA-256 dari byte final, lalu mencatat anchor dengan `case_id`. Browser tidak menyatakan hash telah tersimpan.</p>
            {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm"><span>{error}</span>{onRetry && <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={submitting}>Coba lagi</Button>}</div>}
            <Button type="submit" size="lg" disabled={submitting || !file || (!kemenkumhamNumber.trim() && !nibNumber.trim())} className="min-h-12 w-full rounded-xl"><ShieldCheck />{submitting ? 'Mengirim ke boundary server...' : 'Kirim untuk Hash & Pengesahan'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
