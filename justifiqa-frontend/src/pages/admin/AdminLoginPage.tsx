import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, LockKeyhole, Moon, ShieldAlert, Sun } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authErrorMessage, signInPortal } from '@/services/portalAuthService';
import { safePortalRedirect } from '@/types/portalAuth';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );

  useEffect(() => {
    if (themeMode === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [themeMode]);

  const handleToggleTheme = () => setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'));

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const isLocalSeedAdmin = import.meta.env.DEV && normalizedEmail === 'admin@test.com';
    if (!normalizedEmail.endsWith('@justica.id') && !isLocalSeedAdmin) {
      window.alert('Gunakan email korporat Administrator dengan domain @justica.id.');
      return;
    }
    if (!/^\d{6}$/.test(otp)) return window.alert('Kode OTP harus terdiri dari tepat 6 digit.');
    setSubmitting(true);
    try {
      await signInPortal(normalizedEmail, password, 'ADMIN');
      navigate(safePortalRedirect(searchParams.get('redirect'), 'ADMIN'), { replace: true });
    } catch (error) {
      window.alert(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-8">
      <Card className="w-full max-w-lg space-y-6 rounded-3xl border-border bg-card/95 p-6 shadow-2xl sm:p-8">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleToggleTheme} className="min-h-10 shrink-0 gap-2 whitespace-nowrap rounded-full font-semibold">
              {themeMode === 'dark' ? <Moon className="size-4 text-blue-400" /> : <Sun className="size-4 text-amber-500" />}
              {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Button>
          </div>
          <div className="text-center"><LockKeyhole className="mx-auto size-10 text-blue-500" /><p className="mt-3 text-xs font-bold uppercase tracking-widest text-blue-500">JUSTICA ADMIN</p><h1 className="mt-1 text-2xl font-black">Secure Corporate Gateway</h1></div>
        </div>
        <div className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300"><ShieldAlert className="size-5 shrink-0" /><p>Akses khusus Administrator Kepatuhan &amp; Arbiter Dewan Justica yang telah diprovisioning secara internal.</p></div>
        <form className="space-y-4" onSubmit={submitLogin}>
          <label className="block space-y-2 text-sm font-bold">ID Administrator / Email Korporat (@justica.id)<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12" placeholder="admin.compliance@justica.id" required /></label>
          <label className="block space-y-2 text-sm font-bold">Kata Sandi<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12" required /></label>
          <label className="block space-y-2 text-sm font-bold">Kode OTP / MFA 2FA<Input value={otp} onChange={(event) => setOtp(event.target.value)} className="h-12 font-mono tracking-widest" inputMode="numeric" maxLength={6} placeholder="000000" required /></label>
          <Button type="submit" size="lg" disabled={submitting} className="h-12 w-full shrink-0 bg-blue-600 font-bold text-white hover:bg-blue-700">{submitting ? 'MEMVERIFIKASI SESI...' : 'MASUK KE PORTAL ADMIN'}</Button>
        </form>
        <Button asChild variant="outline" className="min-h-10 w-full"><Link to="/"><ArrowLeft />Kembali ke Gerbang Utama</Link></Button>
      </Card>
    </main>
  );
}
