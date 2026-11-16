import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FeatureflipClient } from '@featureflip/browser';
import { FeatureflipProvider } from '../provider';
import { useFeatureFlag, useFeatureflipStatus } from '../hooks';

const KEY = 'sdk_client_SentinelKeyMustNeverAppearInLogs-0123456789';

function Banner() {
  const show = useFeatureFlag('banner', false);
  const { isReady } = useFeatureflipStatus();
  return <div data-testid="out">{`${String(show)} ${isReady ? 'ready' : 'loading'}`}</div>;
}

// The provider has no logging of its own; it must not add a leak on top of
// browser-sdk's redactor (#5166, #5167).
describe('FeatureflipProvider sentinel key', () => {
  let originalFetch: typeof globalThis.fetch;
  let originalEventSource: typeof globalThis.EventSource;
  const sinks: Array<ReturnType<typeof vi.spyOn>> = [];

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalEventSource = globalThis.EventSource;
    for (const m of ['log', 'info', 'warn', 'error', 'debug'] as const) {
      sinks.push(vi.spyOn(console, m).mockImplementation(() => {}));
    }
    globalThis.EventSource = vi.fn().mockImplementation(function () {
      return { addEventListener: vi.fn(), close: vi.fn(), onerror: null };
    }) as unknown as typeof EventSource;
  });

  afterEach(() => {
    FeatureflipClient.resetForTesting();
    globalThis.fetch = originalFetch;
    globalThis.EventSource = originalEventSource;
    sinks.splice(0).forEach((s) => s.mockRestore());
  });

  it('a transport error quoting the key never reaches console output', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(
      new TypeError(`request to /v1/client/evaluate?authorization=${KEY} failed (Authorization: ${KEY})`),
    ) as unknown as typeof fetch;

    render(
      <FeatureflipProvider clientKey={KEY} baseUrl="http://x" context={{ key: 'u' }}>
        <Banner />
      </FeatureflipProvider>,
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(screen.getByTestId('out').textContent).toContain('false');
    const out = JSON.stringify(
      sinks.map((s) =>
        (s.mock.calls as unknown[][]).map((c) =>
          c.map((a) => (a instanceof Error ? `${a.message}\n${a.stack}` : a)),
        ),
      ),
    );
    expect(out).toContain('initial flag fetch failed');
    expect(out).toContain('[redacted]');
    expect(out).not.toContain(KEY);
  });
});
