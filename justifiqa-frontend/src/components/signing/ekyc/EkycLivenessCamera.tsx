import { Camera, RefreshCw, ScanFace, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { EkycOutcome } from './ekycUiModel';

type IntegratedProps = {
  attempt: number;
  onRefresh: () => void;
  loading?: boolean;
  error?: string | null;
};

type LegacyShowcaseProps = {
  attempt: number;
  onOutcome: (outcome: EkycOutcome) => void;
};

export function EkycLivenessCamera(props: IntegratedProps | LegacyShowcaseProps) {
  const integrated = 'onRefresh' in props;
  const loading = integrated ? (props.loading ?? false) : false;
  const error = integrated ? props.error : 'Simulasi outcome dinonaktifkan; callback provider harus diverifikasi server.';
  return (
    <Card className="ekyc-card-shell">
      <CardHeader className="gap-3 p-0"><div className="flex flex-wrap items-center justify-between gap-3"><ScanFace className="size-6 text-primary" /><span className="ekyc-step-chip active">Liveness scan · percobaan {props.attempt}/3</span></div><CardTitle className="text-2xl font-extrabold">Pindai wajah di lingkungan provider</CardTitle><CardDescription>Media biometrik dikirim langsung ke provider. Justifiqa hanya membaca metadata callback yang telah diverifikasi.</CardDescription></CardHeader>
      <CardContent className="p-0"><div className="ekyc-camera-frame" aria-label="Status sesi provider tanpa rekaman lokal"><i className="ekyc-corner top-left" /><i className="ekyc-corner top-right" /><i className="ekyc-corner bottom-left" /><i className="ekyc-corner bottom-right" /><span className="ekyc-scan-line" /><div className="ekyc-camera-lens"><Camera className="size-16 text-primary" /></div><p className="absolute bottom-8 text-sm font-bold text-foreground">Media langsung ke provider · tanpa penyimpanan lokal</p></div></CardContent>
      <CardFooter className="grid gap-3 p-0">{error && <p role="alert" className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldAlert className="size-4 shrink-0 text-primary" />{error}</p>}<Button type="button" size="lg" disabled={!integrated || loading} onClick={integrated ? props.onRefresh : undefined} className="w-full"><RefreshCw />{loading ? 'Memeriksa callback...' : integrated ? 'Perbarui hasil callback' : 'Callback server diperlukan'}</Button></CardFooter>
    </Card>
  );
}
