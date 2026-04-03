import type { ReactNode } from 'react';
import { FeatureflipClient } from '@featureflip/browser';
import { FeatureflipContext } from './context';

interface TestFeatureflipProviderProps {
  flags: Record<string, unknown>;
  children: ReactNode;
}

export function TestFeatureflipProvider({ flags, children }: TestFeatureflipProviderProps) {
  const client = FeatureflipClient.forTesting(flags);
  return (
    <FeatureflipContext.Provider value={{ client, isReady: true, isError: false, error: null }}>
      {children}
    </FeatureflipContext.Provider>
  );
}
