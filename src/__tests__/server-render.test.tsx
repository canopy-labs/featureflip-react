// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FeatureflipClient } from '@featureflip/browser';
import { FeatureflipProvider } from '../provider';
import { useFeatureFlag, useFeatureflipStatus } from '../hooks';

function Banner() {
  const show = useFeatureFlag('banner', false);
  const { isReady } = useFeatureflipStatus();
  return <p>{`${String(show)} ${isReady ? 'ready' : 'loading'}`}</p>;
}

describe('FeatureflipProvider on the server', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    FeatureflipClient.resetForTesting();
  });

  it('renders each request with its own bootstrap values and makes no requests', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const a = renderToString(
      <FeatureflipProvider clientKey="k" context={{ user_id: 'a' }} bootstrap={{ banner: true }}>
        <Banner />
      </FeatureflipProvider>,
    );
    const b = renderToString(
      <FeatureflipProvider clientKey="k" context={{ user_id: 'b' }} bootstrap={{ banner: false }}>
        <Banner />
      </FeatureflipProvider>,
    );

    expect(a).toContain('true ready');
    expect(b).toContain('false ready');
    expect(fetchSpy).not.toHaveBeenCalled();
    // Nothing left behind in the process-wide cache by a render that never unmounts.
    expect(FeatureflipClient.debugLiveCoreCount).toBe(0);
  });

  it('renders defaults, not ready, without a bootstrap', () => {
    const html = renderToString(
      <FeatureflipProvider clientKey="k">
        <Banner />
      </FeatureflipProvider>,
    );
    expect(html).toContain('false loading');
  });
});
