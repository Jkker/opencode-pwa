/// <reference types="vitest/config" />
import arkenvVitePlugin from '@arkenv/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import arkenv, { type } from 'arkenv'
import BabelPluginReactCompiler from 'babel-plugin-react-compiler'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
export const Env = type({
  PORT: 'number.port = 5173',
  'VITE_API_URL?': 'string.url',
  'VITE_APP_NAME?': 'string',
  VITE_ENABLE_DEBUGGING: 'boolean = false',
  VITE_API_TIMEOUT: '1000 <= number.integer <= 60000 = 5000',
  'VITE_OPENCODE_SERVER_URL?': 'string.url',
})

const CI = !!process.env.CI

export default defineConfig(({ mode }) => {
  const env = arkenv(Env, { env: loadEnv(mode, process.cwd(), '') })

  return {
    plugins: [
      devtools(),
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      tailwindcss(),
      react({ babel: { plugins: [BabelPluginReactCompiler] } }),
      arkenvVitePlugin(Env),
      VitePWA({
        manifest: {
          name: 'OpenCode',
          short_name: 'OpenCode',
          description: 'AI-powered coding assistant for your development workflow',
          start_url: '/',
          display: 'standalone',
          background_color: '#0a0a0a',
          theme_color: '#0a0a0a',
          orientation: 'any',
          scope: '/',
          icons: [
            {
              src: './favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
          categories: ['developer', 'productivity', 'utilities'],
          shortcuts: [
            {
              name: 'New Session',
              short_name: 'New',
              description: 'Start a new coding session',
              url: '/',
              icons: [{ src: '/icons/icon-192.svg', sizes: 'any' }],
            },
          ],
        },
      }),
    ],
    resolve: { tsconfigPaths: true },
    server: {
      port: env.PORT,
    },
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            include: ['**/*.test.ts'],
            environment: 'node',
          },
        },
        {
          extends: true,
          test: {
            name: 'browser',
            include: ['./**/*.test.tsx', './**/*.test.browser.{ts,tsx}'],
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [{ browser: 'chromium' }],
            },
          },
        },
      ],
      reporters: CI ? ['default', 'junit'] : [],
      outputFile: { junit: 'dist/junit-test-report.xml' },
      coverage: {
        provider: 'v8',
        reportsDirectory: './dist/coverage',
        reporter: CI
          ? ['text', 'cobertura', 'lcov', 'json-summary']
          : ['html', 'text', 'json-summary'],
      },
    },
    optimizeDeps: {
      include: ['react', 'react/jsx-runtime', 'react/compiler-runtime'],
    },
  }
})
