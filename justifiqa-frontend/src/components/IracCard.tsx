import React from 'react';
import { HelpCircle, BookOpen, Scale, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { IracPillarCard } from './IracPillarCard';
import { Card } from '@/components/ui/card';
import type { IracAnalysis } from '../types/irac';

export interface IracCardProps {
  analysis: IracAnalysis;
  onProceedToDraft: (analysis: IracAnalysis) => void;
}

export const IracCard: React.FC<IracCardProps> = ({ analysis, onProceedToDraft }) => {
  return (
    <div className="space-y-6 animate-fade-in pt-4">
      <Card className="p-6 bg-card border border-amber-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              AI Neural Diagnosis
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Tingkat Keyakinan: {analysis.confidenceScore}%</span>
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
            {analysis.caseTitle}
          </h3>
          <p className="text-xs text-muted-foreground">
            Diproses pada: {new Date(analysis.generatedAt).toLocaleString('id-ID')} &middot; Ontologi Hukum Terverifikasi
          </p>
        </div>

        <button
          type="button"
          onClick={() => onProceedToDraft(analysis)}
          className="px-5 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 self-start md:self-center flex-shrink-0 min-h-[44px] whitespace-nowrap"
        >
          <span>Buat Draf Somasi / Gugatan</span>
          <ArrowRight className="w-4 h-4 flex-shrink-0" />
        </button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IracPillarCard
          letter="I"
          title="Issue (Rumusan Masalah)"
          subtitle="Inti pertanyaan yuridis atas fakta kasus"
          content={analysis.issue}
          icon={<HelpCircle className="w-5 h-5 flex-shrink-0" />}
          colorClass="text-blue-600 dark:text-blue-400"
          borderColorClass="border-blue-500/30"
          bgIconClass="bg-blue-500/15"
        />

        <IracPillarCard
          letter="R"
          title="Rule (Dasar Hukum &amp; Pasal)"
          subtitle="Yurisprudensi dan pasal undang-undang terkait"
          content={analysis.rule}
          icon={<BookOpen className="w-5 h-5 flex-shrink-0" />}
          colorClass="text-amber-600 dark:text-amber-400"
          borderColorClass="border-amber-500/30"
          bgIconClass="bg-amber-500/15"
          articles={analysis.relevantArticles}
        />

        <IracPillarCard
          letter="A"
          title="Application (Analisis &amp; Subsumsi)"
          subtitle="Penerapan aturan hukum pada kronologi nyata"
          content={analysis.application}
          icon={<Scale className="w-5 h-5 flex-shrink-0" />}
          colorClass="text-purple-600 dark:text-purple-400"
          borderColorClass="border-purple-500/30"
          bgIconClass="bg-purple-500/15"
        />

        <IracPillarCard
          letter="C"
          title="Conclusion (Kesimpulan &amp; Solusi)"
          subtitle="Rekomendasi taktis langkah penyelesaian"
          content={analysis.conclusion}
          icon={<CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          colorClass="text-emerald-600 dark:text-emerald-400"
          borderColorClass="border-emerald-500/30"
          bgIconClass="bg-emerald-500/15"
        />
      </div>
    </div>
  );
};
