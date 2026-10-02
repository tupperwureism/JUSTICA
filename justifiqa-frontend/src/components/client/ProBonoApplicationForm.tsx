import React, { useState } from 'react';
import { ArrowRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const ProBonoApplicationForm: React.FC<{ onApproved: () => void }> = ({ onApproved }) => {
  const [nik, setNik] = useState('');
  const [sktmNumber, setSktmNumber] = useState('');
  const [fileName, setFileName] = useState('');
  return <div className="space-y-4">
    <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Pengajuan Bantuan Hukum Gratis (SKTM)</p>
    <label className="client-form-field"><span>Nomor NIK KTP</span><Input value={nik} onChange={(event) => setNik(event.target.value)} placeholder="3171234567890001" maxLength={16} className="client-form-input font-mono" /></label>
    <label className="client-form-field"><span>Nomor Surat SKTM Kelurahan</span><Input value={sktmNumber} onChange={(event) => setSktmNumber(event.target.value)} placeholder="SKTM/2026/VII/0921" className="client-form-input font-mono" /></label>
    <label className="client-form-field"><span>Unggah Foto SKTM Asli</span><span className="client-file-input"><span className="truncate">{fileName || 'Pilih Berkas Dokumen...'}</span><Upload className="w-4 h-4" /></span>
      <input type="file" className="hidden" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} /></label>
    <Button type="button" size="lg" disabled={!nik || !sktmNumber} onClick={onApproved} className="client-primary-action w-full disabled:opacity-50"><span>AJUKAN PRO BONO (Rp 0)</span><ArrowRight className="w-4 h-4" /></Button>
  </div>;
};
