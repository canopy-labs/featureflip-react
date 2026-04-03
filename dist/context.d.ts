import { FeatureflipClient } from '../../browser-sdk/src';
export interface FeatureflipContextValue {
    client: FeatureflipClient;
    isReady: boolean;
    isError: boolean;
    error: Error | null;
}
export declare const FeatureflipContext: import('react').Context<FeatureflipContextValue | null>;
//# sourceMappingURL=context.d.ts.map