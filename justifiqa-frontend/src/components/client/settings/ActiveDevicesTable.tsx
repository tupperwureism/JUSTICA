import { useState } from 'react';
import { Smartphone, Monitor, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function ActiveDevicesTable() {
  const [iphoneActive, setIphoneActive] = useState(true);

  return (
    <div className="dispute-table-wrap">
      <table className="settings-device-table">
        <thead><tr><th>Perangkat &amp; Browser</th><th>IP Address &amp; Lokasi</th><th>Aktivitas Terakhir</th><th>Aksi Keamanan</th></tr></thead>
        <tbody>
          <tr>
            <td><strong className="inline-flex items-center gap-2"><Monitor className="size-4" />Windows 11 Chrome</strong></td>
            <td className="font-mono">103.28.12.91 (Jakarta, ID)</td>
            <td className="font-bold text-emerald-500">Sesi Ini (Aktif Sekarang)</td>
            <td><Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-500">PERANGKAT INI</Badge></td>
          </tr>
          {iphoneActive && (
            <tr>
              <td><strong className="inline-flex items-center gap-2"><Smartphone className="size-4" />iPhone 15 Pro</strong></td>
              <td className="font-mono">103.28.12.44 (Jakarta, ID)</td>
              <td>09 Juli 2026 — 19:40 WIB</td>
              <td><Button type="button" onClick={() => setIphoneActive(false)} className="dispute-action dispute-danger-action"><XCircle />CABUT AKSES</Button></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
