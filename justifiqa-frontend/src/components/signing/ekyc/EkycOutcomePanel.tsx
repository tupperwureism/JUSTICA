import { CheckCircle2, CircleAlert, RotateCcw, ShieldAlert, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { outcomeCopy, type EkycScreen } from './ekycUiModel';

type Props = { screen: Exclude<EkycScreen, 'otp' | 'liveness'>; failures: number; onRetry: () => void; onRefund: () => void };

export function EkycOutcomePanel({ screen, failures, onRetry, onRefund }: Props) {
  const copy = outcomeCopy[screen];
  const isVerified = screen === 'verified';
  const isRefunded = screen === 'refunded';
  const Icon = isVerified ? CheckCircle2 : isRefunded ? WalletCards : ShieldAlert;
  return (
    <Card className="ekyc-card-shell">
      <CardHeader className="gap-3 p-0"><div className="flex flex-wrap items-center justify-between gap-3"><Icon className={isVerified ? 'size-8 text-emerald-600 dark:text-emerald-400' : 'size-8 text-primary'} /><Badge variant={isVerified ? 'default' : isRefunded ? 'destructive' : 'outline'}>{isVerified ? 'VERIFIED' : isRefunded ? 'REFUND PENDING' : 'REQUIRES MANUAL REVIEW'}</Badge></div><CardTitle className="text-2xl font-extrabold">{copy.title}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 p-0"><p className={isRefunded ? 'ekyc-status-safe ekyc-status-halt' : screen === 'hold' ? 'ekyc-status-safe ekyc-status-hold' : 'ekyc-status-safe'}>{copy.detail}</p>{failures > 0 && !isRefunded && <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><CircleAlert className="size-4 text-primary" />Liveness Failed ({failures}/3)</p>}</CardContent>
      <CardFooter className="flex flex-wrap gap-3 p-0">{!isVerified && !isRefunded && <Button type="button" size="lg" onClick={onRetry}><RotateCcw />Coba liveness lagi</Button>}{!isRefunded && <Button type="button" variant="outline" size="lg" onClick={onRefund}>Simulasikan Global Halt</Button>}</CardFooter>
    </Card>
  );
}
