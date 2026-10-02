import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  searchQuery: string;
  specialties: string[];
  specialtyFilter: string;
  tierFilter: string;
  onlineOnly: boolean;
  onSearchChange: (value: string) => void;
  onSpecialtyChange: (value: string) => void;
  onTierChange: (value: string) => void;
  onOnlineChange: (value: boolean) => void;
}

export const AdvocateCatalogFilters: React.FC<Props> = (props) => (
  <div className="w-full p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
    <div className="relative flex-1 min-w-[220px]">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input type="text" value={props.searchQuery} onChange={(event) => props.onSearchChange(event.target.value)}
        placeholder="Cari nama advokat atau keahlian..." style={{ paddingLeft: '2.5rem' }}
        className="w-full h-11 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground" />
    </div>
    <select value={props.specialtyFilter} onChange={(event) => props.onSpecialtyChange(event.target.value)} className="client-catalog-select">
      {props.specialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
    </select>
    <select value={props.tierFilter} onChange={(event) => props.onTierChange(event.target.value)} className="client-catalog-select">
      <option>Semua Pilihan Tarif</option><option>Gratis / Pro Bono</option><option>Rp 0 — Rp 500.000</option><option>&gt; Rp 500.000</option>
    </select>
    <label className="client-filter-check">
      <input type="checkbox" checked={props.onlineOnly} onChange={(event) => props.onOnlineChange(event.target.checked)} className="w-4 h-4" />
      <span>Advokat Online</span>
    </label>
    <Button type="button" size="lg" className="client-primary-action"><Search className="w-4 h-4" /><span>CARI</span></Button>
  </div>
);
