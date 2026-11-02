import { defineConfig } from 'vite';
export default defineConfig({
  server: { host:'127.0.0.1', allowedHosts: ['terminal.local'], proxy:{'/api':{target:'http://127.0.0.1:8000',changeOrigin:true}} },
  build: { rollupOptions: {
    onwarn(warning, warn) {
      // Motion's client directives are intentionally redundant in this browser-only app.
      if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) return;
      warn(warning);
    },
    output: { manualChunks: { charts: ['recharts'] } },
  } },
});
