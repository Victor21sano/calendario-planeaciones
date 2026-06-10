import { defineConfig } from 'vitest/config'

// Los tests del sistema de créditos hablan con el emulador de Firestore vía el
// Admin SDK (transacciones reales). Se ejecutan en serie y con timeout amplio
// porque cada caso abre transacciones contra el emulador.
export default defineConfig({
  // Estos tests no tocan CSS. Sin esto, Vite busca hacia arriba un postcss.config.js
  // y carga el de la RAÍZ (que requiere tailwindcss) — ausente en functions/node_modules,
  // lo que rompe el job de functions en CI. Un postcss inline corta esa búsqueda.
  css: { postcss: { plugins: [] } },
  test: {
    // globals: true → describe/it/expect disponibles sin import (los tests son
    // CommonJS y vitest no puede importarse con require()).
    globals: true,
    include: ['test/**/*.test.js'],
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})
