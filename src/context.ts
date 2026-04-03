import { createContext } from 'react';
import type { FeatureflipClient } from '@featureflip/browser';

export interface FeatureflipContextValue {
  client: FeatureflipClient;
  isReady: boolean;
  isError: boolean;
  error: Error | null;
}

export const FeatureflipContext = createContext<FeatureflipContextValue | null>(null);
