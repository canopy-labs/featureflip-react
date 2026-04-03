# @featureflip/react-sdk

React bindings for Featureflip feature flag evaluation.

## Installation

```bash
npm install @featureflip/react-sdk @featureflip/browser-sdk
```

## Quick Start

Wrap your app with `FeatureflipProvider`, then use `useFeatureFlag` in any component.

```tsx
import { FeatureflipProvider, useFeatureFlag } from '@featureflip/react-sdk';

function App() {
  return (
    <FeatureflipProvider clientKey="your-client-sdk-key">
      <Banner />
    </FeatureflipProvider>
  );
}

function Banner() {
  const showBanner = useFeatureFlag('show-banner', false);
  if (!showBanner) return null;
  return <div>New feature available!</div>;
}
```

## Provider Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `clientKey` | `string` | **(required)** | Client SDK key |
| `context` | `Record<string, unknown>` | `undefined` | Evaluation context (user attributes) |
| `baseUrl` | `string` | `undefined` | Evaluation API base URL |
| `streaming` | `boolean` | `undefined` | Enable SSE streaming |

The provider creates a `FeatureflipClient` internally and calls `initialize()` on mount. It cleans up (calls `close()`) on unmount.

## Hooks

### `useFeatureFlag<T>(key: string, defaultValue: T): T`

Returns the evaluated value of a flag. The component re-renders automatically when the flag value changes via streaming or `identify()`. The type of `defaultValue` determines which variation method is called (`boolVariation`, `stringVariation`, `numberVariation`, or `jsonVariation`).

```tsx
const enabled = useFeatureFlag('new-checkout', false);
const color = useFeatureFlag('button-color', 'blue');
const limit = useFeatureFlag('rate-limit', 100);
const config = useFeatureFlag('ui-config', { sidebar: true });
```

### `useFeatureflipStatus(): { isReady, isError, error }`

Returns the initialization status of the client. Useful for showing loading states.

```tsx
function App() {
  const { isReady, isError, error } = useFeatureflipStatus();

  if (isError) return <div>Error: {error?.message}</div>;
  if (!isReady) return <div>Loading...</div>;

  return <Main />;
}
```

### `useFeatureflipClient(): FeatureflipClient`

Returns the underlying `FeatureflipClient` instance for direct access (e.g., calling `identify`).

## Identify on Login

When the context prop changes, the provider automatically calls `identify()` and re-evaluates all flags. You can also call `identify` directly.

```tsx
function LoginPage() {
  const client = useFeatureflipClient();

  async function handleLogin(userId: string) {
    // ... authenticate ...
    await client.identify({ user_id: userId, plan: 'pro' });
  }

  return <button onClick={() => handleLogin('123')}>Log in</button>;
}
```

## Testing

Use `TestFeatureflipProvider` to supply predetermined flag values in tests -- no network calls, no initialization delay.

```tsx
import { TestFeatureflipProvider } from '@featureflip/react-sdk';
import { render, screen } from '@testing-library/react';

test('renders banner when flag is on', () => {
  render(
    <TestFeatureflipProvider flags={{ 'show-banner': true }}>
      <Banner />
    </TestFeatureflipProvider>,
  );

  expect(screen.getByText('New feature available!')).toBeInTheDocument();
});
```

`TestFeatureflipProvider` uses `FeatureflipClient.forTesting()` internally and sets `isReady: true` immediately.
