import { CheckCircle2, CircleAlert, RefreshCw, ShieldAlert, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { outcomeCopy, type EkycScreen } from './ekycUiModel';

type Props = {
  screen: Exclude<EkycScreen, 'otp' | 'liveness'>;
  failures: number;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRefund?: () => void;
};

export function EkycOutcomePanel({
  screen, failures, onRefresh, loading = false, error,
}: Props) {
  const copy = outcomeCopy[screen];
  const isVerified = screen === 'verified';
  const isRefunded = screen === 'refunded';
  const isRefundFlow = screen === 'refundPending' || isRefunded;
  const isGlobalHalt = screen === 'halted' || isRefundFlow;
  const statusLabel = isVerified
    ? 'VERIFIED'
    : isRefunded
      ? 'REFUNDED'
      : screen === 'refundPending'
        ? 'REFUND PENDING'
        : screen === 'halted'
          ? 'GLOBAL HALT'
          : 'REQUIRES MANUAL REVIEW';
  const Icon = isVerified ? CheckCircle2 : isRefundFlow ? WalletCards : ShieldAlert;
  return (
    <Card className="ekyc-card-shell">
      <CardHeader className="gap-3 p-0"><div className="flex flex-wrap items-center justify-between gap-3"><Icon className={isVerified ? 'size-8 text-emerald-600 dark:text-emerald-400' : 'size-8 text-primary'} /><Badge variant={isVerified ? 'default' : isGlobalHalt ? 'destructive' : 'outline'}>{statusLabel}</Badge></div><CardTitle className="text-2xl font-extrabold">{copy.title}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 p-0"><p className={isGlobalHalt ? 'ekyc-status-safe ekyc-status-halt' : screen === 'hold' ? 'ekyc-status-safe ekyc-status-hold' : 'ekyc-status-safe'}>{copy.detail}</p>{failures > 0 && !isGlobalHalt && <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><CircleAlert className="size-4 text-primary" />Liveness Failed ({failures}/3)</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</CardContent>
      <CardFooter className="p-0"><Button type="button" variant="outline" size="lg" disabled={!onRefresh || loading} onClick={onRefresh} className="w-full"><RefreshCw />{loading ? 'Memuat status...' : onRefresh ? 'Perbarui status kanonik' : 'Aksi server-only'}</Button></CardFooter>
    </Card>
  );
}
