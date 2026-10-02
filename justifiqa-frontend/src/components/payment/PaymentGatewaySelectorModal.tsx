import { useState } from 'react';
import { Building2, Check, QrCode, ShieldCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export type PaymentGatewayMethod = 'VA_MANDIRI_BCA' | 'QRIS' | 'BI_FAST_ADAPTER';

const METHODS = [
  { id: 'VA_MANDIRI_BCA', label: 'Virtual Account Mandiri / BCA', detail: 'Rekonsiliasi otomatis per nomor tagihan', Icon: Building2 },
  { id: 'QRIS', label: 'QRIS', detail: 'Pembayaran instan melalui aplikasi bank atau dompet digital', Icon: QrCode },
  { id: 'BI_FAST_ADAPTER', label: 'BI-FAST Adapter', detail: 'Transfer 24/7 melalui PJP atau bank peserta', Icon: Zap },
] as const;

interface Props {
  onConfirm: (method: PaymentGatewayMethod) => void;
}

export function PaymentGatewaySelectorModal({ onConfirm }: Props) {
  const [selected, setSelected] = useState<PaymentGatewayMethod>('VA_MANDIRI_BCA');

  return (
    <Card role="dialog" aria-labelledby="gateway-selector-title" className="gap-6 rounded-2xl border-border bg-card/90 p-6 shadow-lg">
      <CardHeader className="gap-3 p-0">
        <Badge variant="outline" className="w-fit rounded-full border-primary/40 bg-primary/10 px-3.5 py-1 text-primary">
          <ShieldCheck /> HMAC SHA-256 DIWAJIBKAN
        </Badge>
        <CardTitle id="gateway-selector-title" className="font-heading text-xl font-extrabold">Pilih Jalur Pembayaran Rekening Bersama</CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">Dana dikunci di escrow dan hanya berubah status setelah webhook provider lolos verifikasi tanda tangan.</p>
      </CardHeader>
      <CardContent className="grid gap-3 p-0">
        {METHODS.map(({ id, label, detail, Icon }) => (
          <button key={id} type="button" onClick={() => setSelected(id)} aria-pressed={selected === id} className={`client-payment-method ${selected === id ? 'active' : ''}`}>
            <span className="flex items-center gap-3"><Icon className="size-5 shrink-0 text-primary" /><strong className="flex-1">{label}</strong>{selected === id && <Check className="size-4 shrink-0 text-primary" />}</span>
            <small>{detail}</small>
          </button>
        ))}
      </CardContent>
      <CardFooter className="p-0">
        <Button type="button" size="lg" onClick={() => onConfirm(selected)} className="client-primary-action w-full">
          Lanjutkan dengan Jalur Terpilih
        </Button>
      </CardFooter>
    </Card>
  );
}
