import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

// tests/side-effects.test.ts and tests/declarations.test.ts read the built
// dist/ rather than the TypeScript source. It is absent when the tests run
// before a build, as they usually do in CI, so build it once here: two test
// files building it in parallel would race on the same output directory.
export default function setup(): void {
  const pkgDir = resolve(__dirname, '..');
  if (existsSync(resolve(pkgDir, 'dist/index.js'))) return;
  // vitest sets NODE_ENV=test, and a development build is not what ships (in
  // react-sdk it inlines jsx-dev-runtime). Build the way publishing does.
  execFileSync('npm', ['run', 'build'], {
    cwd: pkgDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });
}
