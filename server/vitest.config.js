// vitest.config.js — Configuración de Vitest para el servidor
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Solo medir cobertura de middleware y utils (los tests unitarios actuales)
      // Las rutas requieren tests de integración (Fase 2)
      include: ['middleware/auth.js', 'middleware/roles.js', 'middleware/sanitize.js', 'utils/schemas.js'],
      exclude: ['node_modules/**'],
      thresholds: {
        lines:     55,
        functions: 55,
        branches:  40,
        statements:55,
      },
    },
    setupFiles: ['./tests/setup.js'],
    testTimeout: 15000,
  },
});
