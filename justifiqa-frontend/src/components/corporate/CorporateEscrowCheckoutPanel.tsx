import { Landmark, LockKeyhole, ReceiptText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { CorporateEscrowStatus } from '@/services/phase2IntegrationService';

type IntegratedProps = {
  entityName: string;
  amount: number;
  paymentReference: string;
  status: CorporateEscrowStatus;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
  onRefresh: () => void;
  onRetry?: () => void;
};

type LegacyShowcaseProps = {
  entityName: string;
  locked: boolean;
  [legacyProp: string]: unknown;
};

type Props = IntegratedProps | LegacyShowcaseProps;

const ESCROW_STATUS_COPY: Record<CorporateEscrowStatus, string> = {
  PENDING_PAYMENT: 'PENDING PAYMENT',
  HELD_IN_ESCROW: 'HELD IN ESCROW',
  HOLDING_PERIOD_24H: 'HOLDING PERIOD 24H',
  FROZEN_DISPUTE: 'FROZEN DISPUTE',
  RELEASED_TO_ADVOCATE: 'RELEASED TO ADVOCATE',
  REFUNDED_TO_CLIENT: 'REFUNDED TO CLIENT',
  RESOLVED_SPLIT_SETTLEMENT: 'RESOLVED SPLIT',
};

export function CorporateEscrowCheckoutPanel(props: Props) {
  const legacyShowcase = 'locked' in props;
  const entityName = props.entityName;
  const amount = legacyShowcase ? 7_500_000 : props.amount;
  const paymentReference = legacyShowcase ? 'Belum diterbitkan server' : props.paymentReference;
  const status: CorporateEscrowStatus = legacyShowcase
    ? (props.locked ? 'HELD_IN_ESCROW' : 'PENDING_PAYMENT')
    : props.status;
  const loading = legacyShowcase ? false : (props.loading ?? false);
  const error = legacyShowcase && !props.locked
    ? 'Checkout memerlukan endpoint server terotorisasi; simulasi pembayaran dinonaktifkan.'
    : legacyShowcase ? null : props.error;
  const success = legacyShowcase ? false : (props.success ?? false);
  const onRefresh = legacyShowcase ? undefined : props.onRefresh;
  const onRetry = legacyShowcase ? undefined : props.onRetry;
  const locked = status === 'HELD_IN_ESCROW';
  return (
    <Card className="corporate-card-shell">
      <CardHeader className="gap-3 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="outline" className="corporate-status-badge corporate-status-draft"><ReceiptText />Tagihan corporate</Badge>
          <Badge variant={locked ? 'default' : status === 'FROZEN_DISPUTE' ? 'destructive' : 'secondary'}>{ESCROW_STATUS_COPY[status]}</Badge>
        </div>
        <CardTitle className="text-2xl font-extrabold">Penawaran untuk {entityName || 'entitas Anda'}</CardTitle>
        <CardDescription>Biaya layanan dikunci pada penawaran ini. Dana hanya dilepas melalui milestone yang sah.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-0 sm:grid-cols-2">
        <div className="corporate-summary-item"><Landmark className="size-5 text-primary" /><span><strong>Rp{amount.toLocaleString('id-ID')}</strong><small>Nilai penawaran yang tersimpan</small></span></div>
        <div className="corporate-summary-item"><LockKeyhole className="size-5 text-primary" /><span><strong>Rekening bersama</strong><small>Referensi: {paymentReference}</small></span></div>
      </CardContent>
      <CardFooter className="grid gap-3 p-0 pt-2">
        <Button type="button" size="lg" disabled={loading || !onRefresh} onClick={onRefresh} className="w-full">
          <LockKeyhole />{loading ? 'Memeriksa webhook...' : onRefresh ? 'Perbarui status escrow' : 'Boundary pembayaran belum tersedia'}
        </Button>
        <p className="text-xs text-muted-foreground">Browser hanya membaca status kanonik yang dihasilkan webhook dan transisi server terotorisasi.</p>
        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm"><span>{error}</span>{onRetry && <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={loading}>Coba lagi</Button>}</div>}
        {success && <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">Status escrow kanonik {ESCROW_STATUS_COPY[status]} telah dimuat dari Supabase.</p>}
      </CardFooter>
    </Card>
  );
}
