import { KeyRound, ServerCog, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const notify = (message: string) => window.alert(message);

export function AdminSettingsPanel() {
  return (
    <section className="settings-panel animate-fade-in">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-widest text-primary">Secure Corporate System Control</p>
        <h1 className="mt-2 text-2xl font-black text-foreground">PENGATURAN KEAMANAN KORPORAT, PARAMETER SISTEM, &amp; ENKRIPSI KMS</h1>
      </header>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="flex flex-col gap-5 rounded-2xl border-border bg-card p-6 shadow-md">
          <CardHeader className="gap-2 p-0"><KeyRound className="size-7 text-emerald-500" /><CardTitle>Keamanan Akses &amp; MFA Hardware Key</CardTitle></CardHeader>
          <CardContent className="flex-1 space-y-3 p-0 text-sm text-muted-foreground">
            <Badge variant="outline" className="min-h-10 border-emerald-500/40 bg-emerald-500/10 text-emerald-500"><ShieldCheck />AKTIF (FIDO2 Hardware Security Key &amp; YubiKey)</Badge>
            <p>Identitas sesi:</p><strong className="block text-foreground">admin.compliance@justica.id</strong>
          </CardContent>
          <CardFooter className="grid gap-2 p-0"><Button variant="outline" className="min-h-10" onClick={() => notify('Rotasi kredensial Administrator dijadwalkan melalui Secure Corporate Gateway.')}>ROTASI KREDENSIAL ADMIN</Button><Button variant="outline" className="min-h-10" onClick={() => notify('Prosedur pengaturan ulang Hardware Security Key dimulai.')}>ATUR ULANG HARDWARE KEY</Button></CardFooter>
        </Card>
        <Card className="flex flex-col gap-5 rounded-2xl border-border bg-card p-6 shadow-md">
          <CardHeader className="gap-2 p-0"><ServerCog className="size-7 text-blue-500" /><CardTitle>Konfigurasi Parameter Sistem &amp; Escrow — proconfig</CardTitle></CardHeader>
          <CardContent className="flex-1 p-0"><div className="settings-summary-row"><span>SLA Fair-Clock</span><strong>45 Menit</strong></div><div className="settings-summary-row"><span>Toleransi sebelum pinalti Escrow</span><strong>15 Menit</strong></div><div className="settings-summary-row"><span>Potongan PPh 21 otomatis</span><strong>5% - 15%</strong></div></CardContent>
          <CardFooter className="p-0"><Button className="min-h-10 w-full" onClick={() => notify('Parameter sistem berhasil disimpan dan dicatat pada audit trail WORM.')}>SIMPAN PARAMETER SISTEM</Button></CardFooter>
        </Card>
        <Card className="flex flex-col gap-5 rounded-2xl border-border bg-card p-6 shadow-md">
          <CardHeader className="gap-2 p-0"><ShieldCheck className="size-7 text-primary" /><CardTitle>Audit Rotasi Kunci Enkripsi — KMS AES-256 Vault</CardTitle></CardHeader>
          <CardContent className="flex-1 space-y-3 p-0 text-sm text-muted-foreground"><p>Status WORM Vault:</p><Badge variant="outline" className="min-h-10 border-blue-500/40 bg-blue-500/10 text-blue-500">IMMUTABLE ACTIVE</Badge><p>ID Kunci KMS Master terbaru:</p><strong className="block font-mono text-foreground">KEY-2026-AES256-HSM</strong></CardContent>
          <CardFooter className="p-0"><Button variant="outline" className="min-h-10 w-full" onClick={() => notify('Rotasi kunci KMS AES-256 dimulai melalui Hardware Security Module.')}>JALANKAN ROTASI KUNCI KMS</Button></CardFooter>
        </Card>
      </div>
    </section>
  );
}
