import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';

export type WebAppTarget = 'player' | 'owner' | 'admin';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const reactTransformExclude = [
  /[\\/]node_modules[\\/]/,
  /[\\/]picklink-vite-cache[\\/][^\\/]+[\\/]deps[\\/]/,
];
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
  const apiProxy: ProxyOptions = {
    target: proxyTarget,
    changeOrigin: true,
    configure: (server) => {
      server.on('proxyRes', (proxyResponse, request, response) => {
        if (!request.url?.startsWith('/api/realtime/')) return;

        // Vite's development proxy can leave an upstream SSE response alive after the
        // browser navigates away or closes. Those orphaned streams eventually occupy the
        // proxy connection pool and make ordinary API calls wait until the 30-second client
        // timeout. Explicitly close only the abandoned realtime upstream; a normal stream
        // remains connected for as long as its browser response is open.
        const clientSocket = response.socket;
        const closeUpstream = () => proxyResponse.destroy();
        const releaseListeners = () => {
          request.off('aborted', closeUpstream);
          response.off('close', closeUpstream);
          clientSocket?.off('close', closeUpstream);
        };

        request.once('aborted', closeUpstream);
        response.once('close', closeUpstream);
        clientSocket?.once('close', closeUpstream);
        proxyResponse.once('close', releaseListeners);
        proxyResponse.once('end', releaseListeners);
      });
    },
  };
  const proxy = {
    '/api': apiProxy,
    '/uploads': {
      target: proxyTarget,
      changeOrigin: true,
    },
  };

  return {
    root: path.join(projectRoot, 'apps', target),
    envDir: projectRoot,
    cacheDir: path.join(os.tmpdir(), 'picklink-vite-cache', target),
    plugins: [react({ exclude: reactTransformExclude }), tailwindcss()],
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
