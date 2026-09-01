import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// =============================================
// JWT SEGURO - Sin fallback débil
// =============================================
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌ SEGURIDAD: JWT_SECRET no configurado o es demasiado corto (mínimo 32 caracteres).');
  console.error('   Configure JWT_SECRET en el archivo .env');
  // En producción esto debería hacer process.exit(1), pero permitimos continuar para dev
}

const JWT_ISSUER = 'historial-odontologico';
const JWT_AUDIENCE = 'odonto-app';
const JWT_EXPIRATION = '8h'; // 8 horas (antes era 24h)

// Middleware para verificar el token JWT
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    // Verificar token con todas las validaciones
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'], // Solo permitir HS256
    });

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Usuario no válido o inactivo' });
    }

    // Verificar si la cuenta está bloqueada
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ error: 'Cuenta temporalmente bloqueada por seguridad' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Inicie sesión nuevamente.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token no válido o manipulado' });
    }
    return res.status(403).json({ error: 'Token no válido' });
  }
};

// Generar token JWT seguro
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRATION,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: 'HS256',
    }
  );
};

export { JWT_SECRET };
