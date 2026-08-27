import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FeatureflipClient, type EvaluationInspector } from '@featureflip/browser';
import { FeatureflipContext, type FeatureflipContextValue } from './context';

export interface FeatureflipProviderProps {
  clientKey: string;
  context?: Record<string, unknown>;
  baseUrl?: string;
  streaming?: boolean;
  /**
   * In-process observers fired on every variation call. Honored on the first
   * `get()` per client key, like every other option.
   */
  inspectors?: EvaluationInspector[];
  children: ReactNode;
}

export function FeatureflipProvider({
  clientKey,
  context,
  baseUrl,
  streaming,
  inspectors,
  children,
}: FeatureflipProviderProps) {
  const clientRef = useRef<FeatureflipClient | null>(null);
  const [clientVersion, setClientVersion] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Seed with the JSON of the context the client is constructed with below,
  // so the post-mount effect compares equal on first run and only calls
  // identify() for genuinely changed contexts (e.g. async auth hydration).
  const contextJsonRef = useRef<string>(JSON.stringify(context ?? {}));

  // Create client once via ref (avoids double creation in StrictMode render).
  // `FeatureflipClient.get` dedupes by client key, so even without the ref
  // guard StrictMode's double-invoke would be harmless — but the ref gives
  // us a stable handle we can close in the effect cleanup.
  if (clientRef.current === null) {
    clientRef.current = FeatureflipClient.get({
      clientKey,
      baseUrl,
      context,
      streaming,
      inspectors,
    });
  }

  useEffect(() => {
    // StrictMode cleanup nulls the ref and closes the previous handle.
    // On remount, `get()` returns a new handle sharing the same underlying
    // core (refcounted), so there is no new SSE connection — StrictMode's
    // unmount/remount cycle is now a no-op at the network layer.
    if (!clientRef.current) {
      clientRef.current = FeatureflipClient.get({
        clientKey,
        baseUrl,
        context,
        streaming,
        inspectors,
      });
      setIsReady(false);
      setIsError(false);
      setError(null);
      // Trigger re-render so context value picks up the new client
      setClientVersion((v) => v + 1);
    }

    const client = clientRef.current;

    const handleReady = () => setIsReady(true);
    const handleError = (err: unknown) => {
      setIsError(true);
      setError(err instanceof Error ? err : new Error(String(err)));
    };

    client.on('ready', handleReady);
    client.on('error', handleError);

    // If the shared core was already initialized by a previous handle (e.g.
    // a StrictMode double-mount or another provider in the same tree), the
    // 'ready' event has already fired and our late listener would miss it.
    // Drive the UI state from `initialize()` — it resolves immediately on an
    // already-initialized core — so both the first and subsequent handles
    // converge on isReady=true.
    client
      .initialize()
      .then(handleReady)
      .catch(handleError);

    return () => {
      client.off('ready', handleReady);
      client.off('error', handleError);
      client.close();
      clientRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-identify when context changes
  useEffect(() => {
    const contextJson = JSON.stringify(context ?? {});
    if (contextJson !== contextJsonRef.current) {
      contextJsonRef.current = contextJson;
      clientRef.current?.identify(context ?? {}).catch(() => {
        // Error is surfaced via the client's 'error' event → handleError
      });
    }
  }, [context]);

  const value: FeatureflipContextValue = {
    client: clientRef.current,
    isReady,
    isError,
    error,
  };

  return (
    <FeatureflipContext.Provider value={value}>
      {children}
    </FeatureflipContext.Provider>
  );
}
