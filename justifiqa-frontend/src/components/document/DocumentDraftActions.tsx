import { CheckCircle2, Database, Download, Loader2, ShieldCheck } from 'lucide-react';
import type { LegalDocumentDraft } from '@/types/irac';

interface DocumentDraftActionsProps { draft: LegalDocumentDraft | null; isDownloading: boolean; successHash: string; onDownload: () => void; onClose: () => void }

export function DocumentDraftActions(props: DocumentDraftActionsProps) {
  if (props.successHash) return (
    <div className="p-5 rounded-2xl bg-primary/15 border border-primary/40 text-center space-y-3 animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto"><CheckCircle2 className="w-7 h-7" /></div>
      <div><h4 className="text-base font-bold text-foreground">Draf Dokumen Berhasil Diunduh &amp; Terkunci!</h4><p className="text-xs text-muted-foreground max-w-lg mx-auto">Paket dokumen telah siap diunduh. Jejak integritas dokumen telah dicatat permanen di WORM Vault.</p></div>
      <div className="bg-secondary p-3 rounded-xl font-mono text-xs text-primary max-w-md mx-auto break-all border border-border flex items-center justify-center gap-2"><Database className="w-4 h-4 text-primary" />Hash WORM: {props.successHash}</div>
      <button onClick={props.onClose} className="btn btn-primary-gold px-6">Tutup &amp; Kembali ke Dasbor</button>
    </div>
  );
  return (
    <div className="pt-2 border-t border-border space-y-3">
      <div className="flex items-center justify-between text-xs text-muted"><span className="flex items-center gap-1.5 text-muted-foreground"><ShieldCheck className="w-4 h-4 text-primary" />Draf dilindungi enkripsi E2EE &amp; diverifikasi sebelum pengunduhan.</span><span className="hidden sm:inline text-primary font-mono text-xs">ACID Transaction Ready</span></div>
      <button type="button" onClick={props.onDownload} disabled={props.isDownloading || !props.draft} className="w-full btn btn-primary-gold py-3.5 shadow-lg text-base">{props.isDownloading ? <><Loader2 className="w-5 h-5 animate-spin" />Mengekspor PDF &amp; Mencatat Hash WORM Vault...</> : <><Download className="w-5 h-5" />Unduh Draf Dokumen &amp; Kunci Jejak WORM Vault (Mock Export)</>}</button>
    </div>
  );
}
