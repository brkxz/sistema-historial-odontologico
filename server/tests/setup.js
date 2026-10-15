// tests/setup.js — Configuración global para los tests
import { vi } from 'vitest';

// Variables de entorno para tests
process.env.NODE_ENV   = 'test';
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long!!';
process.env.JWT_ISSUER = 'historial-odontologico';
process.env.JWT_AUD    = 'odonto-app';
process.env.DATABASE_URL = ''; // SQLite en memoria para tests

// Silenciar el logger de Winston durante los tests
vi.mock('../utils/logger.js', () => ({
  default: {
    info:  vi.fn(),
    warn:  vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
