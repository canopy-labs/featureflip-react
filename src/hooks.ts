import { useContext, useCallback, useRef, useSyncExternalStore } from 'react';
import type { FeatureflipClient } from '@featureflip/browser';
import { FeatureflipContext, type FeatureflipContextValue } from './context';

function useFeatureflipContext(): FeatureflipContextValue {
  const ctx = useContext(FeatureflipContext);
  if (ctx === null) {
    throw new Error(
      'useFeatureFlag must be used within a <FeatureflipProvider>',
    );
  }
  return ctx;
}

function getVariation<T>(client: FeatureflipClient, key: string, defaultValue: T): T {
  switch (typeof defaultValue) {
    case 'boolean':
      return client.boolVariation(key, defaultValue) as T;
    case 'string':
      return client.stringVariation(key, defaultValue) as T;
    case 'number':
      return client.numberVariation(key, defaultValue) as T;
    default:
      return client.jsonVariation(key, defaultValue);
  }
}

export function useFeatureFlag<T>(key: string, defaultValue: T): T {
  const { client } = useFeatureflipContext();

  // Store defaultValue in a ref so getSnapshot doesn't depend on its reference identity.
  // This prevents infinite re-renders when defaultValue is an object literal.
  const defaultValueRef = useRef(defaultValue);
  defaultValueRef.current = defaultValue;

  // Cache the last snapshot and its serialized form to return a stable reference for object values
  const cachedSnapshot = useRef<T | undefined>(undefined);
  const cachedSnapshotJson = useRef<string | undefined>(undefined);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handler = () => onStoreChange();
      client.on('change', handler);
      return () => client.off('change', handler);
    },
    [client],
  );

  const getSnapshot = useCallback(
    () => {
      const value = getVariation(client, key, defaultValueRef.current);
      // Fast-path: skip serialization if reference is already stable
      if (Object.is(value, cachedSnapshot.current)) {
        return cachedSnapshot.current as T;
      }
      // Primitives are compared by value via Object.is — no caching needed
      if (typeof value !== 'object' || value === null) {
        cachedSnapshot.current = value;
        return value;
      }
      // For objects, compare serialized form to return a stable reference
      try {
        const json = JSON.stringify(value);
        if (cachedSnapshot.current !== undefined && json === cachedSnapshotJson.current) {
          return cachedSnapshot.current as T;
        }
        cachedSnapshot.current = value;
        cachedSnapshotJson.current = json;
      } catch {
        // Non-serializable value (circular ref, bigint) — update cache without comparison
        cachedSnapshot.current = value;
      }
      return value;
    },
    [client, key],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useFeatureflipClient(): FeatureflipClient {
  const { client } = useFeatureflipContext();
  return client;
}

export function useFeatureflipStatus(): {
  isReady: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { isReady, isError, error } = useFeatureflipContext();
  return { isReady, isError, error };
}
