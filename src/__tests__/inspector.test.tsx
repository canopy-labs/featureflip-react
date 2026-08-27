import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode } from 'react';
import { render, screen, act } from '@testing-library/react';
import type { EvaluationEvent, FeatureflipClient } from '@featureflip/browser';
import { TestFeatureflipProvider } from '../testing';
import { FeatureflipProvider } from '../provider';
import { useFeatureFlag, useFeatureflipClient } from '../hooks';

function BoolFlag() {
  const value = useFeatureFlag('stub-flag', false);
  return <span data-testid="v">{String(value)}</span>;
}

describe('react inspectors', () => {
  it('forwards inspectors through TestFeatureflipProvider', () => {
    const events: EvaluationEvent[] = [];

    render(
      <TestFeatureflipProvider flags={{ 'stub-flag': true }} inspectors={[(e) => events.push(e)]}>
        <BoolFlag />
      </TestFeatureflipProvider>,
    );

    expect(screen.getByTestId('v').textContent).toBe('true');
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].flagKey).toBe('stub-flag');
    expect(events[0].value).toBe(true);
  });
});

describe('react inspectors — StrictMode remount', () => {
  let originalFetch: typeof globalThis.fetch;
  let originalEventSource: typeof globalThis.EventSource;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalEventSource = globalThis.EventSource;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.EventSource = originalEventSource;
  });

  it('keeps delivering inspector events after the StrictMode cleanup/remount cycle', async () => {
    // StrictMode mounts, cleans up (closes the only handle -> refcount hits 0
    // -> the shared core shuts down and is dropped from the cache), then
    // remounts. The remount's `FeatureflipClient.get()` call is therefore a
    // fresh construction, not a cache hit — so it is this SECOND call site
    // (inside the effect) whose `inspectors` argument matters here, not the
    // first (the initial ref-creation render). If only the first call site
    // forwarded `inspectors`, this core would come up with none registered
    // and inspector events would silently stop after the remount settles.
    const flags = {
      'strict-flag': { value: true, variation: 'on', reason: 'match' },
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ flags }),
    });
    globalThis.EventSource = vi.fn().mockImplementation(function () {
      return {
        addEventListener: vi.fn(),
        close: vi.fn(),
        onerror: null,
      };
    }) as unknown as typeof EventSource;

    const events: EvaluationEvent[] = [];
    const clientRef: { current: FeatureflipClient | null } = { current: null };

    function TestChild() {
      const value = useFeatureFlag('strict-flag', false);
      clientRef.current = useFeatureflipClient();
      return <span data-testid="v">{String(value)}</span>;
    }

    await act(async () => {
      render(
        <StrictMode>
          <FeatureflipProvider
            clientKey="strict-inspector-key"
            baseUrl="http://localhost:8080"
            inspectors={[(e) => events.push(e)]}
          >
            <TestChild />
          </FeatureflipProvider>
        </StrictMode>,
      );
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getByTestId('v').textContent).toBe('true');
    // The initial render/settle already proves inspectors fired at least
    // once on the post-remount client.
    expect(events.length).toBeGreaterThan(0);

    // Directly exercise the settled (post-StrictMode-remount) client to pin
    // the contract precisely: a fresh variation call on the exact client
    // instance handed to consumers after remount still fires the inspector.
    events.length = 0;
    expect(clientRef.current).not.toBeNull();
    clientRef.current!.boolVariation('strict-flag', false);

    expect(events).toHaveLength(1);
    expect(events[0].flagKey).toBe('strict-flag');
    expect(events[0].value).toBe(true);
  });
});
