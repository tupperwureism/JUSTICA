import { Camera, RotateCcw, ScanFace, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { EkycOutcome } from './ekycUiModel';

type Props = { attempt: number; onOutcome: (outcome: EkycOutcome) => void };

export function EkycLivenessCamera({ attempt, onOutcome }: Props) {
  return (
    <Card className="ekyc-card-shell">
      <CardHeader className="gap-3 p-0"><div className="flex flex-wrap items-center justify-between gap-3"><ScanFace className="size-6 text-primary" /><span className="ekyc-step-chip active">Liveness scan · percobaan {attempt}/3</span></div><CardTitle className="text-2xl font-extrabold">Pindai wajah di lingkungan provider</CardTitle><CardDescription>Posisikan wajah di dalam bingkai. Placeholder ini tidak menyalakan kamera atau merekam biometrik.</CardDescription></CardHeader>
      <CardContent className="p-0"><div className="ekyc-camera-frame" aria-label="Preview kamera liveness simulasi"><i className="ekyc-corner top-left" /><i className="ekyc-corner top-right" /><i className="ekyc-corner bottom-left" /><i className="ekyc-corner bottom-right" /><span className="ekyc-scan-line" /><div className="ekyc-camera-lens"><Camera className="size-16 text-primary" /></div><p className="absolute bottom-8 text-sm font-bold text-foreground">Liveness engine siap · media langsung ke provider</p></div></CardContent>
      <CardFooter className="flex flex-wrap gap-3 p-0"><Button type="button" size="lg" onClick={() => onOutcome('passed')} className="flex-1"><ScanFace />Simulasikan scan lulus</Button><Button type="button" variant="outline" size="lg" onClick={() => onOutcome('failed')} className="flex-1"><RotateCcw />Simulasikan gagal</Button><Button type="button" variant="outline" size="lg" onClick={() => onOutcome('hold')}><ShieldAlert />Hold</Button></CardFooter>
    </Card>
  );
}
