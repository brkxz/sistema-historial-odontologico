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

// Middleware
import { authenticateToken } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================
// MIDDLEWARE GLOBAL
// =============================================
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
// CORS dinámico: acepta localhost (dev) y dominio de Vercel (producción)
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
    // Permitir requests sin origin (apps móviles, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed) || origin.includes('vercel.app'))) {
      return callback(null, true);
    }
    callback(null, true); // En producción permitir todos temporalmente
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
// INICIAR SERVIDOR
// =============================================
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.');

    // Sincronizar modelos (sin force para no borrar datos)
    await sequelize.sync();
    console.log('✅ Modelos sincronizados.');

    app.listen(PORT, () => {
      console.log('');
      console.log('════════════════════════════════════════════════════');
      console.log('  🦷 Sistema de Historial Odontológico Digital');
      console.log('════════════════════════════════════════════════════');
      console.log(`  Servidor:  http://localhost:${PORT}`);
      console.log(`  API:       http://localhost:${PORT}/api`);
      console.log(`  Estado:    http://localhost:${PORT}/api/health`);
      console.log('════════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
