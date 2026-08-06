import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

export type WebAppTarget = 'player' | 'owner' | 'admin';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const appSettings: Record<WebAppTarget, { devPort: number; previewPort: number }> = {
  player: { devPort: 3000, previewPort: 4173 },
  owner: { devPort: 3001, previewPort: 4174 },
  admin: { devPort: 3002, previewPort: 4175 },
};

export const createAppViteConfig = (target: WebAppTarget) => defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '');
  const settings = appSettings[target];
  const proxyTarget = env.BACKEND_PROXY_TARGET
    || env.VITE_BACKEND_PROXY_TARGET
    || 'http://localhost:5209';
  const proxy = {
    '/api': {
      target: proxyTarget,
      changeOrigin: true,
    },
    '/uploads': {
      target: proxyTarget,
      changeOrigin: true,
    },
  };

  return {
    root: path.join(projectRoot, 'apps', target),
    envDir: projectRoot,
    cacheDir: path.join(os.tmpdir(), 'picklink-vite-cache', target),
    plugins: [react(), tailwindcss()],
    resolve: {
      preserveSymlinks: true,
      alias: {
        '@': path.join(projectRoot, 'src'),
      },
    },
    server: {
      port: settings.devPort,
      strictPort: true,
      fs: {
        allow: [projectRoot],
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy,
    },
    preview: {
      port: settings.previewPort,
      strictPort: true,
      proxy,
    },
    build: {
      outDir: path.join(projectRoot, 'dist', target),
      emptyOutDir: true,
    },
  };
});
