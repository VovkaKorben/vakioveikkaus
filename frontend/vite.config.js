import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Псевдоним '@shared' будет указывать на папку 'shared', 
      // которая находится на один уровень выше текущей папки
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
})
