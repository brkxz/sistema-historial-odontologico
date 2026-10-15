import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { revokeToken } from '../models/RevokedToken.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { loginLimiter, googleAuthLimiter } from '../middleware/rateLimiter.js';
import { sanitizeInputs } from '../middleware/sanitize.js';
import {
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  validate,
} from '../utils/schemas.js';
import logger from '../utils/logger.js';

const router = Router();

// =============================================
// CONSTANTES DE SEGURIDAD
// =============================================
const MAX_FAILED_ATTEMPTS      = 5;
const LOCK_TIME_SHORT          = 15 * 60 * 1000;   // 15 minutos
const MAX_FAILED_ATTEMPTS_LONG = 10;
const LOCK_TIME_LONG           = 60 * 60 * 1000;   // 1 hora

// =============================================
// HELPERS DE SEGURIDAD
// =============================================

function checkAccountLock(user) {
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    return {
      locked: true,
      message: `Cuenta bloqueada por seguridad. Intente en ${minutesLeft} minuto${minutesLeft > 1 ? 's' : ''}.`,
    };
  }
  return { locked: false };
}

async function registerFailedAttempt(user, req) {
  user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;

  if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS_LONG) {
    user.locked_until = new Date(Date.now() + LOCK_TIME_LONG);
    logger.warn('Cuenta bloqueada 1 hora por múltiples intentos fallidos', {
      username: user.username,
      attempts: user.failed_login_attempts,
      ip: req.ip,
    });
  } else if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
    user.locked_until = new Date(Date.now() + LOCK_TIME_SHORT);
    logger.warn('Cuenta bloqueada 15 minutos por intentos fallidos', {
      username: user.username,
      attempts: user.failed_login_attempts,
      ip: req.ip,
    });
  }

  await user.save();

  try {
    await logAudit(user.id, 'LOGIN_FAILED', 'user', user.id, null, {
      attempts: user.failed_login_attempts,
      ip: req.ip,
      locked: !!user.locked_until,
    }, req.ip);
  } catch (e) {
    // No fallar por error de auditoría
  }
}

async function resetFailedAttempts(user) {
  if (user.failed_login_attempts > 0 || user.locked_until) {
    user.failed_login_attempts = 0;
    user.locked_until = null;
    await user.save();
  }
}

// =============================================
// POST /api/auth/login — Login con credenciales
// =============================================
router.post('/login', loginLimiter, sanitizeInputs, validate(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user) {
      // Dummy hash para prevenir timing attacks
      await bcrypt.hash('dummy_password', 10);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const lockStatus = checkAccountLock(user);
    if (lockStatus.locked) {
      return res.status(423).json({ error: lockStatus.message });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Cuenta desactivada. Contacte al administrador.' });
    }

    if (user.auth_provider !== 'local' && !user.password_hash) {
      return res.status(401).json({ error: 'Esta cuenta usa inicio de sesión con Google.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      await registerFailedAttempt(user, req);
      const attemptsLeft = MAX_FAILED_ATTEMPTS - user.failed_login_attempts;
      let errorMsg = 'Credenciales incorrectas';
      if (attemptsLeft > 0 && attemptsLeft <= 2) {
        errorMsg += `. ${attemptsLeft} intento${attemptsLeft > 1 ? 's' : ''} restante${attemptsLeft > 1 ? 's' : ''}.`;
      }
      return res.status(401).json({ error: errorMsg });
    }

    await resetFailedAttempts(user);
    const token = generateToken(user);
    await logAudit(user.id, 'LOGIN', 'user', user.id, null, null, req.ip);

    logger.info('Login exitoso', { username: user.username, role: user.role, ip: req.ip });

    res.json({
      token,
      user: {
        id:        user.id,
        username:  user.username,
        full_name: user.full_name,
        email:     user.email,
        role:      user.role,
        specialty: user.specialty,
      },
    });
  } catch (error) {
    logger.error('Error en login', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// POST /api/auth/logout — Logout real (revoca JWT)
// =============================================
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { jti, exp } = req.tokenData || {};
    if (jti && exp) {
      await revokeToken(jti, new Date(exp * 1000), req.user.id);
    }
    await logAudit(req.user.id, 'LOGOUT', 'user', req.user.id, null, null, req.ip);
    logger.info('Logout exitoso', { username: req.user.username, ip: req.ip });
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    logger.error('Error en logout', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/auth/me — Obtener usuario actual
// =============================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id:        req.user.id,
        username:  req.user.username,
        full_name: req.user.full_name,
        email:     req.user.email,
        role:      req.user.role,
        specialty: req.user.specialty,
      },
    });
  } catch (error) {
    logger.error('Error al obtener usuario', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// POST /api/auth/change-password — Cambiar contraseña
// Ahora valida contraseña segura (8+ chars, mayúscula, número)
// =============================================
router.post('/change-password', authenticateToken, sanitizeInputs, validate(changePasswordSchema), async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (user.auth_provider !== 'local' || !user.password_hash) {
      return res.status(400).json({ error: 'Los usuarios con inicio de sesión social no pueden cambiar contraseña aquí' });
    }

    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    // Verificar que no sea la misma contraseña
    const isSame = await bcrypt.compare(new_password, user.password_hash);
    if (isSame) {
      return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual' });
    }

    user.password_hash = await bcrypt.hash(new_password, 12);
    await user.save();

    await logAudit(user.id, 'CHANGE_PASSWORD', 'user', user.id, null, null, req.ip);
    logger.info('Contraseña cambiada', { username: user.username, ip: req.ip });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    logger.error('Error al cambiar contraseña', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// PUT /api/auth/profile — Actualizar perfil
// =============================================
router.put('/profile', authenticateToken, sanitizeInputs, validate(updateProfileSchema), async (req, res) => {
  try {
    const { full_name, email, specialty } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name.trim();
    if (email     !== undefined) updateData.email     = email || null;
    if (specialty !== undefined) updateData.specialty = specialty || null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
    }

    const oldValues = { full_name: user.full_name, email: user.email, specialty: user.specialty };
    await user.update(updateData);
    await logAudit(user.id, 'UPDATE', 'user', user.id, oldValues, updateData, req.ip);

    res.json({
      user: {
        id:        user.id,
        username:  user.username,
        full_name: user.full_name,
        email:     user.email,
        role:      user.role,
        specialty: user.specialty,
      },
    });
  } catch (error) {
    logger.error('Error al actualizar perfil', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// POST /api/auth/google — Login con Google
// =============================================
router.post('/google', googleAuthLimiter, sanitizeInputs, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) return res.status(400).json({ error: 'Token de Google es requerido' });

    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!googleResponse.ok) return res.status(401).json({ error: 'Token de Google inválido' });

    const googleData = await googleResponse.json();

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId || googleData.aud !== googleClientId) {
      logger.warn('Token de Google con audience incorrecto', { aud: googleData.aud, ip: req.ip });
      return res.status(401).json({ error: 'Token de Google no autorizado para esta aplicación' });
    }

    if (googleData.email_verified !== 'true' && googleData.email_verified !== true) {
      return res.status(401).json({ error: 'El email de Google no está verificado' });
    }

    const { sub: googleId, email, name } = googleData;

    let user = await User.findOne({ where: { provider_id: googleId, auth_provider: 'google' } });

    if (!user && email) {
      user = await User.findOne({ where: { email } });
      if (user) {
        user.auth_provider = 'google';
        user.provider_id   = googleId;
        await user.save();
      }
    }

    let isNewUser = false;
    if (!user) {
      const username = email ? email.split('@')[0] + '_g' : `google_${googleId.substring(0, 8)}`;
      user = await User.create({
        username,
        password_hash: null,
        full_name:     name || 'Usuario Google',
        email:         email || null,
        role:          'odontologo',
        auth_provider: 'google',
        provider_id:   googleId,
        is_active:     false,
      });
      isNewUser = true;
    }

    if (!user.is_active) {
      const msg = isNewUser
        ? 'Tu cuenta ha sido registrada y está pendiente de aprobación por el administrador.'
        : 'Tu cuenta está desactivada. Contacte al administrador.';
      return res.status(403).json({ error: msg, pendingApproval: isNewUser });
    }

    await resetFailedAttempts(user);
    const jwtToken = generateToken(user);
    await logAudit(user.id, 'LOGIN_GOOGLE', 'user', user.id, null, null, req.ip);

    res.json({
      token: jwtToken,
      user: {
        id:        user.id,
        username:  user.username,
        full_name: user.full_name,
        email:     user.email,
        role:      user.role,
        specialty: user.specialty,
      },
    });
  } catch (error) {
    logger.error('Error en login con Google', { error: error.message });
    res.status(500).json({ error: 'Error al autenticar con Google' });
  }
});

export default router;
