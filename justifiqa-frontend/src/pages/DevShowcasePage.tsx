import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleDashed, ShieldAlert } from 'lucide-react';
import { PresentationReadinessGrid } from '@/components/presentation/PresentationReadinessGrid';
import type { PresentationDemoTab } from '@/components/presentation/presentationReadinessModel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PresentationTab = 'summary' | PresentationDemoTab;

const implementedSteps = [
  'Klien mengisi Corporate Intake dan bukti BO terproteksi.',
  'Edge Function memvalidasi JWT, payload, dan idempotency.',
  'RPC atomik memilih katalog harga kanonik dan membuat case.',
  'Signed webhook mengunci escrow dan memperbarui status kanonik.',
];

export function DevShowcasePage() {
  const [tab, setTab] = useState<PresentationTab>('summary');

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge>Presentation mode</Badge>
            <Badge variant="outline">Local demo · Not production</Badge>
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">Justifiqa Delivery Readiness</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Ringkasan jujur antara fitur yang telah diterima untuk scope lokal, dependency yang masih terblokir,
            dan target arsitektur yang belum diimplementasikan end-to-end.
          </p>
        </header>

        <nav className="flex flex-wrap gap-2" aria-label="Bagian presentasi">
          <Button type="button" className="min-h-10" variant={tab === 'summary' ? 'default' : 'outline'} onClick={() => setTab('summary')}>Ringkasan</Button>
          <Button type="button" className="min-h-10" variant={tab === 'implemented' ? 'default' : 'outline'} onClick={() => setTab('implemented')}>Alur diterima lokal</Button>
          <Button type="button" className="min-h-10" variant={tab === 'roadmap' ? 'default' : 'outline'} onClick={() => setTab('roadmap')}>Roadmap</Button>
        </nav>

        {tab === 'summary' && <PresentationReadinessGrid onSelectTab={setTab} />}

        {tab === 'implemented' && (
          <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]" aria-labelledby="implemented-title">
            <Card>
              <CardHeader>
                <Badge className="mb-2">Accepted local</Badge>
                <CardTitle id="implemented-title">Corporate Intake → Escrow Settlement</CardTitle>
                <CardDescription>Alur ini memiliki boundary server, kontrak typed, mutation atomik, dan tes lokal.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {implementedSteps.map((step, index) => (
                    <li key={step} className="flex gap-3 rounded-xl border bg-background p-4">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span>
                      <span className="self-center text-sm leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
                <CardTitle>Batas demo</CardTitle>
                <CardDescription>Gunakan portal klien untuk alur terintegrasi. Halaman ini tidak menjalankan mutation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Provider initiation belum tersedia, sehingga tidak ada URL checkout atau tombol bayar palsu.</p>
                <Button asChild className="min-h-10 w-full"><Link to="/client/auth">Buka portal klien</Link></Button>
              </CardContent>
            </Card>
          </section>
        )}

        {tab === 'roadmap' && (
          <section className="grid gap-4 md:grid-cols-2" aria-labelledby="roadmap-title">
            <h2 id="roadmap-title" className="sr-only">Roadmap yang belum selesai</h2>
            <Card className="border-dashed">
              <CardHeader>
                <CircleDashed className="size-8 text-muted-foreground" aria-hidden="true" />
                <div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Batch 3.C · Notary Workspace</CardTitle><Badge variant="outline">Future work</Badge></div>
                <CardDescription>Assignment, approval, dan lifecycle workspace Notaris belum diterima sebagai alur browser-safe end-to-end.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-dashed">
              <CardHeader>
                <CircleDashed className="size-8 text-muted-foreground" aria-hidden="true" />
                <div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Batch 3.D · e-KYC & Signing</CardTitle><Badge variant="outline">Future work</Badge></div>
                <CardDescription>Envelope, provider liveness, callback, dan storage end-to-end tetap target desain—bukan klaim implementasi.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-destructive/40 bg-destructive/5 md:col-span-2">
              <CardHeader>
                <ShieldAlert className="size-8 text-destructive" aria-hidden="true" />
                <CardTitle>Production go-live belum disetujui</CardTitle>
                <CardDescription>Phase 4 E2E/security/QA dan Phase 5 deployment readiness belum diselesaikan.</CardDescription>
              </CardHeader>
            </Card>
          </section>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-xs text-muted-foreground">
          <span>Status berdasarkan control plane lokal pada 13 Agustus 2026.</span>
          <Button asChild variant="ghost" className="min-h-10"><Link to="/"><ArrowLeft aria-hidden="true" />Kembali ke gateway</Link></Button>
        </footer>
      </div>
    </main>
  );
}