import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/index.js';
import { isTokenRevoked } from '../models/RevokedToken.js';
import logger from '../utils/logger.js';

// =============================================
// JWT SEGURO — Sin fallback débil
// =============================================
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  logger.error('SEGURIDAD: JWT_SECRET no configurado o es demasiado corto (mínimo 32 caracteres). Configure JWT_SECRET en el archivo .env');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

const JWT_ISSUER    = 'historial-odontologico';
const JWT_AUDIENCE  = 'odonto-app';
const JWT_EXPIRATION = '8h'; // 8 horas

// =============================================
// Middleware: verificar token JWT
// =============================================
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    // Verificar token con todas las validaciones
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer:     JWT_ISSUER,
      audience:   JWT_AUDIENCE,
      algorithms: ['HS256'],
    });

    // ─── NUEVA: Verificar que el token no esté revocado (logout real) ───
    if (decoded.jti && await isTokenRevoked(decoded.jti)) {
      return res.status(401).json({ error: 'Sesión cerrada. Inicie sesión nuevamente.' });
    }

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

    // Adjuntar token decodificado para poder revocarlo en logout
    req.user      = user;
    req.tokenData = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Inicie sesión nuevamente.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token no válido o manipulado' });
    }
    logger.error('Error al verificar token', { error: error.message });
    return res.status(403).json({ error: 'Token no válido' });
  }
};

// =============================================
// Generar token JWT seguro (con JTI único)
// =============================================
export const generateToken = (user) => {
  return jwt.sign(
    {
      id:       user.id,
      username: user.username,
      role:     user.role,
      jti:      uuidv4(), // ← ID único por token, permite revocación individual
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRATION,
      issuer:    JWT_ISSUER,
      audience:  JWT_AUDIENCE,
      algorithm: 'HS256',
    }
  );
};

export { JWT_SECRET };
