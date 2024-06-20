import path, { resolve } from "path";
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react'
import {nodePolyfills} from "vite-plugin-node-polyfills";
import dts from 'vite-plugin-dts';
import {globSync} from 'glob';
import { fileURLToPath } from "node:url";

export default defineConfig({
    plugins: [dts(), react(), nodePolyfills()],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            formats: ['es'],
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            input: {
              main: resolve(__dirname, 'src/main.ts'),
            },
            output: {
              entryFileNames: '[name].js',
              assetFileNames: 'assets/[name][extname]',
              globals: {
                react: 'React',
                'react-dom': 'React-dom',
              },
            },
          },
    },
});
