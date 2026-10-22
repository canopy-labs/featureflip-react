# Changelog

## 2.15.0 — 2026-10-22

### Changed

- Republished in lockstep with `@featureflip/js` 2.15.0. This package has no source changes of its own. Recorded here because the npm release tag publishes all five JavaScript packages at a single version. (#1372)

## 2.14.1 — 2026-10-21

### Changed

- Republished in lockstep with `@featureflip/js` 2.14.1. This package has no source changes of its own. Recorded here because the npm release tag publishes all five JavaScript packages at a single version. (#1372)

## 2.14.0 — 2026-10-20

### Added

- Requests now identify this SDK as well as the browser SDK it runs on: `X-Featureflip-SDK: featureflip-browser/<version> featureflip-react/<version>`. Before this, React usage read as plain browser-SDK usage. Requires `@featureflip/browser` 2.13.0 or later, which this release now depends on. (#4147)

## 2.13.0 — 2026-10-20

### Changed

- Republished in lockstep with `@featureflip/browser` 2.13.0. This package has no source changes of its own. Because it runs on `@featureflip/browser`, its requests now carry `X-Featureflip-SDK: featureflip-browser/<version>`; identifying as `featureflip-react` itself is tracked in #4147. Recorded here because the npm release tag publishes all four JavaScript packages at a single version. (#4146)

## 2.12.0 — 2026-10-20

### Added

- `FeatureflipProvider` takes a new `bootstrap` prop, passed through to `@featureflip/browser` 2.12.0. With an object of values, children render with those values and `isReady: true` on the first render, server-rendered or not, and switch to the server's values when they arrive. With `'localStorage'`, the values saved by the previous page load are used. (#4095)
- During server rendering the provider now uses `FeatureflipClient.forServerRender`. Before this, a server render created a cached client that was never closed, because effects do not run on the server, so the next request for the same client key reused it and re-identified it with that request's context. A server render now makes no requests and leaves nothing behind.
- The `@featureflip/browser` peer dependency is now `^2.12.0` (was `^2.11.0`).

## 2.11.1 — 2026-10-09

### Changed

- `package.json` now declares `"sideEffects": false`. Loading the package does nothing on its own: no globals, no timers, no listeners, no patched built-ins. Bundlers (webpack, Rollup, esbuild, Vite) can now drop an unused import of it and tree-shake its unused exports, where before they had to keep the whole module in case loading it mattered. A test now loads the main and `/testing` entry points, each as ESM and CommonJS, in a clean Node process on every change and fails if that stops being true. No runtime behaviour changes. (#3562)

## 2.11.0 — 2026-10-07

### Added

- Through `@featureflip/browser` 2.11.0, the SDK now reports which flags your application reads, deduplicated to at most about one event an hour per flag, variation and user (and again when the page becomes visible after being hidden), sent in small batches (within 30 seconds, or when the page is hidden or closed), and tells Featureflip it does so. A client-side flag that your code no longer reads therefore stops counting as in use, and it can be archived once no client reads it, provided the clients receiving it run a version that reports reads (browser or React 2.11.0 or later). Clients on 2.10.0 or older, and SDKs that don't report reads, still count every flag they are sent. Two effects to expect:
  - Evaluation analytics for client-side flags now count reads rather than page loads.
  - Flags that are sent but never read may newly show as stale.

  The new `sendEvaluationEvents: false` option turns reporting off, and Featureflip then treats every flag it sends to that client as in use, as before. (#3545)
- The `@featureflip/browser` peer dependency is now `^2.11.0` (was `^2.2.0`), so this release requires `@featureflip/browser` 2.11.0 or later.
- `FeatureflipProvider` takes a new `sendEvaluationEvents` prop that passes the option through to the browser client; set it to `false` to turn read reporting off.

## 2.10.0 — 2026-09-18

### Changed

- Republished in lockstep with `@featureflip/js` 2.10.0. This package had no source changes of its own, and like `@featureflip/browser` underneath it, it is **not** affected by that release's SSE fallback fix — the browser SDK has no polling fallback and its stream already reconnected forever. Recorded here because the npm release tag publishes all four JavaScript packages at a single version, so this version exists on npm with no change of its own to describe. (#3071)

## 2.9.0 — 2026-09-01

### Changed

- Republished in lockstep with `@featureflip/js` 2.9.0. This package had no source changes of its own, and like `@featureflip/browser` underneath it, it is **not** affected by that release's operator-spelling fix: client SDKs do not run a local evaluator, so the evaluation engine resolves the operator and this SDK forwards its answer verbatim. Recorded here because the npm release tag publishes all four JavaScript packages at a single version, so this version exists on npm with no change of its own to describe. (#2374)

## 2.8.0 — 2026-08-26

### Changed

- Republished in lockstep with `@featureflip/js` 2.8.0. This package had no source changes of its own; it receives that release's date-operand grammar change and SSE reconnect fixes through its `@featureflip/browser` dependency. See the `@featureflip/js` changelog for what changed — the grammar change affects any `Before`/`After` targeting rule and is worth reading before upgrading.

## 2.7.1 — 2026-08-24

### Changed

- Republished in lockstep with `@featureflip/js` 2.7.1. This package had no source changes of its own; it receives that release's date-operand fixes through its `@featureflip/browser` dependency. Recorded here because the npm release tag publishes all four JavaScript packages at a single version, so this version exists on npm with no entry in this file. (#2468)

## 2.6.1 — 2026-08-23

### Changed

- Version aligned with the npm release line. No functional change in this package.

## 2.6.0 — 2026-08-20

No change to this package's own code. The four JS SDKs share one release line — an `npm-v*` tag publishes all of them at the tag's version. What reaches you here comes through `@featureflip/browser`, the client this package wraps: a closed handle now serves the caller's default and reports not-initialized (#2327), and a failed initial flag fetch is diagnosable rather than swallowed by a bare `catch` (#2322).

## 2.5.4 — 2026-08-18

No functional change. The four JS SDKs share one release line — an `npm-v*` tag publishes all of them at the tag's version — and 2.5.4 is a `@featureflip/js` fix (#2245) to its CommonJS entrypoint, which the browser build this package wraps does not use.

## 2.5.3 — 2026-08-05

### Fixed

- `LICENSE` is now the verbatim Apache-2.0 text. Three phrases in the operative sections had been reworded and the appendix dropped, which left automated license scanners unable to identify it. The license itself is unchanged; the file now says what it always claimed to.
- The README now states the license. `package.json` declared Apache-2.0 and the `LICENSE` file shipped inside the package, but the README itself said nothing.

### Changed

- The README's opening line links to featureflip.io.

## 2.5.2 — 2026-08-02

No functional change. The four JS SDKs share one release line — an `npm-v*` tag publishes all of them at the tag's version — and 2.5.2 is a `@featureflip/js` fix (#2141) to the Node platform's `User-Agent`, which this package does not consume via `@featureflip/browser`.

## 2.5.1 — 2026-07-30

No functional change. The four JS SDKs share one release line — an `npm-v*` tag publishes all of them at the tag's version — and 2.5.1 is a `@featureflip/js` fix (#2087) that this package does not consume via `@featureflip/browser`.

## 2.5.0 — 2026-07-29

### Added

- **`onEvaluation` inspector callback**, inherited from `@featureflip/browser` via the `inspectors` config option. Note that cores are refcounted per client key, so inspectors are honored only on the first client created for a key (#1914).

## 2.4.0 — 2026-07-13

### Fixed

- Inherits the `@featureflip/browser` 2.4.0 outage-recovery hardening: non-terminal initialization and reconnect-snapshot store replacement (#1864, #1881, #1896).

### Changed

- Enforced `tsc --noEmit` typecheck gate added to CI (#1465).

## 2.3.0 — 2026-06-19

### Added

- Persisted anonymous `user_id` for sticky rollouts, inherited from `@featureflip/browser` (#1467).

## 2.2.0 — 2026-06-16

### Changed

- Version alignment with the JS-family SDKs for the semver targeting operators (#1409).

## 2.1.0 — 2026-05-27

### Fixed

- Identify is re-sent on context change, and `userId` casing is accepted (#1222).

### Changed

- Monorepo converted to npm workspaces (#1207).

## 2.0.0 — 2026-04-08

### BREAKING

- **Requires `@featureflip/browser` ^2.0.** The public React API (`FeatureflipProvider`, `useFeatureFlag`, `useFeatureflipStatus`, `TestFeatureflipProvider`) is unchanged, but the peer dependency on `@featureflip/browser` is bumped to major 2.0 — which removed the public `FeatureflipClient` constructor. If you import `FeatureflipClient` directly from `@featureflip/browser` in your own code (not typical), you must migrate to `FeatureflipClient.get(...)` per the Browser SDK v2.0 CHANGELOG.

### Changed

- `FeatureflipProvider` now obtains its underlying client via `FeatureflipClient.get(config)` (the singleton factory) instead of `new FeatureflipClient(config)`. This changes behavior in a good way: **StrictMode's simulated unmount/remount no longer tears down the SSE connection.** The provider's effect cleanup still calls `close()`, but the refcounted factory keeps the shared core alive as long as any other handle references it — and the remount's `get()` immediately re-acquires a handle. Result: exactly one SSE connection per client key across a StrictMode cycle, instead of the close-and-recreate dance that previous versions relied on.
- Multiple `<FeatureflipProvider>` instances in the same React tree (or independent micro-frontends on the same page) with the same `clientKey` now share one underlying client. Previously each provider would open its own SSE connection.
- `FeatureflipProvider` now drives `isReady` from the `initialize()` promise in addition to the `'ready'` event, so a handle acquired on an already-initialized core (e.g. a second provider mount) still reports ready without waiting for another event.

### Added

- Nothing new in the public API — all changes are internal plumbing.

## 1.0.0

Initial release.
