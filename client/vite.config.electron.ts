import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      'librechat-data-provider': path.resolve(__dirname, '../packages/data-provider/dist')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Add any Electron-specific build options here
    rollupOptions: {
      external: ['electron']
    }
  },
  optimizeDeps: {
    include: ['librechat-data-provider']
  }
});
