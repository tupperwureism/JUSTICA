import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import type { UserRole, AuthSession } from '../types/auth';
import { DEFAULT_SESSIONS } from '../types/auth';

interface BaseLayoutProps {
  children: (session: AuthSession) => React.ReactNode;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const location = useLocation();
  const currentRole: UserRole = location.pathname.startsWith('/advocate')
    ? 'ADVOCATE'
    : location.pathname.startsWith('/ai-legal') ? 'AI_ASSISTANT' : 'CLIENT';
  const currentSession = DEFAULT_SESSIONS[currentRole];
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar currentSession={currentSession} themeMode={themeMode}
        onToggleTheme={() => setThemeMode((mode) => mode === 'dark' ? 'light' : 'dark')} />

      <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-8 md:px-10 py-8">
        {children(currentSession)}
      </main>

      <Footer />
    </div>
  );
};
