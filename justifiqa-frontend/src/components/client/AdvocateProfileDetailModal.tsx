// src/components/client/AdvocateProfileDetailModal.tsx
import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AdvocateProfileDetails } from './AdvocateProfileDetails';
import { AdvocateBookingPanel } from './AdvocateBookingPanel';
import type { Advocate, ServiceOption, CheckoutDraft } from '@/types/client';

interface AdvocateProfileDetailModalProps {
  advocate: Advocate;
  onClose: () => void;
  onProceedToCheckout: (draft: CheckoutDraft) => void;
}

export const AdvocateProfileDetailModal: React.FC<AdvocateProfileDetailModalProps> = ({
  advocate,
  onClose,
  onProceedToCheckout,
}) => {
  const [selectedService, setSelectedService] = useState<ServiceOption>(
    advocate.services[1] ?? advocate.services[0]
  );
  const [meetingMethod, setMeetingMethod] = useState<'online' | 'offline'>('online');
  const [selectedDate] = useState('Hari Ini, 10 Juli 2026');
  const [selectedTime, setSelectedTime] = useState('10:30 WIB');

  const handleSubmit = () => {
    onProceedToCheckout({
      advocate,
      service: selectedService,
      meetingMethod,
      date: selectedDate,
      time: selectedTime,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-4xl my-auto rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 sm:px-8 py-5 border-b border-border flex-shrink-0">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider border-primary/40 bg-primary/10 text-primary gap-1.5">
            <ShieldCheck className="w-3 h-3 flex-shrink-0" />
            <span>Advokat Terverifikasi Resmi</span>
          </Badge>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Body — two-column, single card each, no nested doll */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 max-h-[75vh] overflow-y-auto">
          <AdvocateProfileDetails advocate={advocate} selectedService={selectedService} onSelectService={setSelectedService} />

          <AdvocateBookingPanel service={selectedService} meetingMethod={meetingMethod}
            selectedDate={selectedDate} selectedTime={selectedTime} onMethodChange={setMeetingMethod}
            onTimeChange={setSelectedTime} onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
};
