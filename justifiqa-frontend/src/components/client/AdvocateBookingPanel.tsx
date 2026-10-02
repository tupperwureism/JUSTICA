import React from 'react';
import { ArrowRight, Calendar, CheckCircle2, Clock, MapPin, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ServiceOption, TimeSlot } from '@/types/client';

const TIME_SLOTS: TimeSlot[] = [
  { time: '09:00 WIB', available: false }, { time: '10:30 WIB', available: true },
  { time: '14:00 WIB', available: true }, { time: '16:00 WIB', available: true },
];

interface Props {
  service: ServiceOption;
  meetingMethod: 'online' | 'offline';
  selectedDate: string;
  selectedTime: string;
  onMethodChange: (method: 'online' | 'offline') => void;
  onTimeChange: (time: string) => void;
  onSubmit: () => void;
}

export const AdvocateBookingPanel: React.FC<Props> = (props) => (
  <div className="lg:col-span-2 p-6 sm:p-8 space-y-6 bg-secondary/30">
    <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">2. Metode & Jadwal Pertemuan</h3>
    <div className="flex gap-2">
      <button type="button" onClick={() => props.onMethodChange('online')} className={`client-booking-method ${props.meetingMethod === 'online' ? 'active' : ''}`}><Wifi className="w-3.5 h-3.5" /><span>Online (E2EE)</span></button>
      <button type="button" onClick={() => props.onMethodChange('offline')} className={`client-booking-method ${props.meetingMethod === 'offline' ? 'active' : ''}`}><MapPin className="w-3.5 h-3.5" /><span>Tatap Muka</span></button>
    </div>
    <div className="p-3.5 rounded-xl border border-border bg-card flex items-center gap-2.5"><Calendar className="w-4 h-4 text-primary" /><span className="text-sm font-semibold text-foreground">{props.selectedDate}</span></div>
    <div className="space-y-2">
      <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Pilihan Jam Tersedia</p>
      <div className="grid grid-cols-2 gap-2.5">
        {TIME_SLOTS.map((slot) => <button key={slot.time} type="button" disabled={!slot.available} onClick={() => props.onTimeChange(slot.time)}
          className={`client-time-slot ${!slot.available ? 'disabled' : props.selectedTime === slot.time ? 'active' : ''}`}>
          {slot.time}{!slot.available && ' (Penuh)'}
        </button>)}
      </div>
    </div>
    <div className="pt-2 border-t border-border space-y-3">
      <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Total Biaya</span><span className="font-extrabold text-foreground">{props.service.priceLabel}</span></div>
      <Button type="button" size="lg" onClick={props.onSubmit} className="client-primary-action w-full"><CheckCircle2 className="w-4 h-4" /><span>LANJUTKAN KE PEMBAYARAN</span><ArrowRight className="w-4 h-4" /></Button>
    </div>
  </div>
);
