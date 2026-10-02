import React from 'react';
import { ShieldAlert, Lock, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="shared-footer-shell">
      <div className="shared-footer-inner">
        <div>
          <h4 className="font-heading text-lg font-bold text-foreground">JUSTICA LEGALTECH</h4>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            Platform hukum digital Indonesia dengan transaksi ACID Mutex dan jejak audit WORM Immutable Vault.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="shared-footer-badge text-emerald-500"><Lock />PostgreSQL Row-Lock Mutex</div>
          <div className="shared-footer-badge text-amber-500"><Database />WORM Immutable Audit Trail</div>
          <div className="shared-footer-badge text-blue-500"><ShieldAlert />RLS proacl Hardened</div>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-7xl border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © 2026 Justica SuperApp. All Rights Reserved.
      </div>
    </footer>
  );
};
