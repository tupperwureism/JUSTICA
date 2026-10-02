import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { Info, LoaderCircle, ShieldCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PublicVerifierFormCardProps {
  verifyHash: string;
  selectedFileName: string | null;
  isDraggingOver: boolean;
  isBusy: boolean;
  errorMessage: string | null;
  setIsDraggingOver: (value: boolean) => void;
  onHashChange: (value: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onSubmit: (event: FormEvent) => void;
}

export function PublicVerifierFormCard(props: PublicVerifierFormCardProps) {
  return (
    <Card id="verifier-form-card" className="w-full max-w-4xl rounded-2xl border border-border bg-card/90 backdrop-blur-xl shadow-xl animate-fade-in">
      <CardHeader className="px-8 pt-8 pb-0"><div className="flex items-center gap-3"><Info className="w-5 h-5 text-primary shrink-0" /><h2 className="font-heading font-bold text-lg text-foreground">Input Verifikasi</h2></div></CardHeader>
      <CardContent className="p-8 pt-6">
        <form onSubmit={props.onSubmit} className="space-y-7">
          <div className="space-y-2.5"><label htmlFor="verify-hash" className="block font-bold text-sm sm:text-base text-foreground">Masukkan Hash SHA-256:</label><Input id="verify-hash" value={props.verifyHash} onChange={(event) => props.onHashChange(event.target.value)} placeholder="64 karakter heksadesimal" spellCheck={false} autoComplete="off" className="w-full h-12 font-mono text-xs sm:text-sm rounded-xl bg-secondary/40 border-border text-foreground focus-visible:ring-primary" /></div>
          <div className="space-y-2.5">
            <label className="block font-bold text-sm sm:text-base text-foreground">Atau Unggah Berkas PDF Asli (.PDF):</label>
            <label htmlFor="file-upload" className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${props.isDraggingOver ? 'border-primary bg-primary/10' : 'border-border bg-secondary/20 hover:border-primary/60 hover:bg-primary/5'}`} onDragOver={(event) => { event.preventDefault(); props.setIsDraggingOver(true); }} onDragLeave={() => props.setIsDraggingOver(false)} onDrop={props.onDrop}>
              {props.isBusy ? <LoaderCircle className="w-10 h-10 text-primary animate-spin shrink-0" /> : <Upload className={`w-10 h-10 shrink-0 ${props.isDraggingOver ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.5} />}
              <div className="space-y-1"><div className="font-bold text-base text-foreground">{props.selectedFileName ?? 'Seret & Lepas berkas PDF di sini'}</div><div className="text-xs text-muted-foreground">atau klik untuk memilih file • Maks. 15 MB • Pemeriksaan dilakukan lokal di browser</div></div>
              <input id="file-upload" type="file" accept="application/pdf,.pdf" onChange={props.onFileChange} disabled={props.isBusy} className="hidden" />
            </label>
          </div>
          {props.errorMessage && <p role="alert" className="text-sm font-semibold text-destructive">{props.errorMessage}</p>}
          <Button type="submit" id="btn-verifikasi-sekarang" disabled={props.isBusy} className="h-14 w-full gap-2 rounded-xl text-base font-extrabold shadow-lg">{props.isBusy ? <LoaderCircle className="w-5 h-5 shrink-0 animate-spin" /> : <ShieldCheck className="w-5 h-5 shrink-0" />}{props.isBusy ? 'MEMPROSES...' : 'VERIFIKASI KEASLIAN SEKARANG'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
