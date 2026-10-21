import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// The alias below compiles browser-sdk's SOURCE in tests, and that source reads
// the __SDK_VERSION__ browser-sdk's own vite config defines from its
// package.json (#4146). Mirror it here, from the same file, or every test that
// imports the client fails at load. No effect on this package's build:
// @featureflip/browser is external there.
const browserPkg = JSON.parse(
  readFileSync(resolve(__dirname, '../browser-sdk/package.json'), 'utf-8'),
) as { version: string };

export default defineConfig({
  define: {
    __SDK_VERSION__: JSON.stringify(browserPkg.version),
  },
  plugins: [
    dts({
      outDir: 'dist',
      exclude: ['src/**/__tests__/**'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        testing: resolve(__dirname, 'src/testing.tsx'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs';
        return `${entryName}.${ext}`;
      },
    },
    rolldownOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@featureflip/browser'],
    },
  },
  resolve: {
    alias: {
      '@featureflip/browser': resolve(__dirname, '../browser-sdk/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
