import React, { useState, useEffect } from 'react';
import { BaseLayout } from '../components/BaseLayout';
import {
  CheckCircle2,
  FileCheck,
  Wallet,
  Upload
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdvocateHeaderAndTabs, type AdvocateTabKey } from '../components/advocate/AdvocateHeaderAndTabs';
import { AdvocateGreetingCard } from '../components/advocate/AdvocateGreetingCard';
import { CommandCenterActiveCasesTable } from '../components/advocate/CommandCenterActiveCasesTable';
import { ScheduleManagementCard, type ScheduleSlots } from '../components/advocate/ScheduleManagementCard';
import { AdvocateE2EEHeaderAndSla } from '../components/advocate/AdvocateE2EEHeaderAndSla';
import { AdvocateE2EEChatPanel } from '../components/advocate/AdvocateE2EEChatPanel';
import { PreChatMoUModal } from '../components/common/PreChatMoUModal';
import { AdvocateCorporateCaseManager } from '../components/corporate/AdvocateCorporateCaseManager';

export const AdvocateDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdvocateTabKey>('command_center');
  const [hasAcceptedAdvocateMoU, setHasAcceptedAdvocateMoU] = useState(false);
  const [practiceStatus, setPracticeStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [simulateConflict, setSimulateConflict] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  // Fair-Clock SLA Monitor State (MOCK-J-AD-04)
  const [clockSeconds, setClockSeconds] = useState(44 * 60 + 12);
  const [isClockPaused, setIsClockPaused] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<Array<{ time: string; sender: string; text: string }>>([
    { time: '10:30', sender: 'Klien (PT Mitra Jaya)', text: 'Selamat pagi Pak Advokat, kami mengalami sengketa klaim kontrak vendor mendadak.' },
    { time: '10:31', sender: 'Anda (Dr. Mahendra)', text: 'Selamat pagi. Siap membantu. Mohon unggah draf kontrak NDA dan pasal yang dipermasalahkan agar saya tinjau.' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Schedule slots state (MOCK-J-AD-03)
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlots>({
    monday: { active: true, hours: '09:00 - 15:00 WIB' },
    tuesday: { active: true, hours: '09:00 - 16:00 WIB' },
    wednesday: { active: true, hours: '10:00 - 14:00 WIB' },
    thursday: { active: false, hours: '09:00 - 15:00 WIB' },
    friday: { active: false, hours: '13:00 - 17:00 WIB' }
  });

  // Deliverable upload state (MOCK-J-AD-05)
  const [deliverableFile, setDeliverableFile] = useState('Legal_Opinion_NDA_v1.pdf');
  const [deliverablePublished, setDeliverablePublished] = useState(false);

  // Wallet state (MOCK-J-AD-06)
  const [availableBalance, setAvailableBalance] = useState(14850000);
  const [escrowBalance] = useState(4200000);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (activeTab === 'e2ee_room' && !isClockPaused && clockSeconds > 0) {
      timer = setInterval(() => {
        setClockSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTab, isClockPaused, clockSeconds]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    document.documentElement.classList.toggle('light', themeMode === 'light');
  }, [themeMode]);

  const handleToggleStatus = () => {
    if (simulateConflict) {
      setConflictError('Error 409 Conflict: Gagal mengubah status praktik karena ada sesi konsultasi aktif atau sidang pengadilan.');
      return;
    }
    setConflictError(null);
    setPracticeStatus((prev) => (prev === 'ONLINE' ? 'OFFLINE' : 'ONLINE'));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setChatMessages((prev) => [...prev, { time: timeStr, sender: 'Anda (Dr. Mahendra)', text: newMessage.trim() }]);
    setNewMessage('');
  };

  const handleTogglePauseClock = () => {
    if (!isClockPaused && pauseCount >= 2) {
      alert('Batas maksimal akumulasi jeda 2 kali per sesi telah dicapai (SLA Guardrails Lapis 2).');
      return;
    }
    if (!isClockPaused) {
      setPauseCount((prev) => prev + 1);
    }
    setIsClockPaused(!isClockPaused);
  };

  const formatClock = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <BaseLayout>
      {(session) => (
        <div className="space-y-8 py-6 animate-fade-in font-sans">
          <AdvocateHeaderAndTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            practiceStatus={practiceStatus}
            onToggleStatus={handleToggleStatus}
            simulateConflict={simulateConflict}
            onToggleConflict={(checked) => {
              setSimulateConflict(checked);
              if (!checked) setConflictError(null);
            }}
            conflictError={conflictError}
            themeMode={themeMode}
            onToggleTheme={() => setThemeMode((mode) => mode === 'dark' ? 'light' : 'dark')}
          />
          {/* TAB 1 CONTENT: COMMAND CENTER ADVOKAT (MOCK-J-AD-02A) */}
          {activeTab === 'command_center' && (
            <div className="space-y-8 animate-fade-in">
              <AdvocateGreetingCard userName={session.userName} />
              <CommandCenterActiveCasesTable
                onEnterRoom={() => setActiveTab('e2ee_room')}
                onUploadDeliverable={() => setActiveTab('deliverable')}
                onViewMediation={() => alert('Membuka detail mediasi dispute escrow REQ-202607-003...')}
                onWithdrawEscrow={() => setActiveTab('wallet')}
              />
            </div>
          )}
          {activeTab === 'corporate_cases' && <AdvocateCorporateCaseManager />}
          {/* TAB 2 CONTENT: RUANG KONSULTASI ADVOKAT E2EE (MOCK-J-AD-04) */}
          {activeTab === 'e2ee_room' && (
            <div className="space-y-8 animate-fade-in">
              <PreChatMoUModal
                isOpen={!hasAcceptedAdvocateMoU}
                onAccept={() => setHasAcceptedAdvocateMoU(true)}
                onCancel={() => setActiveTab('command_center')}
                userRole="advocate"
                partnerName="PT Mitra Jaya"
              />
              <AdvocateE2EEHeaderAndSla
                clockSeconds={clockSeconds}
                formatClock={formatClock}
                isClockPaused={isClockPaused}
                onTogglePause={handleTogglePauseClock}
                pauseCount={pauseCount}
              />
              <AdvocateE2EEChatPanel
                chatMessages={chatMessages}
                newMessage={newMessage}
                onNewMessageChange={setNewMessage}
                onSendMessage={handleSendMessage}
                onGoToDeliverable={() => setActiveTab('deliverable')}
                onEndSession={() => {
                  if (confirm('Akhiri sesi konsultasi? Saldo Escrow akan diteruskan ke dompet Anda.')) {
                    setActiveTab('command_center');
                  }
                }}
              />
            </div>
          )}
          {/* TAB 3 CONTENT: PENGATURAN JADWAL & SLOT PRAKTIK (MOCK-J-AD-03) */}
          {activeTab === 'schedule' && (
            <ScheduleManagementCard
              scheduleSlots={scheduleSlots}
              onToggleDay={(day, checked) => setScheduleSlots((prev) => ({
                ...prev,
                [day]: { ...prev[day], active: checked }
              }))}
              onChangeHours={(day, hours) => setScheduleSlots((prev) => ({
                ...prev,
                [day]: { ...prev[day], hours }
              }))}
              onSaveSchedule={() => alert('Jadwal berhasil disimpan dan dikunci dengan row-level mutex (SELECT ... FOR UPDATE).')}
            />
          )}
          {/* TAB 4 CONTENT: PENERBITAN DELIVERABLE & E-METERAI (MOCK-J-AD-05) */}
          {activeTab === 'deliverable' && (
            <div className="space-y-8 animate-fade-in">
              <Card className="p-8 rounded-3xl bg-card/90 border border-border shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground uppercase tracking-tight">
                      PENERBITAN OPINI HUKUM &amp; E-METERAI PERURI
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Unggah dokumen opini hukum resmi atau kontrak ber-meterai elektronik Anda untuk diverifikasi oleh Klien.
                    </p>
                  </div>
                  <FileCheck className="w-8 h-8 text-blue-400" />
                </div>

                <Card className="p-6 rounded-2xl bg-secondary/30 border border-dashed border-border space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">File Dokumen Siap Dibubuhkan:</p>
                    <p className="text-xs font-mono text-blue-400 mt-1">{deliverableFile} (2.4 MB)</p>
                    <div className="mt-3">
                      <label className="cursor-pointer px-3.5 py-2 rounded-lg bg-secondary/80 hover:bg-secondary border border-border text-xs text-foreground font-semibold transition-all inline-block">
                        <span>Pilih Berkas Lain...</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setDeliverableFile(file.name);
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-2">
                      Status e-Meterai: Siap Dibubuhkan (Peruri SHA-256 KMS Signature)
                    </p>
                  </div>
                </Card>

                <Button
                  type="button"
                  size="lg"
                  onClick={() => {
                    setDeliverablePublished(true);
                    alert('Dokumen berhasil diterbitkan dengan e-Meterai Peruri dan tercatat pada WORM Vault!');
                  }}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl transition-all gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>TERBITKAN DOKUMEN BER-EMETERAI</span>
                </Button>

                {deliverablePublished && (
                  <Card className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-fade-in">
                    ✓ Dokumen deliverable telah diterbitkan dan dikirimkan ke dasbor Klien (`MOCK-J-CL-04`).
                  </Card>
                )}
              </Card>
            </div>
          )}

          {/* TAB 5 CONTENT: DOMPET ADVOKAT & PENCAIRAN HONOR (MOCK-J-AD-06) */}
          {activeTab === 'wallet' && (
            <div className="space-y-8 animate-fade-in">
              <Card className="p-8 rounded-3xl bg-card/90 border border-border shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground uppercase tracking-tight">
                      DOMPET ADVOKAT &amp; PENCAIRAN HONOR
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kelola saldo honorarium dan lakukan penarikan dana langsung ke rekening bank terdaftar Anda.
                    </p>
                  </div>
                  <Wallet className="w-8 h-8 text-emerald-400" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Card className="p-6 rounded-2xl bg-secondary/40 border border-border space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Saldo Tersedia (Siap Cair)</p>
                    <p className="text-2xl font-mono font-extrabold text-emerald-400">
                      Rp {availableBalance.toLocaleString('id-ID')}
                    </p>
                  </Card>
                  <Card className="p-6 rounded-2xl bg-secondary/40 border border-border space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Saldo Escrow HELD (Aktif)</p>
                    <p className="text-2xl font-mono font-extrabold text-blue-400">
                      Rp {escrowBalance.toLocaleString('id-ID')}
                    </p>
                  </Card>
                </div>

                <Card className="p-5 rounded-2xl bg-secondary/40 border border-border space-y-3">
                  <h3 className="text-xs font-bold text-foreground uppercase">Rekening Tujuan Penarikan BI-FAST</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-foreground">Bank Mandiri • Dr. Mahendra Kusuma</span>
                    <span className="font-mono text-emerald-400 font-bold">123-00-0998877-6</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    * Perhitungan potongan pajak PPh 21 tenaga ahli hukum (NPPN/Progressive) dihitung otomatis
                    dan diterbitkan bukti potong WORM instan saat pencairan.
                  </p>
                </Card>

                <Button
                  type="button"
                  size="lg"
                  onClick={() => {
                    setPayoutSuccess(true);
                    setAvailableBalance(0);
                    alert('Dana Rp 14.850.000 berhasil dicairkan via BI-FAST ke Bank Mandiri Anda!');
                  }}
                  disabled={availableBalance === 0}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-xl transition-all"
                >
                  {availableBalance === 0 ? 'SALDO TELAH DICAIRKAN' : 'CAIRKAN DANA KE BANK MANDIRI SEKARANG'}
                </Button>

                {payoutSuccess && (
                  <Card className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-fade-in">
                    ✓ Transaksi penarikan sukses! Bukti potong pajak PPh 21 telah dicatat ke dalam WORM Immutable Vault.
                  </Card>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </BaseLayout>
  );
};
