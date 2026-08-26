import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    // Los tests de UI renderizan App completa (mundo SVG + 127 hexes + fichas)
    // en jsdom: renderizan lento y rozan el límite por defecto de 5s.
    testTimeout: 15000,
  },
})
