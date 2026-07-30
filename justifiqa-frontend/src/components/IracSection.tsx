import React, { useState } from 'react';
import { IracCard } from './IracCard';
import { IracHeaderSection } from './IracHeaderSection';
import { IracFormCard, type PresetFact } from './IracFormCard';
import { MockIracService } from '../services/mockIracService';
import type { IracAnalysis } from '../types/irac';

export interface IracSectionProps {
  onProceedToDraft: (analysis: IracAnalysis) => void;
}

const PRESET_FACTS: PresetFact[] = [
  {
    label: 'Sengketa Penyerobotan Tanah & AJB',
    text: 'Tanah warisan keluarga seluas 1.200 m2 di Bandung yang telah bersertifikat SHM atas nama Klien tiba-tiba dipagar dan dibangun pondasi oleh pihak pengembang properti sebelah tanpa izin atau transaksi jual beli akta PPAT. Pengembang mengklaim telah membeli dari pihak ketiga yang tidak berhak.',
  },
  {
    label: 'PHK Sepihak & Penahanan Pesangon',
    text: 'Klien telah bekerja selama 8 tahun dengan status PKWTT (karyawan tetap) di perusahaan logistik. Tanpa melalui surat peringatan (SP) dan tanpa mediasi bipartit, Klien diberhentikan sepihak dan perusahaan menolak membayar pesangon, UPMK, serta uang penggantian hak sesuai PP 35/2021 dengan alasan efisiensi.',
  },
  {
    label: 'Wanprestasi Kontrak Proyek Komersial',
    text: 'Klien menyepakati kontrak pengadaan perangkat keras server senilai Rp 850 Juta dengan PT Mitra Solusi. Perangkat telah dikirim dan diuji coba dengan berita acara terima (BAST) yang sah, namun setelah jatuh tempo 60 hari dari tagihan invoice, mitra tidak membayar dan mengabaikan 2 kali surat tagihan.',
  },
];

export const IracSection: React.FC<IracSectionProps> = ({ onProceedToDraft }) => {
  const [factsInput, setFactsInput] = useState<string>(PRESET_FACTS[0].text);
  const [caseTitleInput, setCaseTitleInput] = useState<string>('Sengketa Penyerobotan Tanah & AJB');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<IracAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handlePresetSelect = (preset: PresetFact) => {
    setCaseTitleInput(preset.label);
    setFactsInput(preset.text);
    setAnalysisResult(null);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!factsInput.trim()) {
      setErrorMsg('Silakan masukkan kronologi fakta permasalahan hukum terlebih dahulu.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await MockIracService.analyzeFactsToIrac(factsInput, caseTitleInput);
      setAnalysisResult(result);
    } catch {
      setErrorMsg('Gagal melakukan analisis neural IRAC. Silakan coba lagi.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="space-y-8 animate-fade-in py-6 border-t border-border">
      <IracHeaderSection />
      <IracFormCard
        presetFacts={PRESET_FACTS}
        caseTitleInput={caseTitleInput}
        onCaseTitleChange={setCaseTitleInput}
        factsInput={factsInput}
        onFactsChange={setFactsInput}
        onPresetSelect={handlePresetSelect}
        onSubmit={handleAnalyze}
        isAnalyzing={isAnalyzing}
        errorMsg={errorMsg}
      />
      {analysisResult && (
        <div id="irac-result">
          <IracCard analysis={analysisResult} onProceedToDraft={onProceedToDraft} />
        </div>
      )}
    </section>
  );
};
