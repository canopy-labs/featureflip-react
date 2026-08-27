# Changelog

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
