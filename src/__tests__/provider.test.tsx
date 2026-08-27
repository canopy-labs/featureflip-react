import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode, useSyncExternalStore } from 'react';
import { render, screen, act } from '@testing-library/react';
import { FeatureflipClient } from '@featureflip/browser';
import { FeatureflipProvider } from '../provider';
import { useFeatureFlag, useFeatureflipStatus } from '../hooks';

function mockFetch(flags: Record<string, { value: unknown; variation: string; reason: string }>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ flags }),
  });
}

describe('FeatureflipProvider StrictMode', () => {
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

  it('has active SSE connection after StrictMode remount', async () => {
    // StrictMode runs: mount effect → cleanup → remount effect.
    // Bug: cleanup closes SSE but the same client is reused on remount.
    // Since it's already initialized, initialize() is a no-op → no active SSE.
    // Fix: null clientRef in cleanup, recreate client on remount.
    const flags = {
      'test-flag': { value: true, variation: 'on', reason: 'match' },
    };

    globalThis.fetch = mockFetch(flags);

    const closeFns: ReturnType<typeof vi.fn>[] = [];
    const MockES = vi.fn().mockImplementation(function () {
      const closeFn = vi.fn();
      closeFns.push(closeFn);
      return {
        addEventListener: vi.fn(),
        close: closeFn,
        onerror: null,
      };
    });
    globalThis.EventSource = MockES as unknown as typeof EventSource;

    function TestChild() {
      const value = useFeatureFlag('test-flag', false);
      const { isReady } = useFeatureflipStatus();
      return <div data-testid="flag">{String(value)} {isReady ? 'ready' : 'loading'}</div>;
    }

    await act(async () => {
      render(
        <StrictMode>
          <FeatureflipProvider clientKey="test-key" baseUrl="http://localhost:8080">
            <TestChild />
          </FeatureflipProvider>
        </StrictMode>,
      );
    });

    // Wait for all async init to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // After StrictMode settles, there should be exactly 1 active (unclosed) connection
    const unclosedCount = closeFns.filter((fn) => fn.mock.calls.length === 0).length;

    // With the bug: 0 active connections (closed client, no-op initialize)
    // or leaked connections (multiple unclosed)
    // With the fix: exactly 1 active connection
    expect(unclosedCount).toBe(1);

    // Flags should be evaluated correctly
    expect(screen.getByTestId('flag').textContent).toContain('true');
    expect(screen.getByTestId('flag').textContent).toContain('ready');
  });
});

describe('FeatureflipProvider context changes', () => {
  let originalFetch: typeof globalThis.fetch;
  let originalEventSource: typeof globalThis.EventSource;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalEventSource = globalThis.EventSource;
    globalThis.EventSource = vi.fn().mockImplementation(function () {
      return {
        addEventListener: vi.fn(),
        close: vi.fn(),
        onerror: null,
      };
    }) as unknown as typeof EventSource;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.EventSource = originalEventSource;
  });

  it('calls identify with the new context when a post-mount context change occurs', async () => {
    // Behavioral contract guarded by the fix for #1205: any context change
    // after mount must call identify() exactly once with the new context.
    // The bug-specific timing window (parent state change between first
    // render and first effect commit) is hard to reproduce deterministically
    // in jsdom — the fix is verifiable by inspection in `provider.tsx`
    // (initialize `contextJsonRef` from the mount-time context instead of
    // the `''` sentinel that swallowed the first comparison).
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ flags: {} }),
    });

    const identifySpy = vi.spyOn(FeatureflipClient.prototype, 'identify').mockResolvedValue();

    try {
      const { rerender } = render(
        <FeatureflipProvider clientKey="ctx-change-key" baseUrl="http://localhost:8080" context={{}}>
          <div />
        </FeatureflipProvider>,
      );

      await act(async () => {
        rerender(
          <FeatureflipProvider
            clientKey="ctx-change-key"
            baseUrl="http://localhost:8080"
            context={{ userId: 'u1' }}
          >
            <div />
          </FeatureflipProvider>,
        );
      });

      expect(identifySpy).toHaveBeenCalledTimes(1);
      expect(identifySpy).toHaveBeenCalledWith({ userId: 'u1' });
    } finally {
      identifySpy.mockRestore();
    }
  });

  it('propagates a context change driven by useSyncExternalStore hydration', async () => {
    // Contract test for the production pattern from #1205: a Zustand-style
    // store hydrates asynchronously and notifies React, forcing a re-render
    // with a new context shortly after mount. Identify must reflect the
    // hydrated user. (Note: the exact React-internals timing window that
    // triggered #1205 — where the pre-mount render's effect was discarded
    // entirely — could not be deterministically reproduced in jsdom; both
    // this test and the rerender-based test above PASS against the pre-fix
    // code. The fix itself is verifiable by inspection in `provider.tsx`:
    // contextJsonRef now seeds from the mount-time context instead of an
    // empty-string sentinel that could swallow the first real comparison.)
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ flags: {} }),
    });

    const identifySpy = vi.spyOn(FeatureflipClient.prototype, 'identify').mockResolvedValue();

    type Store = { userId: string | null };
    // Stable references — useSyncExternalStore caches snapshots by identity
    // and treats reference-equal snapshots as "no change."
    let snapshot: Store = { userId: null };
    const listeners = new Set<() => void>();
    const subscribe = (cb: () => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    };
    const getSnapshot = () => snapshot;

    // Drive the post-render-pre-effect hydration from outside the render
    // tree: fire it on the first listener subscription so React picks it up
    // before the initial effect flush.
    let hydrated = false;
    const subscribeWithHydration = (cb: () => void) => {
      const unsub = subscribe(cb);
      if (!hydrated) {
        hydrated = true;
        snapshot = { userId: 'u1' };
        // Notify synchronously — React reacts by scheduling another render
        // before the initial useEffect from the first render runs.
        cb();
      }
      return unsub;
    };

    function Harness() {
      const store = useSyncExternalStore(subscribeWithHydration, getSnapshot);
      const context = store.userId ? { userId: store.userId } : {};
      return (
        <FeatureflipProvider clientKey="ctx-hydration-key" baseUrl="http://localhost:8080" context={context}>
          <div />
        </FeatureflipProvider>
      );
    }

    try {
      await act(async () => {
        render(<Harness />);
      });

      // Must have learned about the hydrated user; the exact call count
      // depends on whether React fires the pre-hydration render's effect
      // (which would diff '{}' vs initial '{}' = no identify) before the
      // post-hydration one (which diffs '{"userId":"u1"}' vs '{}' = identify).
      expect(identifySpy).toHaveBeenCalled();
      expect(identifySpy).toHaveBeenLastCalledWith({ userId: 'u1' });
    } finally {
      identifySpy.mockRestore();
    }
  });

  it('does not call identify on initial mount when context is stable', async () => {
    // The client is constructed in the render phase with the initial context,
    // so a redundant identify() at mount would issue a wasted server call.
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ flags: {} }),
    });

    const identifySpy = vi.spyOn(FeatureflipClient.prototype, 'identify').mockResolvedValue();

    try {
      await act(async () => {
        render(
          <FeatureflipProvider
            clientKey="ctx-stable-key"
            baseUrl="http://localhost:8080"
            context={{ userId: 'u1' }}
          >
            <div />
          </FeatureflipProvider>,
        );
      });

      expect(identifySpy).not.toHaveBeenCalled();
    } finally {
      identifySpy.mockRestore();
    }
  });
});
