import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      environmentOptions: { jsdom: { url: 'http://localhost:5173' } },
      include: ['src/**/*.test.{ts,tsx}'],
      // Node ≥ 25 ships a global localStorage stub that shadows jsdom's; turn it off so jsdom's is used.
      poolOptions: { forks: { execArgv: ['--no-experimental-webstorage'] } },
    },
  }),
);
