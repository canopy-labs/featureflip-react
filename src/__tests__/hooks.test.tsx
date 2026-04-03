import { describe, it, expect } from 'vitest';
import { useState, useMemo } from 'react';
import { render, screen, act } from '@testing-library/react';
import { FeatureflipClient } from '@featureflip/browser';
import { FeatureflipContext } from '../context';
import { TestFeatureflipProvider } from '../testing';
import { useFeatureFlag, useFeatureflipStatus, useFeatureflipClient } from '../hooks';

describe('useFeatureFlag', () => {
  it('returns default value when flag not in provider', () => {
    function TestComponent() {
      const value = useFeatureFlag('missing-flag', false);
      return <div>{String(value)}</div>;
    }
    render(
      <TestFeatureflipProvider flags={{}}>
        <TestComponent />
      </TestFeatureflipProvider>,
    );
    expect(screen.getByText('false')).toBeDefined();
  });

  it('returns flag value when available', () => {
    function TestComponent() {
      const value = useFeatureFlag('dark-mode', false);
      return <div>{String(value)}</div>;
    }
    render(
      <TestFeatureflipProvider flags={{ 'dark-mode': true }}>
        <TestComponent />
      </TestFeatureflipProvider>,
    );
    expect(screen.getByText('true')).toBeDefined();
  });

  it('returns string flag value', () => {
    function TestComponent() {
      const value = useFeatureFlag('banner', 'default');
      return <div>{value}</div>;
    }
    render(
      <TestFeatureflipProvider flags={{ banner: 'hello world' }}>
        <TestComponent />
      </TestFeatureflipProvider>,
    );
    expect(screen.getByText('hello world')).toBeDefined();
  });

  it('returns number flag value', () => {
    function TestComponent() {
      const value = useFeatureFlag('max-items', 10);
      return <div>{String(value)}</div>;
    }
    render(
      <TestFeatureflipProvider flags={{ 'max-items': 42 }}>
        <TestComponent />
      </TestFeatureflipProvider>,
    );
    expect(screen.getByText('42')).toBeDefined();
  });

  it('returns json flag value', () => {
    function TestComponent() {
      const value = useFeatureFlag('config', { theme: 'light' });
      return <div>{JSON.stringify(value)}</div>;
    }
    render(
      <TestFeatureflipProvider flags={{ config: { theme: 'dark', size: 'lg' } }}>
        <TestComponent />
      </TestFeatureflipProvider>,
    );
    expect(screen.getByText('{"theme":"dark","size":"lg"}')).toBeDefined();
  });

  it('does not infinite re-render with object defaultValue for missing flag', () => {
    // Use a stable client so context doesn't change between renders
    const client = FeatureflipClient.forTesting({});
    function StableProvider({ children }: { children: React.ReactNode }) {
      const value = useMemo(
        () => ({ client, isReady: true, isError: false, error: null }),
        [],
      );
      return (
        <FeatureflipContext.Provider value={value}>
          {children}
        </FeatureflipContext.Provider>
      );
    }
    let renderCount = 0;
    function TestComponent() {
      renderCount++;
      // Object literal creates a new reference each render — this previously
      // caused infinite re-renders because useSyncExternalStore's getSnapshot
      // returned a new object ref each time, failing Object.is equality.
      const value = useFeatureFlag('missing-json-flag', { theme: 'light' });
      return <div data-testid="json-value">{JSON.stringify(value)}</div>;
    }
    function Parent() {
      const [, setCount] = useState(0);
      return (
        <StableProvider>
          <TestComponent />
          <button onClick={() => setCount((c) => c + 1)}>rerender</button>
        </StableProvider>
      );
    }
    render(<Parent />);
    expect(screen.getByTestId('json-value').textContent).toBe('{"theme":"light"}');
    const before = renderCount;
    // Trigger parent re-render — creates a new { theme: 'light' } object
    act(() => {
      screen.getByText('rerender').click();
    });
    // Should re-render at most a couple of times, not loop infinitely
    expect(renderCount - before).toBeLessThanOrEqual(3);
  });

  it('throws when used outside provider', () => {
    function TestComponent() {
      const value = useFeatureFlag('flag', false);
      return <div>{String(value)}</div>;
    }
    expect(() => render(<TestComponent />)).toThrow(
      'useFeatureFlag must be used within a <FeatureflipProvider>',
    );
  });
});

describe('useFeatureflipStatus', () => {
  it('returns ready state from TestFeatureflipProvider', () => {
    function TestComponent() {
      const { isReady, isError } = useFeatureflipStatus();
      return (
        <div>
          {isReady ? 'ready' : 'loading'} {isError ? 'error' : 'ok'}
        </div>
      );
    }
    render(
      <TestFeatureflipProvider flags={{}}>
        <TestComponent />
      </TestFeatureflipProvider>,
    );
    expect(screen.getByText('ready ok')).toBeDefined();
  });
});

describe('useFeatureflipClient', () => {
  it('returns the client instance', () => {
    function TestComponent() {
      const client = useFeatureflipClient();
      return <div>{client ? 'has-client' : 'no-client'}</div>;
    }
    render(
      <TestFeatureflipProvider flags={{}}>
        <TestComponent />
      </TestFeatureflipProvider>,
    );
    expect(screen.getByText('has-client')).toBeDefined();
  });

  it('throws when used outside provider', () => {
    function TestComponent() {
      const client = useFeatureflipClient();
      return <div>{String(client)}</div>;
    }
    expect(() => render(<TestComponent />)).toThrow(
      'useFeatureFlag must be used within a <FeatureflipProvider>',
    );
  });
});
