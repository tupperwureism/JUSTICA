import React, { useMemo, useState } from 'react';
import { AdvocateCatalogFilters } from './AdvocateCatalogFilters';
import { AdvocateCatalogCard } from './AdvocateCatalogCard';
import { MOCK_ADVOCATES } from '@/data/clientAdvocates';
import type { Advocate } from '@/types/client';

interface AdvocateCatalogTabProps {
  onViewProfile: (advocate: Advocate) => void;
}

export const AdvocateCatalogTab: React.FC<AdvocateCatalogTabProps> = ({ onViewProfile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('Semua Spesialisasi');
  const [tierFilter, setTierFilter] = useState('Semua Pilihan Tarif');
  const [onlineOnly, setOnlineOnly] = useState(false);

  const specialties = useMemo(
    () => ['Semua Spesialisasi', ...Array.from(new Set(MOCK_ADVOCATES.map((item) => item.specialty)))],
    []
  );

  const filteredAdvocates = useMemo(() => MOCK_ADVOCATES.filter((advocate) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = query === '' || advocate.name.toLowerCase().includes(query)
      || advocate.specialty.toLowerCase().includes(query);
    const matchesSpecialty = specialtyFilter === 'Semua Spesialisasi' || advocate.specialty === specialtyFilter;
    const matchesOnline = !onlineOnly || advocate.isOnline;
    const matchesTier = tierFilter === 'Semua Pilihan Tarif'
      || (tierFilter === 'Gratis / Pro Bono' && advocate.services.some((service) => service.price === 0))
      || (tierFilter === 'Rp 0 — Rp 500.000' && advocate.services.some((service) => service.price <= 500000))
      || (tierFilter === '> Rp 500.000' && advocate.services.some((service) => service.price > 500000));
    return matchesSearch && matchesSpecialty && matchesOnline && matchesTier;
  }), [searchQuery, specialtyFilter, tierFilter, onlineOnly]);

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading tracking-tight">Pilih Advokat Terverifikasi</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Seluruh advokat mitra Justica berlisensi resmi Mahkamah Agung dan siap membantu permasalahan hukum Anda.</p>
      </div>
      <AdvocateCatalogFilters searchQuery={searchQuery} specialties={specialties}
        specialtyFilter={specialtyFilter} tierFilter={tierFilter} onlineOnly={onlineOnly}
        onSearchChange={setSearchQuery} onSpecialtyChange={setSpecialtyFilter}
        onTierChange={setTierFilter} onOnlineChange={setOnlineOnly} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAdvocates.map((advocate) => <AdvocateCatalogCard key={advocate.id} advocate={advocate} onViewProfile={onViewProfile} />)}
        {filteredAdvocates.length === 0 && <div className="col-span-full py-16 text-center text-sm text-muted-foreground">Tidak ada advokat yang cocok dengan filter Anda.</div>}
      </div>
    </div>
  );
};
