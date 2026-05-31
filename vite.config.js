import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Dividir el bundle para mejor cacheo: cada chunk tiene su propio hash
    // y solo se descarga de nuevo cuando cambia ese grupo de librerías.
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          datefns:  ['date-fns'],
          ajv:      ['ajv', 'ajv-formats'],
          docx:     ['docx', 'file-saver'],
        },
      },
    },
    // Subir el umbral de advertencia: el chunk de la app es grande por diseño
    // (tablones de Word, prompts, lógica de IA). Trabajamos para reducirlo con lazy loading.
    chunkSizeWarningLimit: 1000,
  },
})
