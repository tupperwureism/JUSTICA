import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export type ScheduleDayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
export type ScheduleSlots = Record<ScheduleDayKey, { active: boolean; hours: string }>;

interface ScheduleManagementCardProps {
  scheduleSlots: ScheduleSlots;
  onToggleDay: (day: ScheduleDayKey, checked: boolean) => void;
  onChangeHours: (day: ScheduleDayKey, hours: string) => void;
  onSaveSchedule: () => void;
}

const days: Array<[ScheduleDayKey, string]> = [
  ['monday', 'Senin'], ['tuesday', 'Selasa'], ['wednesday', 'Rabu'], ['thursday', 'Kamis'], ['friday', 'Jumat'],
];

export function ScheduleManagementCard({ scheduleSlots, onToggleDay, onChangeHours, onSaveSchedule }: ScheduleManagementCardProps) {
  return (
    <Card className="space-y-6 rounded-3xl border-border bg-card/90 p-6 shadow-xl sm:p-8">
      <header className="flex items-center justify-between gap-4"><div><h2 className="font-heading text-xl font-extrabold">ATUR JADWAL &amp; SLOT KONSULTASI ANDA</h2><p className="mt-1 text-xs text-muted-foreground">Tentukan jam konsultasi daring dan luring · <code className="text-emerald-500">SELECT ... FOR UPDATE</code></p></div><Calendar className="size-8 shrink-0 text-emerald-500" /></header>
      <div className="space-y-3">
        {days.map(([key, label]) => {
          const slot = scheduleSlots[key];
          return <Card key={key} className="flex items-center justify-between gap-4 rounded-2xl border-border bg-secondary/30 p-4"><label className="flex cursor-pointer items-center gap-3 text-sm font-bold"><input type="checkbox" checked={slot.active} onChange={(event) => onToggleDay(key, event.target.checked)} />{label}</label><Input value={slot.hours} onChange={(event) => onChangeHours(key, event.target.value)} disabled={!slot.active} className="h-10 w-48 rounded-xl border-border bg-secondary/60 font-mono text-xs text-emerald-500" /></Card>;
        })}
      </div>
      <Button type="button" size="lg" onClick={onSaveSchedule} className="min-h-12 w-full whitespace-nowrap rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700">SIMPAN JADWAL MUTEX</Button>
    </Card>
  );
}
