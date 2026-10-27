import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// #3562: package.json declares `"sideEffects": false`, which tells bundlers they
// may drop any of these files whose exports go unused — and the flag-cleanup
// Action relies on the same promise to delete a stranded bare import. The claim
// is only true while loading a file does nothing observable, so each shipped
// entry point is loaded in its own Node process and must leave exactly the
// trace an empty module leaves. Every other test imports TypeScript source, so
// this goes through the built dist/ files instead. They import @featureflip/browser
// from its own dist/, which CI builds first.

const pkgDir = resolve(__dirname, '..');
const pkg = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8')) as {
  sideEffects?: unknown;
  exports: unknown;
};
const probeScript = resolve(__dirname, 'fixtures/import-probe.mjs');
const probe = (target: string): unknown =>
  JSON.parse(execFileSync(process.execPath, [probeScript, target], { encoding: 'utf8' }));

// Every file the exports map can hand a consumer, under any condition.
const exportedFiles = (node: unknown): string[] =>
  typeof node === 'string'
    ? node.endsWith('.d.ts') ? [] : [node]
    : Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
        key === 'types' ? [] : exportedFiles(value)
      );
const entryFiles = [...new Set(exportedFiles(pkg.exports))];

let baseline: unknown;
beforeAll(() => {
  // dist/ itself is built by tests/global-setup.ts when absent.
  baseline = probe('data:text/javascript,export {};');
});

describe('import-time side effects', () => {
  it('declares sideEffects: false', () => {
    expect(pkg.sideEffects).toBe(false);
  });

  it('covers both module formats of the main and testing entries', () => {
    expect([...entryFiles].sort()).toEqual([
      './dist/index.cjs',
      './dist/index.js',
      './dist/testing.cjs',
      './dist/testing.js',
    ]);
  });

  it('notices a module that does work at load time', () => {
    const leaky = probe(
      'data:text/javascript,globalThis.leak = 1; Array.prototype.leak = 1; ' +
        'setInterval(() => {}, 1000); window.addEventListener("load", () => {});'
    );

    expect(leaky).toMatchObject({
      globals: expect.arrayContaining(['leak']),
      patched: ['Array.prototype.leak'],
      timers: ['setInterval'],
      listeners: ['window.addEventListener(load)'],
    });
  });

  it.each(entryFiles)('loading %s has no side effects', (file) => {
    expect(probe(resolve(pkgDir, file))).toEqual(baseline);
  });
});
