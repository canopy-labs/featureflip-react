import { describe, expect, it } from 'vitest';
import { execFileSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, relative, resolve } from 'path';

// #4351: the published dist/*.d.ts imported '../../browser-sdk/src', a monorepo
// path that does not exist in the package, because the test-only vite alias for
// @featureflip/browser leaked into the declaration build. Under skipLibCheck a
// customer saw every type borrowed from @featureflip/browser turn into `any`,
// with no error at all. These tests read the built declarations (the global
// setup builds dist/ when it is absent), since nothing else in the package does.

const pkgDir = resolve(__dirname, '..');
const distDir = resolve(pkgDir, 'dist');

const declarationFiles = readdirSync(distDir, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.d.ts'))
  .map((file) => resolve(distDir, file));

describe('published declarations', () => {
  it('only import relative paths that stay inside dist/', () => {
    const escaping = declarationFiles.flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/\bfrom\s+['"](\.{1,2}\/[^'"]*)['"]/g)]
        .map((match) => match[1])
        .filter((specifier) => relative(distDir, resolve(dirname(file), specifier)).startsWith('..'))
        .map((specifier) => `${relative(distDir, file)}: ${specifier}`)
    );
    expect(declarationFiles.length).toBeGreaterThan(0);
    expect(escaping).toEqual([]);
  });

  it("type a consumer's use of the hooks and providers with @featureflip/browser's types", () => {
    const tsconfig = resolve(__dirname, 'fixtures/types-consumer/tsconfig.json');
    expect(existsSync(tsconfig)).toBe(true);
    let output = '';
    try {
      execFileSync('npx', ['--no-install', 'tsc', '-p', tsconfig], {
        cwd: pkgDir,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      const failure = error as { stdout?: string; stderr?: string };
      output = `${failure.stdout ?? ''}${failure.stderr ?? ''}`.trim() || String(error);
    }
    expect(output).toBe('');
  }, 60_000);
});
