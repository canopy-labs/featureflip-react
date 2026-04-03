import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode } from 'react';
import { render, screen, act } from '@testing-library/react';
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
