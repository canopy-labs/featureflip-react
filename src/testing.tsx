import type { ReactNode } from 'react';
import { FeatureflipClient, type EvaluationInspector } from '@featureflip/browser';
import { FeatureflipContext } from './context';

interface TestFeatureflipProviderProps {
  flags: Record<string, unknown>;
  inspectors?: EvaluationInspector[];
  children: ReactNode;
}

export function TestFeatureflipProvider({
  flags,
  inspectors,
  children,
}: TestFeatureflipProviderProps) {
  const client = FeatureflipClient.forTesting(flags, inspectors);
  return (
    <FeatureflipContext.Provider value={{ client, isReady: true, isError: false, error: null }}>
      {children}
    </FeatureflipContext.Provider>
  );
}
