import { useState, type FormEvent } from 'react';
import { Send, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReviewRatingModalProps {
  onClose: () => void;
  onSubmit: () => void;
}

const DEFAULT_REVIEW = 'Dr. Mahendra sangat profesional dan penjelasan hukumnya sangat terstruktur.';

export function ReviewRatingModal({ onClose, onSubmit }: ReviewRatingModalProps) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState(DEFAULT_REVIEW);
  const [anonymized, setAnonymized] = useState(true);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className="client-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <form className="client-modal-shell review-modal-shell" onSubmit={handleSubmit}>
        <header className="client-modal-header">
          <div><h2 id="review-title" className="font-heading text-lg font-extrabold">Bagikan Pengalaman Konsultasi Anda</h2><p className="mt-1 text-xs text-muted-foreground">Escrow berhasil dilepaskan kepada Dr. Mahendra Kusuma.</p></div>
          <button type="button" onClick={onClose} className="client-modal-close" aria-label="Tutup"><X /></button>
        </header>
        <div className="review-modal-body">
          <div>
            <p className="mb-3 text-center text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Pilih Penilaian Bintang</p>
            <div className="review-star-grid">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button key={value} type="button" variant="outline" aria-label={`${value} bintang`} aria-pressed={rating === value} onClick={() => setRating(value)} className={`review-star-button ${rating === value ? 'active' : ''}`}>
                  <Star className="size-4 fill-current" /><span className="hidden sm:inline">{value}</span>
                </Button>
              ))}
            </div>
          </div>
          <label className="text-sm font-bold text-foreground">Ulasan Singkat (Opsional)
            <textarea value={review} onChange={(event) => setReview(event.target.value)} className="review-textarea mt-2" />
          </label>
          <label className="review-anonymize-row">
            <input type="checkbox" checked={anonymized} onChange={(event) => setAnonymized(event.target.checked)} />
            <span>Anonimkan nama saya sesuai UU PDP No. 27/2022 dan tampilkan sebagai Klien Terverifikasi.</span>
          </label>
          <Button type="submit" className="consultation-action consultation-send-action"><Send />KIRIM ULASAN &amp; KEMBALI KE DASBOR</Button>
        </div>
      </form>
    </div>
  );
}
