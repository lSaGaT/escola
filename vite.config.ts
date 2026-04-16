import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      viteStaticCopy({
        targets: [
          { src: 'matricula.html', dest: '.' },
          { src: 'professor-cadastro.html', dest: '.' },
          { src: 'reset-password.html', dest: '.' },
        ],
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          matricula: path.resolve(__dirname, 'src/main-matricula.tsx'),
          'professor-cadastro': path.resolve(__dirname, 'src/main-professor-cadastro.tsx'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            // Nomes específicos para os entry points
            if (chunkInfo.name === 'matricula') return 'assets/matricula.js';
            if (chunkInfo.name === 'professor-cadastro') return 'assets/professor-cadastro.js';
            return 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
