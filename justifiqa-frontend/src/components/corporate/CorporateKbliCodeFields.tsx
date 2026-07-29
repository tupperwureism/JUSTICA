import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  codes: string[];
  onChange: (codes: string[]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

export function CorporateKbliCodeFields({ codes, onChange, onAdd, onRemove }: Props) {
  return (
    <fieldset className="space-y-3 md:col-span-2">
      <legend className="text-sm font-semibold">KBLI</legend>
      <p className="text-sm text-muted-foreground">Tambahkan setiap kode KBLI yang relevan sebagai entri terpisah.</p>
      {codes.map((code, index) => (
        <div key={`kbli-${index}`} className="flex items-end gap-2">
          <label className="flex-1 space-y-2 text-sm font-semibold">
            KBLI {index + 1}
            <Input
              required
              value={code}
              onChange={(event) => onChange(codes.map((value, codeIndex) => (codeIndex === index ? event.target.value : value)))}
              placeholder="Contoh: 62019"
              className="min-h-10 rounded-xl border-border bg-background"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={codes.length <= 1}
            onClick={() => onRemove(index)}
            aria-label={`Hapus KBLI ${index + 1}`}
          >
            <Minus />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={onAdd} className="gap-2">
        <Plus /> Tambah KBLI
      </Button>
    </fieldset>
  );
}
