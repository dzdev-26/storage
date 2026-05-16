import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import cascadeLayers from '@csstools/postcss-cascade-layers';
import tailwindPostcss from '@tailwindcss/postcss';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    css: {
      postcss: {
        plugins: [
          tailwindPostcss(),
          cascadeLayers()
        ]
      }
    },
    build: {
      target: 'chrome87',
      cssTarget: 'chrome87',
    },
    plugins: [react(), viteSingleFile()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
