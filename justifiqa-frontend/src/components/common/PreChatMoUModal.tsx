import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type PreChatMoUModalProps = {
  isOpen: boolean;
  onAccept: () => void;
  onCancel: () => void;
  userRole: 'client' | 'advocate';
  partnerName: string;
};

const clauses = [
  ['Larangan Transaksi Off-Platform', 'Dilarang mengalihkan pembicaraan, bertukar nomor kontak pribadi (HP/WA/Email), menyepakati pertemuan offline liar, atau melakukan pembayaran di luar mekanisme resmi Justica.'],
  ['Persetujuan Pemindaian Keamanan DLP', 'Menyetujui bahwa sistem mengoperasikan pemindaian Pre-Broadcast Interception DLP pada pertukaran teks/meta untuk mendeteksi pelanggaran kontak dan mencegah kecurangan tagihan.'],
  ['Pelepasan Hak Refund & Konsekuensi', 'Sepakat bahwa segala bentuk pelanggaran atau transaksi di luar sistem secara otomatis membatalkan hak Klaim Refund Escrow 100%, membekukan sesi obrolan seketika (Instant Freeze), dan membebaskan Justica dari tuntutan hukum.'],
] as const;

export function PreChatMoUModal({ isOpen, onAccept, onCancel, userRole, partnerName }: PreChatMoUModalProps) {
  if (!isOpen) return null;

  const roleLabel = userRole === 'client' ? 'Klien' : 'Advokat';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm" role="presentation">
      <Card className="my-auto w-full max-w-3xl gap-5 rounded-3xl border-border bg-card p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="pre-chat-mou-title" aria-describedby="pre-chat-mou-description">
        <CardHeader className="gap-3 p-0">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-8 shrink-0 text-emerald-500" />
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">Persetujuan Wajib {roleLabel}</p>
              <CardTitle id="pre-chat-mou-title" className="text-lg font-extrabold leading-tight text-foreground sm:text-xl">PERSETUJUAN SYARAT &amp; KETENTUAN KONSULTASI HUKUM E2EE (PRE-CHAT MOU)</CardTitle>
            </div>
          </div>
          <p id="pre-chat-mou-description" className="text-sm leading-relaxed text-muted-foreground">Sebelum membuka protokol enkripsi E2EE dan memulai arloji Fair-Clock bersama {partnerName}, Anda WAJIB menyetujui 3 klausul kepatuhan hukum mutlak sesuai UU PDP No. 27/2022 &amp; UU 18/2003 Advokat:</p>
        </CardHeader>
        <CardContent className="grid gap-3 p-0">
          {clauses.map(([title, text], index) => (
            <section key={title} className="rounded-2xl border border-border bg-secondary/40 p-4">
              <h3 className="text-sm font-extrabold text-foreground">Klausul {index + 1} ({title}):</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{text}</p>
            </section>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col-reverse items-stretch gap-3 border-t border-border p-0 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="min-h-10 font-bold text-muted-foreground">Batal &amp; Kembali ke Dasbor</Button>
          <Button type="button" onClick={onAccept} className="min-h-12 w-full bg-emerald-600 font-extrabold text-white hover:bg-emerald-700 sm:w-auto">SAYA MENYETUJUI 3 KLAUSUL KEPATUHAN DI ATAS &amp; MASUK RUANG CHAT</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
