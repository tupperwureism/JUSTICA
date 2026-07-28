import { Landmark, LockKeyhole, ReceiptText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  entityName: string;
  locked: boolean;
  onPay: () => void;
};

export function CorporateEscrowCheckoutPanel({ entityName, locked, onPay }: Props) {
  return (
    <Card className="corporate-card-shell">
      <CardHeader className="gap-3 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="outline" className="corporate-status-badge corporate-status-draft"><ReceiptText />Tagihan corporate</Badge>
          <Badge variant={locked ? 'default' : 'secondary'}>{locked ? 'HELD IN ESCROW' : 'PENDING PAYMENT'}</Badge>
        </div>
        <CardTitle className="text-2xl font-extrabold">Penawaran untuk {entityName || 'entitas Anda'}</CardTitle>
        <CardDescription>Biaya layanan dikunci pada penawaran ini. Dana hanya dilepas melalui milestone yang sah.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-0 sm:grid-cols-2">
        <div className="corporate-summary-item"><Landmark className="size-5 text-primary" /><span><strong>Rp7.500.000</strong><small>Estimasi biaya pembentukan</small></span></div>
        <div className="corporate-summary-item"><LockKeyhole className="size-5 text-primary" /><span><strong>Rekening bersama</strong><small>Dana terpisah dari operasional</small></span></div>
      </CardContent>
      <CardFooter className="p-0 pt-2">
        <Button type="button" size="lg" disabled={locked} onClick={onPay} className="w-full">
          <LockKeyhole />{locked ? 'Escrow telah terkunci' : 'Bayar Escrow'}
        </Button>
      </CardFooter>
    </Card>
  );
}
