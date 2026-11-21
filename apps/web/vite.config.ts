import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defaultClientConditions, defineConfig, type Plugin } from 'vite';
import { parseMockDomains } from './src/mocks/domains';

/** Fail fast on a bad VITE_MOCK_DOMAINS (dev, build and tests). */
function checkMockDomains(): Plugin {
  return {
    name: 'fixit:check-mock-domains',
    configResolved(config) {
      const raw: unknown = config.env.VITE_MOCK_DOMAINS;
      parseMockDomains(typeof raw === 'string' ? raw : undefined);
    },
  };
}

/** D23: no MSW in a production build — the worker file copied from public/ is removed. */
function stripMswWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'fixit:strip-msw-worker',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      rmSync(resolve(outDir, 'mockServiceWorker.js'), { force: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), checkMockDomains(), stripMswWorker()],
  resolve: {
    // D19: consume @fixit/contracts and @fixit/fixtures TypeScript sources directly, no build step
    conditions: ['source', ...defaultClientConditions],
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: false } },
  },
});
