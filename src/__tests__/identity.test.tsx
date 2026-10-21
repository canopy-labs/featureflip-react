import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { FeatureflipClient } from '@featureflip/browser';
import { FeatureflipProvider } from '../provider';

/**
 * The provider names itself after the browser SDK it runs on (#4147, contract in
 * #4138): `X-Featureflip-SDK: featureflip-browser/<v> featureflip-react/<v>`.
 * Without it, React usage reads as plain browser-SDK usage.
 */
// Both inlined by vite.config.ts from the two packages' package.json files.
declare const __SDK_VERSION__: string;

describe('React SDK identity', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    FeatureflipClient.resetForTesting();
    globalThis.fetch = originalFetch;
  });

  it('has real versions for both tokens', () => {
    expect(__SDK_VERSION__).toMatch(/^\d+\.\d+\.\d+/);
    expect(__REACT_SDK_VERSION__).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('sends featureflip-react/<version> after the browser token', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
      ok: true,
      status: 200,
      json: async () => ({ flags: {} }),
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { unmount } = render(
      <FeatureflipProvider clientKey="react-identity-key" baseUrl="http://x" streaming={false}>
        <span />
      </FeatureflipProvider>,
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    unmount();

    const [, init] = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/v1/client/evaluate'))!;
    expect((init as RequestInit).headers).toMatchObject({
      'X-Featureflip-SDK': `featureflip-browser/${__SDK_VERSION__} featureflip-react/${__REACT_SDK_VERSION__}`,
    });
  });
});
