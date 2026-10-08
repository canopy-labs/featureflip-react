import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { FeatureflipClient } from '@featureflip/browser';
import { FeatureflipProvider } from '../provider';
import { useFeatureFlag } from '../hooks';

function Probe() {
  const on = useFeatureFlag('bool-flag', false);
  return <span>{String(on)}</span>;
}

function makeFetch() {
  return vi.fn(async (url: string, _init?: RequestInit) =>
    url.endsWith('/v1/client/events')
      ? { ok: true, status: 202, json: async () => ({}) }
      : {
          ok: true,
          status: 200,
          json: async () => ({ flags: { 'bool-flag': { value: true, variation: 'on', reason: 'fallthrough' } } }),
        },
  );
}

describe('read reporting through the provider', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    FeatureflipClient.resetForTesting();
    globalThis.fetch = originalFetch;
  });

  it('a flag read through useFeatureFlag is reported once despite repeated renders', async () => {
    const fetchMock = makeFetch();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const tree = (
      <FeatureflipProvider clientKey="react-read-key" baseUrl="http://x" streaming={false} context={{ user_id: 'u1' }}>
        <Probe />
      </FeatureflipProvider>
    );
    const { rerender, unmount } = render(tree);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    for (let i = 0; i < 20; i++) rerender(tree);
    unmount(); // last handle closes -> final flush

    await vi.waitFor(() => {
      const events = fetchMock.mock.calls
        .filter(([u]) => String(u).endsWith('/v1/client/events'))
        .flatMap(([, init]) => JSON.parse((init as RequestInit).body as string).events);
      // 21+ renders, two events: the render before the first evaluate response reads
      // the flag as absent (no variation), the renders after read variation 'on'.
      // The recorder dedupes on (flag, variation, user), so each is reported once.
      const reads = events.filter((e: { flagKey: string }) => e.flagKey === 'bool-flag');
      expect(reads.map((e: { variation?: string }) => e.variation)).toEqual([undefined, 'on']);
    });
  });

  it('sendEvaluationEvents={false} on the provider reaches the client: no events, no header', async () => {
    const fetchMock = makeFetch();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { unmount } = render(
      <FeatureflipProvider
        clientKey="react-optout-key"
        baseUrl="http://x"
        streaming={false}
        context={{ user_id: 'u1' }}
        sendEvaluationEvents={false}
      >
        <Probe />
      </FeatureflipProvider>,
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    unmount();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/v1/client/events'))).toHaveLength(0);
    const [[, init]] = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/v1/client/evaluate'));
    expect((init as RequestInit).headers).not.toHaveProperty('X-Featureflip-Reports-Evaluations');
  });
});
