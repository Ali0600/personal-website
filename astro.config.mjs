import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    server: {
      watch: {
        usePolling: true,
      },
    },
  },
});
