import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 8081,
    open: false,
    host: true
  },
  preview: {
    port: 8081,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});

