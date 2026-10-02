import React from 'react';
import { PublicVerifierFormCard } from '@/components/verifier/PublicVerifierFormCard';
import { PublicVerifierHero } from '@/components/verifier/PublicVerifierHero';
import { PublicVerifierResult } from '@/components/verifier/PublicVerifierResult';
import { Button } from '@/components/ui/button';
import { usePublicVerifier } from '@/hooks/usePublicVerifier';

interface VerifierPanelProps {
  isDark?: boolean;
  onBackToGateway: () => void;
}

export const VerifierPanel: React.FC<VerifierPanelProps> = ({ onBackToGateway }) => {
  const verifier = usePublicVerifier();

  return (
    <section className="w-full max-w-6xl mx-auto py-12 px-4 sm:px-6 flex flex-col items-center gap-10 animate-fade-in">
      <PublicVerifierHero />
      <PublicVerifierFormCard {...verifier} />
      {verifier.verifyStatus !== 'idle' && (
        <PublicVerifierResult
          status={verifier.verifyStatus}
          verifyHash={verifier.verifyHash}
          result={verifier.verificationResult}
          onReset={verifier.reset}
        />
      )}
      <Button variant="outline" size="lg" onClick={onBackToGateway} className="rounded-xl font-bold gap-2 text-sm shadow-sm">
        &lt; Kembali ke Gerbang Utama
      </Button>
    </section>
  );
};
