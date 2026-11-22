import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O build cai em ../public, que e a pasta que o Express serve.
// O proxy so vale para o "npm run dev" (tela com atualizacao ao vivo
// na porta 5173 falando com a API na 3000).
const API = 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/treinos': API,
      '/login': API,
      '/logout': API,
      '/perfil': API,
      '/cadastro': API,
    },
  },
});
