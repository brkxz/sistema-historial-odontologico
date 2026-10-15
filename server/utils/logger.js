// =============================================
// LOGGER — Winston con rotación diaria de logs
// =============================================
import { createLogger, format, transports } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors } = format;

// Formato para consola (con colores)
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return `[${ts}] ${level}: ${stack || message}`;
  })
);

// Formato para archivos (JSON estructurado)
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  format.json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'info'),
  transports: [
    // Consola — solo en desarrollo
    ...(process.env.NODE_ENV !== 'production'
      ? [new transports.Console({ format: consoleFormat })]
      : []),

    // Archivo de errores — siempre
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB por archivo
      maxFiles: 10,             // Mantener hasta 10 archivos
    }),

    // Archivo combinado — siempre
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 7,               // 1 semana
    }),

    // Archivo de seguridad — solo eventos críticos de auth
    new transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 30, // 30 archivos = ~1 mes de logs de seguridad
    }),
  ],
  // No fallar si el logger falla
  exitOnError: false,
});

export default logger;
