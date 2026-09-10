import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { loginLimiter, googleAuthLimiter } from '../middleware/rateLimiter.js';
import { sanitizeInputs } from '../middleware/sanitize.js';

const router = Router();

// =============================================
// CONSTANTES DE SEGURIDAD
// =============================================
const MAX_FAILED_ATTEMPTS = 5;      // Intentos antes del primer bloqueo
const LOCK_TIME_SHORT = 15 * 60 * 1000;   // 15 minutos
const MAX_FAILED_ATTEMPTS_LONG = 10; // Intentos antes del bloqueo largo
const LOCK_TIME_LONG = 60 * 60 * 1000;    // 1 hora

// =============================================
// HELPERS DE SEGURIDAD
// =============================================

/**
 * Verifica si una cuenta está bloqueada.
 * Retorna { locked: boolean, message?: string }
 */
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

/**
 * Registra un intento fallido y bloquea si es necesario.
 */
async function registerFailedAttempt(user, req) {
  user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;

  if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS_LONG) {
    // Bloqueo largo (1 hora)
    user.locked_until = new Date(Date.now() + LOCK_TIME_LONG);
    console.warn(`🔒 Cuenta "${user.username}" bloqueada 1 hora (${user.failed_login_attempts} intentos fallidos) - IP: ${req.ip}`);
  } else if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
    // Bloqueo corto (15 minutos)
    user.locked_until = new Date(Date.now() + LOCK_TIME_SHORT);
    console.warn(`🔒 Cuenta "${user.username}" bloqueada 15 min (${user.failed_login_attempts} intentos fallidos) - IP: ${req.ip}`);
  }

  await user.save();

  // Registrar en auditoría
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

/**
 * Resetea los intentos fallidos después de un login exitoso.
 */
async function resetFailedAttempts(user) {
  if (user.failed_login_attempts > 0 || user.locked_until) {
    user.failed_login_attempts = 0;
    user.locked_until = null;
    await user.save();
  }
}

// =============================================
// POST /api/auth/login - Login con credenciales
// =============================================
router.post('/login', loginLimiter, sanitizeInputs, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar inputs
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Validar longitud (prevenir ataques con payloads gigantes)
    if (username.length > 50 || password.length > 128) {
      return res.status(400).json({ error: 'Datos de entrada inválidos' });
    }

    // Buscar usuario
    const user = await User.findOne({ where: { username } });

    if (!user) {
      // Respuesta genérica para no revelar si el usuario existe
      // Agregar delay artificial para prevenir timing attacks
      await bcrypt.hash('dummy_password', 10);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verificar si la cuenta está bloqueada
    const lockStatus = checkAccountLock(user);
    if (lockStatus.locked) {
      return res.status(423).json({ error: lockStatus.message });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Cuenta desactivada. Contacte al administrador.' });
    }

    // Verificar que sea un usuario local (no social)
    if (user.auth_provider !== 'local' && !user.password_hash) {
      return res.status(401).json({ error: 'Esta cuenta usa inicio de sesión con Google. Use el botón de Google.' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Registrar intento fallido
      await registerFailedAttempt(user, req);

      const attemptsLeft = MAX_FAILED_ATTEMPTS - user.failed_login_attempts;
      let errorMsg = 'Credenciales incorrectas';
      if (attemptsLeft > 0 && attemptsLeft <= 2) {
        errorMsg += `. ${attemptsLeft} intento${attemptsLeft > 1 ? 's' : ''} restante${attemptsLeft > 1 ? 's' : ''} antes del bloqueo.`;
      }

      return res.status(401).json({ error: errorMsg });
    }

    // Login exitoso - resetear intentos fallidos
    await resetFailedAttempts(user);

    // Generar token
    const token = generateToken(user);

    // Registrar auditoría
    await logAudit(user.id, 'LOGIN', 'user', user.id, null, null, req.ip);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// GET /api/auth/me - Obtener usuario actual
// =============================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        full_name: req.user.full_name,
        email: req.user.email,
        role: req.user.role,
        specialty: req.user.specialty,
      },
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// POST /api/auth/change-password - Cambiar contraseña
// =============================================
router.post('/change-password', authenticateToken, sanitizeInputs, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'La contraseña actual y la nueva son requeridas' });
    }

    // Validar longitud de nueva contraseña
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    if (new_password.length > 128) {
      return res.status(400).json({ error: 'La contraseña es demasiado larga' });
    }

    // Obtener usuario con password_hash
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que sea usuario local
    if (user.auth_provider !== 'local' || !user.password_hash) {
      return res.status(400).json({ error: 'Los usuarios con inicio de sesión social no pueden cambiar contraseña aquí' });
    }

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    // Actualizar contraseña
    user.password_hash = await bcrypt.hash(new_password, 12);
    await user.save();

    // Auditoría
    await logAudit(user.id, 'CHANGE_PASSWORD', 'user', user.id, null, null, req.ip);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// PUT /api/auth/profile - Actualizar perfil propio
// =============================================
router.put('/profile', authenticateToken, sanitizeInputs, async (req, res) => {
  try {
    const { full_name, email, specialty } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updateData = {};
    if (full_name && full_name.trim()) updateData.full_name = full_name.trim();
    if (email !== undefined) updateData.email = email || null;
    if (specialty !== undefined) updateData.specialty = specialty || null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
    }

    const oldValues = { full_name: user.full_name, email: user.email, specialty: user.specialty };
    await user.update(updateData);

    await logAudit(user.id, 'UPDATE', 'user', user.id, oldValues, updateData, req.ip);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
      },
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// POST /api/auth/google - Login con Google
// =============================================
router.post('/google', googleAuthLimiter, sanitizeInputs, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de Google es requerido' });
    }

    // Verificar token con Google
    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    
    if (!googleResponse.ok) {
      return res.status(401).json({ error: 'Token de Google inválido' });
    }

    const googleData = await googleResponse.json();

    // Verificar que el token sea para nuestra app (OBLIGATORIO)
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId || googleData.aud !== googleClientId) {
      console.warn(`⚠️ Token de Google con aud incorrecto: ${googleData.aud}`);
      return res.status(401).json({ error: 'Token de Google no autorizado para esta aplicación' });
    }

    // Verificar que el email esté verificado
    if (googleData.email_verified !== 'true' && googleData.email_verified !== true) {
      return res.status(401).json({ error: 'El email de Google no está verificado' });
    }

    const { sub: googleId, email, name } = googleData;

    // Buscar usuario existente por provider_id o email
    let user = await User.findOne({ 
      where: { provider_id: googleId, auth_provider: 'google' } 
    });

    if (!user && email) {
      user = await User.findOne({ where: { email } });
      if (user) {
        // Vincular cuenta existente con Google
        user.auth_provider = 'google';
        user.provider_id = googleId;
        await user.save();
      }
    }

    let isNewUser = false;
    if (!user) {
      // Crear nuevo usuario (inactivo hasta que el admin lo apruebe)
      const username = email ? email.split('@')[0] + '_g' : `google_${googleId.substring(0, 8)}`;
      user = await User.create({
        username,
        password_hash: null,
        full_name: name || 'Usuario Google',
        email: email || null,
        role: 'odontologo',
        auth_provider: 'google',
        provider_id: googleId,
        is_active: false,
      });
      isNewUser = true;
    }

    if (!user.is_active) {
      const msg = isNewUser
        ? 'Tu cuenta ha sido registrada y está pendiente de aprobación por el administrador.'
        : 'Tu cuenta está desactivada. Contacte al administrador.';
      return res.status(403).json({ error: msg, pendingApproval: isNewUser });
    }

    // Login exitoso - resetear intentos fallidos
    await resetFailedAttempts(user);

    // Generar token JWT
    const jwtToken = generateToken(user);

    // Registrar auditoría
    await logAudit(user.id, 'LOGIN_GOOGLE', 'user', user.id, null, null, req.ip);

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
      },
    });
  } catch (error) {
    console.error('Error en login con Google:', error);
    res.status(500).json({ error: 'Error al autenticar con Google' });
  }
});

export default router;

