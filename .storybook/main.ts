import { defineMain } from '@storybook/react-vite/node'

export default defineMain({
  stories: ['../stories/**/*.mdx', '../**/*.stories.{ts,tsx}'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-designs',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true, // 👈 Disables telemetry
  },
})
