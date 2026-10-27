// Compiled by tests/declarations.test.ts against the built dist/*.d.ts, the way
// a customer's project sees them. Every type below comes from
// @featureflip/browser. When react-sdk's declarations cannot reach that package
// (#4351), skipLibCheck turns each of them into `any`, nothing below is an error
// any more, and every @ts-expect-error fails as unused.
import type { ComponentProps } from 'react';
import {
  useFeatureflipClient,
  type EvaluationEvent,
  type EvaluationInspector,
  type FeatureflipContextValue,
  type FeatureflipProviderProps,
} from '@featureflip/react';
import { TestFeatureflipProvider } from '@featureflip/react/testing';

export function probe(
  ctx: FeatureflipContextValue,
  props: FeatureflipProviderProps,
  testProps: ComponentProps<typeof TestFeatureflipProvider>,
  event: EvaluationEvent,
): boolean {
  const client = useFeatureflipClient();
  // @ts-expect-error boolVariation takes a boolean default
  client.boolVariation('flag', 'yes');
  // @ts-expect-error stringVariation takes a string default
  ctx.client.stringVariation('flag', 1);
  // @ts-expect-error bootstrap is a flag map or 'localStorage'
  props.bootstrap = 42;
  // @ts-expect-error an inspector receives an EvaluationEvent
  const inspector: EvaluationInspector = (e: number) => e;
  // @ts-expect-error inspectors are functions
  testProps.inspectors = [42];
  // @ts-expect-error flagKey is a string
  const key: number = event.flagKey;
  void inspector;
  void key;
  return client.boolVariation('flag', false);
}
