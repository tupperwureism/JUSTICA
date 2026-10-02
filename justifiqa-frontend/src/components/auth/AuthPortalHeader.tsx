import { ArrowLeft, Briefcase, Moon, Scale, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { ThemeMode } from '@/types/authForms';

interface AuthPortalHeaderProps { portal: 'client' | 'advocate'; themeMode: ThemeMode; onToggleTheme: () => void }

export function AuthPortalHeader({ portal, themeMode, onToggleTheme }: AuthPortalHeaderProps) {
  const advocate = portal === 'advocate';
  return (
    <header className="w-full px-5 sm:px-8 pt-5 pb-4 flex items-center justify-between border-b border-border flex-shrink-0 min-h-[70px]">
      <Link to="/" className="flex items-center gap-2.5 group"><div className={`p-2 rounded-xl text-white shadow-lg group-hover:scale-105 transition-transform ${advocate ? 'bg-emerald-600' : 'bg-blue-600'}`}>{advocate ? <Briefcase className="w-5 h-5" /> : <Scale className="w-5 h-5" />}</div><span className="font-extrabold text-lg tracking-tight text-foreground font-heading">JUSTICA</span></Link>
      <div className="flex items-center gap-2 text-xs font-semibold">
        <Button type="button" variant="outline" size="sm" onClick={onToggleTheme} className="rounded-full gap-1.5 bg-secondary/60 border-border text-foreground hover:bg-secondary h-8 px-3">{themeMode === 'dark' ? <><Moon className="w-4 h-4 text-blue-400" /><span>Dark Mode</span></> : <><Sun className="w-4 h-4 text-amber-500" /><span>Light Mode</span></>}</Button>
        <Button asChild variant="outline" size="sm" className="rounded-full gap-1.5 bg-secondary/60 border-border text-foreground hover:bg-secondary h-8 px-3"><Link to="/"><ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" /><span>Gerbang</span></Link></Button>
      </div>
    </header>
  );
}
