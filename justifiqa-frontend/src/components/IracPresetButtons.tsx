import { FileText } from 'lucide-react';
import type { PresetFact } from './IracFormCard';

interface IracPresetButtonsProps { presets: PresetFact[]; selectedLabel: string; onSelect: (preset: PresetFact) => void }

export function IracPresetButtons({ presets, selectedLabel, onSelect }: IracPresetButtonsProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Pilih Kasus Prasetel Instan (Untuk Uji Coba Cepat):</label>
      <div className="flex flex-wrap gap-2.5">
        {presets.map((preset) => (
          <button key={preset.label} type="button" onClick={() => onSelect(preset)} className={`text-xs px-3.5 py-2 rounded-xl border transition-all font-semibold flex items-center gap-2 min-h-[38px] whitespace-nowrap ${selectedLabel === preset.label ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm' : 'bg-secondary border-border text-muted-foreground hover:border-primary hover:text-foreground'}`}>
            <FileText className="w-3.5 h-3.5 flex-shrink-0" /><span>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
