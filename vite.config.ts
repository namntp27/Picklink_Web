import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import os from 'os';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig, loadEnv} from 'vite';

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, configDir, '');

  return {
    cacheDir: path.join(os.tmpdir(), 'picklink-vite-cache'),
    plugins: [react(), tailwindcss()],
    resolve: {
      preserveSymlinks: true,
      alias: {
        '@': path.resolve(configDir, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:5209',
          changeOrigin: true,
        },
        '/uploads': {
          target: env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:5209',
          changeOrigin: true,
        },
      },
    },
  };
});
