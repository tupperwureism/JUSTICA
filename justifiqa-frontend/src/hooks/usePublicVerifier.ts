import { useEffect, useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

const MAX_PDF_BYTES = 15 * 1024 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export type VerifyStatus = 'idle' | 'verified' | 'mismatch';

export type PublicVerificationResult =
  Database['public']['Functions']['fn_verify_public_legal_document']['Returns'][number];

const bytesToHex = (bytes: ArrayBuffer): string =>
  Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');

export function usePublicVerifier() {
  const [isDark, setIsDark] = useState(true);
  const [verifyHash, setVerifyHash] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle');
  const [verificationResult, setVerificationResult] = useState<PublicVerificationResult | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);
  const clearResult = () => {
    setVerifyStatus('idle');
    setVerificationResult(null);
    setErrorMessage(null);
  };

  const selectFile = async (file: File) => {
    clearResult();
    setVerifyHash('');
    setSelectedFileName(null);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) return setErrorMessage('Berkas harus berformat PDF.');
    if (file.size > MAX_PDF_BYTES) return setErrorMessage('Ukuran PDF maksimum adalah 15 MB.');
    setIsBusy(true);
    try {
      setSelectedFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      const digest = await window.crypto.subtle.digest('SHA-256', await file.arrayBuffer());
      setVerifyHash(bytesToHex(digest));
    } catch {
      setErrorMessage('Browser gagal menghitung SHA-256 berkas ini.');
    } finally {
      setIsBusy(false);
    }
  };
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void selectFile(file);
  };
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files[0];
    if (file) void selectFile(file);
  };
  const onHashChange = (value: string) => {
    setVerifyHash(value.toLowerCase().trim());
    setSelectedFileName(null);
    clearResult();
  };
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const digest = verifyHash.toLowerCase().trim();
    clearResult();
    if (!SHA256_PATTERN.test(digest)) return setErrorMessage('Hash SHA-256 harus berisi tepat 64 karakter heksadesimal.');

    setIsBusy(true);
    try {
      const { data, error } = await supabase.rpc('fn_verify_public_legal_document', { p_sha256_hash: digest });
      if (error) return setErrorMessage('Layanan verifikasi belum dapat dihubungi. Silakan coba kembali.');
      const result = data[0] ?? null;
      setVerificationResult(result);
      setVerifyStatus(result?.digest_match ? 'verified' : 'mismatch');
      window.setTimeout(() => document.getElementById('verify-result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setErrorMessage('Layanan verifikasi belum dapat dihubungi. Silakan coba kembali.');
    } finally {
      setIsBusy(false);
    }
  };
  const reset = () => {
    setVerifyHash('');
    setSelectedFileName(null);
    clearResult();
  };

  return { isDark, setIsDark, verifyHash, selectedFileName, verifyStatus, verificationResult,
    isDraggingOver, setIsDraggingOver, isBusy, errorMessage, onHashChange, onFileChange,
    onDrop, onSubmit, reset };
}
