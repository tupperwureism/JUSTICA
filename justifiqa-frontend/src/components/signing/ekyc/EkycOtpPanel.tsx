import { KeyRound, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Props = {
  otp: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function EkycOtpPanel({
  otp, onChange, onContinue, loading = false, error, onRetry,
}: Props) {
  return (
    <Card className="ekyc-card-shell">
      <CardHeader className="gap-3 p-0"><KeyRound className="size-6 text-primary" /><CardTitle className="text-2xl font-extrabold">Konfirmasi OTP</CardTitle><CardDescription>Masukkan kode satu kali dari kanal terverifikasi untuk meminta sesi provider.</CardDescription></CardHeader>
      <CardContent className="grid gap-4 p-0"><label className="grid gap-2 text-sm font-semibold">Kode 6 digit<Input inputMode="numeric" maxLength={6} value={otp} onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))} placeholder="••••••" className="h-12 text-center text-xl tracking-[0.45em]" /></label><p className="ekyc-status-safe flex items-start gap-3"><MessageSquareText className="size-5 shrink-0 text-primary" />OTP ini hanya mengaktifkan sesi. Jangan berikan kode kepada pihak lain.</p>{error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 text-sm text-destructive"><span>{error}</span>{onRetry && <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={loading}>Coba lagi</Button>}</div>}</CardContent>
      <CardFooter className="p-0"><Button type="button" size="lg" disabled={loading || otp.length !== 6} onClick={onContinue} className="w-full">{loading ? 'Meminta sesi provider...' : 'Lanjut ke Liveness Scan'}</Button></CardFooter>
    </Card>
  );
}
