import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FeatureflipClient } from '@featureflip/browser';
import { FeatureflipProvider } from '../provider';
import { useFeatureFlag, useFeatureflipStatus } from '../hooks';

function Banner() {
  const show = useFeatureFlag('banner', false);
  const { isReady } = useFeatureflipStatus();
  return <div data-testid="out">{`${String(show)} ${isReady ? 'ready' : 'loading'}`}</div>;
}

describe('FeatureflipProvider bootstrap', () => {
  let originalFetch: typeof globalThis.fetch;
  let originalEventSource: typeof globalThis.EventSource;
  let respond: (flags: Record<string, unknown>) => void;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalEventSource = globalThis.EventSource;
    const pending: Array<(flags: Record<string, unknown>) => void> = [];
    globalThis.fetch = vi.fn().mockImplementation(
      (url: string) =>
        new Promise((resolve) => {
          if (String(url).endsWith('/v1/client/events')) {
            resolve({ ok: true, json: () => Promise.resolve({}) });
            return;
          }
          pending.push((flags) => resolve({ ok: true, json: () => Promise.resolve({ flags }) }));
        }),
    );
    respond = (flags) => pending.shift()!(flags);
    globalThis.EventSource = vi.fn().mockImplementation(function () {
      return { addEventListener: vi.fn(), close: vi.fn(), onerror: null };
    }) as unknown as typeof EventSource;
  });

  afterEach(() => {
    FeatureflipClient.resetForTesting();
    globalThis.fetch = originalFetch;
    globalThis.EventSource = originalEventSource;
  });

  it('renders the bootstrap values, ready, on the first render', () => {
    const renders: string[] = [];
    function Probe() {
      const show = useFeatureFlag('banner', false);
      const { isReady } = useFeatureflipStatus();
      renders.push(`${String(show)} ${isReady}`);
      return null;
    }
    render(
      <FeatureflipProvider clientKey="k" bootstrap={{ banner: true }}>
        <Probe />
      </FeatureflipProvider>,
    );
    expect(renders[0]).toBe('true true');
  });

  it('switches to the server value when it arrives', async () => {
    render(
      <FeatureflipProvider clientKey="k" bootstrap={{ banner: true }}>
        <Banner />
      </FeatureflipProvider>,
    );
    expect(screen.getByTestId('out').textContent).toBe('true ready');

    await act(async () => {
      respond({ banner: { value: false, variation: 'off', reason: 'fallthrough' } });
    });
    expect(screen.getByTestId('out').textContent).toBe('false ready');
  });

  it('still starts not-ready without a bootstrap', () => {
    render(
      <FeatureflipProvider clientKey="k">
        <Banner />
      </FeatureflipProvider>,
    );
    expect(screen.getByTestId('out').textContent).toBe('false loading');
  });
});
