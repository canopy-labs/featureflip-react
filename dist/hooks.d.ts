import { FeatureflipClient } from '../../browser-sdk/src';
export declare function useFeatureFlag<T>(key: string, defaultValue: T): T;
export declare function useFeatureflipClient(): FeatureflipClient;
export declare function useFeatureflipStatus(): {
    isReady: boolean;
    isError: boolean;
    error: Error | null;
};
//# sourceMappingURL=hooks.d.ts.map