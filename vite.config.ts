import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist',
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
