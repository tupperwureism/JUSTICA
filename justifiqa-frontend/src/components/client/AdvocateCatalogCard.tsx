import React from 'react';
import { ArrowRight, Heart, ShieldCheck, Star, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Advocate } from '@/types/client';

interface Props { advocate: Advocate; onViewProfile: (advocate: Advocate) => void }

export const AdvocateCatalogCard: React.FC<Props> = ({ advocate, onViewProfile }) => (
  <Card className="flex flex-col gap-5 p-6 rounded-2xl border border-border bg-card shadow-md hover:shadow-xl hover:border-primary transition-all h-full relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-700" />
    <CardHeader className="p-0 gap-3">
      <div className="flex items-center gap-3">
        <div className="client-advocate-avatar">{advocate.avatarInitials}</div>
        <div className="min-w-0">
          <CardTitle className="text-base font-extrabold text-foreground leading-snug truncate">{advocate.name}</CardTitle>
          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-500" /><span>{advocate.rating.toFixed(1)}</span>
            <span className="text-muted-foreground font-medium">({advocate.reviewCount} Ulasan)</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="client-verified-badge"><ShieldCheck className="w-3 h-3" /><span>SIPP MA: {advocate.license}</span></Badge>
        {advocate.isOnline && <Badge variant="outline" className="client-online-badge"><Wifi className="w-3 h-3" /><span>Online</span></Badge>}
        {advocate.hasProBonoQuota && <Badge variant="outline" className="client-probono-badge"><Heart className="w-3 h-3" /><span>Kuota Pro Bono</span></Badge>}
      </div>
    </CardHeader>
    <CardContent className="p-0 flex-1 space-y-3">
      <div><p className="text-sm font-bold text-foreground">{advocate.specialty}</p><p className="text-xs text-muted-foreground">Pengalaman {advocate.experienceYears} Tahun</p></div>
      <ul className="space-y-1.5 text-xs text-muted-foreground">
        {advocate.services.slice(0, 3).map((service) => <li key={service.id} className="flex items-start gap-1.5"><span className="text-primary">•</span><span>{service.label} ({service.priceLabel})</span></li>)}
      </ul>
    </CardContent>
    <CardFooter className="p-0 mt-auto">
      <Button type="button" size="lg" onClick={() => onViewProfile(advocate)} className="client-primary-action w-full">
        <span>Lihat Profil & Jadwal</span><ArrowRight className="w-4 h-4" />
      </Button>
    </CardFooter>
  </Card>
);
