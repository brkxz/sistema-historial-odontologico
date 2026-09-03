import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import { sequelize } from './models/index.js';

// Rutas
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import treatmentRoutes from './routes/treatments.js';
import odontogramRoutes from './routes/odontogram.js';
import userRoutes from './routes/users.js';
import reportRoutes from './routes/reports.js';
import reniecRoutes from './routes/reniec.js';
import aiRoutes from './routes/ai.js';

// Middleware
import { authenticateToken } from './middleware/auth.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { sanitizeInputs } from './middleware/sanitize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================
// MIDDLEWARE DE SEGURIDAD
// =============================================

// Helmet: Headers de seguridad HTTP
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,       // 1 año
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
}));

// CORS: Restringido a orígenes conocidos
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (apps móviles, Capacitor, curl)
    if (!origin) return callback(null, true);
    // Permitir orígenes de Vercel (preview y producción)
    if (origin.includes('vercel.app')) return callback(null, true);
    // Verificar contra lista de orígenes permitidos
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    // Rechazar orígenes no autorizados
    console.warn(`⚠️ CORS: Origen no autorizado bloqueado: ${origin}`);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // Cache preflight 24h
}));

// Parseo de body con límites
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate limiting global para toda la API
app.use('/api', apiLimiter);

// Sanitización global de inputs
app.use(sanitizeInputs);

// Ocultar tecnología del servidor
app.disable('x-powered-by');

// =============================================
// RUTAS DE LA API
// =============================================
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/odontogram', odontogramRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reniec', reniecRoutes);
app.use('/api/ai', aiRoutes);

// Ruta protegida para obtener dientes
app.get('/api/teeth', authenticateToken, async (req, res) => {
  try {
    const { Tooth } = await import('./models/index.js');
    const teeth = await Tooth.findAll({ order: [['tooth_number', 'ASC']] });
    res.json({ teeth });
  } catch (error) {
    console.error('Error al obtener dientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta de estado
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sistema de Historial Odontológico Digital' });
});

// =============================================
// MANEJO DE ERRORES GLOBAL
// =============================================
app.use((err, req, res, next) => {
  // Error de CORS
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({ error: 'Origen no autorizado' });
  }
  // Error de JSON malformado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON malformado' });
  }
  // Error de payload demasiado grande
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Solicitud demasiado grande' });
  }
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// =============================================
// INICIAR SERVIDOR
// =============================================
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.');

    // Sincronizar modelos (alter: true para agregar columnas nuevas sin borrar datos)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados.');

    app.listen(PORT, () => {
      console.log('');
      console.log('════════════════════════════════════════════════════');
      console.log('  🦷 Sistema de Historial Odontológico Digital');
      console.log('════════════════════════════════════════════════════');
      console.log(`  Servidor:  http://localhost:${PORT}`);
      console.log(`  API:       http://localhost:${PORT}/api`);
      console.log(`  Estado:    http://localhost:${PORT}/api/health`);
      console.log('  Seguridad: 🔒 Rate Limit + Helmet + CORS + Sanitize');
      console.log('════════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
