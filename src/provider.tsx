import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FeatureflipClient } from '@featureflip/browser';
import { FeatureflipContext, type FeatureflipContextValue } from './context';

export interface FeatureflipProviderProps {
  clientKey: string;
  context?: Record<string, unknown>;
  baseUrl?: string;
  streaming?: boolean;
  children: ReactNode;
}

export function FeatureflipProvider({
  clientKey,
  context,
  baseUrl,
  streaming,
  children,
}: FeatureflipProviderProps) {
  const clientRef = useRef<FeatureflipClient | null>(null);
  const [clientVersion, setClientVersion] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const contextJsonRef = useRef<string>('');

  // Create client once via ref (avoids double creation in StrictMode render)
  if (clientRef.current === null) {
    clientRef.current = new FeatureflipClient({
      clientKey,
      baseUrl,
      context,
      streaming,
    });
  }

  useEffect(() => {
    // StrictMode cleanup nulls the ref — recreate the client on remount
    if (!clientRef.current) {
      clientRef.current = new FeatureflipClient({
        clientKey,
        baseUrl,
        context,
        streaming,
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

    client.initialize().catch(handleError);

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
    if (contextJsonRef.current === '') {
      // First render, just store the value
      contextJsonRef.current = contextJson;
      return;
    }
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
