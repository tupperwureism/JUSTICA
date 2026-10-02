import React from 'react';
import { Star, Wifi } from 'lucide-react';
import type { Advocate, ServiceOption } from '@/types/client';

interface Props { advocate: Advocate; selectedService: ServiceOption; onSelectService: (service: ServiceOption) => void }

export const AdvocateProfileDetails: React.FC<Props> = ({ advocate, selectedService, onSelectService }) => (
  <div className="lg:col-span-3 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-border">
    <div className="flex items-start gap-4">
      <div className="client-profile-avatar">{advocate.avatarInitials}</div>
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold text-foreground font-heading leading-snug">{advocate.name}</h2>
        <p className="text-xs text-muted-foreground mt-1">{advocate.specialty}</p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="client-profile-stat text-amber-500"><Star className="w-3.5 h-3.5 fill-amber-500" />{advocate.rating.toFixed(1)} dari {advocate.reviewCount} Klien</span>
          {advocate.isOnline && <span className="client-profile-stat text-emerald-500"><Wifi className="w-3.5 h-3.5" />Online Sekarang</span>}
        </div>
      </div>
    </div>
    <div className="space-y-1.5">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Profil & Pengalaman</h3>
      <p className="text-sm text-foreground leading-relaxed">{advocate.bio}</p>
    </div>
    <div className="space-y-3">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">1. Pilih Layanan Konsultasi</h3>
      <div className="flex flex-col gap-2.5">
        {advocate.services.map((service) => {
          const active = service.id === selectedService.id;
          return <button key={service.id} type="button" onClick={() => onSelectService(service)} className={`client-service-option ${active ? 'active' : ''}`}>
            <span className={`client-service-radio ${active ? 'active' : ''}`}>{active && <span />}</span>
            <span className="min-w-0"><span className="block text-sm font-bold text-foreground">{service.label} — {service.priceLabel}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{service.description}</span></span>
          </button>;
        })}
      </div>
    </div>
  </div>
);
