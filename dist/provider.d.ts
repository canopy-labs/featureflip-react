import { ReactNode } from 'react';
export interface FeatureflipProviderProps {
    clientKey: string;
    context?: Record<string, unknown>;
    baseUrl?: string;
    streaming?: boolean;
    children: ReactNode;
}
export declare function FeatureflipProvider({ clientKey, context, baseUrl, streaming, children, }: FeatureflipProviderProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=provider.d.ts.map