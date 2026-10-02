import { Loader2 } from 'lucide-react';
import type { LegalDocumentDraft } from '@/types/irac';

interface DocumentDraftPreviewProps { draft: LegalDocumentDraft | null; isGenerating: boolean }

export function DocumentDraftPreview({ draft, isGenerating }: DocumentDraftPreviewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-muted">2. Pratinjau Klausul &amp; Isi Dokumen (Live Preview):</span>{isGenerating && <span className="text-xs text-primary flex items-center gap-1 animate-pulse"><Loader2 className="w-3.5 h-3.5 animate-spin" />Merakit draf...</span>}</div>
      {draft ? (
        <div className="document-draft-preview-scroll bg-background border border-border rounded-2xl p-6 space-y-6 shadow-inner font-mono text-xs leading-relaxed overflow-y-auto">
          <div className="text-center border-b border-border pb-4"><h4 className="text-base md:text-lg font-bold text-foreground tracking-wide uppercase">{draft.title}</h4><p className="text-xs text-muted mt-1">Diterbitkan tanggal {new Date(draft.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · FIDO2 Watermarked</p></div>
          <div className="bg-secondary p-3.5 rounded-xl border border-border space-y-1.5 text-xs"><div className="flex justify-between"><span className="text-muted">Pihak Pengirim/Penggugat:</span><span className="text-foreground font-semibold">{draft.clientName} (Kuasa: {draft.advocateName})</span></div><div className="flex justify-between"><span className="text-muted">Pihak Penerima/Tergugat:</span><span className="text-primary font-semibold">{draft.opponentName}</span></div></div>
          <div className="space-y-5">{draft.clauses.map((clause) => <div key={clause.id} className="space-y-2 border-l-2 border-primary/50 pl-3.5"><h5 className="font-bold text-foreground uppercase text-xs tracking-wider">{clause.title}</h5><p className="text-muted-foreground whitespace-pre-line text-xs font-sans">{clause.body}</p></div>)}</div>
        </div>
      ) : <div className="p-12 text-center text-muted border border-dashed border-border rounded-2xl"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />Merakit draf dokumen hukum dari analisis IRAC...</div>}
    </div>
  );
}
