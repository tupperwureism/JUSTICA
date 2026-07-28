import { KeyRound, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Props = { otp: string; onChange: (value: string) => void; onContinue: () => void };

export function EkycOtpPanel({ otp, onChange, onContinue }: Props) {
  return (
    <Card className="ekyc-card-shell">
      <CardHeader className="gap-3 p-0"><KeyRound className="size-6 text-primary" /><CardTitle className="text-2xl font-extrabold">Konfirmasi OTP</CardTitle><CardDescription>Masukkan kode satu kali dari kanal terverifikasi untuk membuka sesi provider.</CardDescription></CardHeader>
      <CardContent className="grid gap-4 p-0"><label className="grid gap-2 text-sm font-semibold">Kode 6 digit<Input inputMode="numeric" maxLength={6} value={otp} onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))} placeholder="••••••" className="h-12 text-center text-xl tracking-[0.45em]" /></label><p className="ekyc-status-safe flex items-start gap-3"><MessageSquareText className="size-5 shrink-0 text-primary" />OTP ini hanya mengaktifkan sesi. Jangan berikan kode kepada pihak lain.</p></CardContent>
      <CardFooter className="p-0"><Button type="button" size="lg" disabled={otp.length !== 6} onClick={onContinue} className="w-full">Lanjut ke Liveness Scan</Button></CardFooter>
    </Card>
  );
}
