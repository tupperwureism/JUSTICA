import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { DOCUMENT_TEMPLATES } from '@/data/documentDraftingData';
import type { LegalDocumentTemplateId } from '@/types/irac';

interface DocumentDraftingFormProps {
  selectedTemplate: LegalDocumentTemplateId;
  setSelectedTemplate: Dispatch<SetStateAction<LegalDocumentTemplateId>>;
  opponentName: string;
  setOpponentName: Dispatch<SetStateAction<string>>;
  advocateName: string;
  setAdvocateName: Dispatch<SetStateAction<string>>;
  isGenerating: boolean;
  errorMsg: string;
  onSubmit: (event: FormEvent) => void;
}

export function DocumentDraftingForm(props: DocumentDraftingFormProps) {
  return (
    <>
      {props.errorMsg && <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 flex items-center gap-2 text-xs text-destructive"><AlertCircle className="w-4 h-4" />{props.errorMsg}</div>}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted block">1. Pilih Jenis Dokumen Hukum yang Akan Dirakit:</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{DOCUMENT_TEMPLATES.map((template) => <button key={template.id} type="button" onClick={() => props.setSelectedTemplate(template.id)} className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 ${props.selectedTemplate === template.id ? 'bg-primary/20 border-primary text-foreground shadow-md ring-1 ring-primary/50' : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/40'}`}><span className="font-bold text-xs">{template.label}</span><span className="text-xs text-muted-foreground leading-snug">{template.desc}</span></button>)}</div>
      </div>
      <form onSubmit={props.onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-secondary/50 p-4 rounded-xl border border-border">
        <label className="space-y-1.5 text-xs font-semibold text-foreground">Nama Pihak Lawan / Tergugat / Mitra:<input value={props.opponentName} onChange={(event) => props.setOpponentName(event.target.value)} placeholder="Contoh: PT Mitra Solusi" className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" /></label>
        <label className="space-y-1.5 text-xs font-semibold text-foreground">Nama Advokat Pendamping / Kuasa Hukum:<input value={props.advocateName} onChange={(event) => props.setAdvocateName(event.target.value)} placeholder="Contoh: Dr. Hendra Wijaya, S.H., M.H." className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground focus:outline-none focus:border-primary" /></label>
        <div className="sm:col-span-2 flex justify-end pt-1"><button type="submit" disabled={props.isGenerating} className="btn btn-secondary-glass py-2 px-4 text-xs flex items-center gap-1.5">{props.isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Merakit Ulang Klausul...</> : <><Sparkles className="w-3.5 h-3.5 text-primary" />Perbarui Teks Draf Dokumen</>}</button></div>
      </form>
    </>
  );
}
