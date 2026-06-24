/**
 * Vitest Configuration for VERIDD Frontend
 *
 * Uses the same Vite config as the build system.
 * Runs tests with jsdom environment for component testing.
 *
 * @see https://vitest.dev/config/
 */
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Use jsdom for DOM APIs (needed for React components)
      environment: 'node',
      // Where to find test files
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      // Global test utilities without imports
      globals: true,
      // Coverage configuration
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.d.ts',
          'src/**/*.{test,spec}.{ts,tsx}',
          'src/vite-env.d.ts',
        ],
        thresholds: {
          statements: 70,
          branches: 60,
          functions: 70,
          lines: 70,
        },
      },
      // Timeout for async tests (10s)
      testTimeout: 10000,
    },
  }),
);
