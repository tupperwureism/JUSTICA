import type React from 'react';
import { Building2, LayoutDashboard, Search } from 'lucide-react';
import type { ClientTabKey } from '@/types/client';

interface ClientTabNavProps {
  activeTab: ClientTabKey;
  onTabChange: (tab: ClientTabKey) => void;
  className?: string;
}

const TAB_ITEMS: { key: ClientTabKey; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Dasbor Saya & Riwayat', icon: LayoutDashboard },
  { key: 'catalog', label: 'Cari & Katalog Advokat', icon: Search },
  { key: 'j_biz', label: 'J-BIZ Pendirian Usaha', icon: Building2 },
];

export function ClientTabNav({ activeTab, onTabChange, className = '' }: ClientTabNavProps) {
  return (
    <nav className={`max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-border bg-secondary/60 p-1.5 ${className}`}>
      {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
        <button key={key} type="button" onClick={() => onTabChange(key)} className={`client-tab-btn shrink-0 whitespace-nowrap ${activeTab === key ? 'active' : ''}`}>
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
