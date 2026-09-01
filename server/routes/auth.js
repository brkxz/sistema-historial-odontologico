import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Buscar usuario
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Usuario desactivado. Contacte al administrador.' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

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

// GET /api/auth/me - Obtener usuario actual
router.get('/me', async (req, res) => {
  try {
    // req.user ya está establecido por el middleware auth
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

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

// POST /api/auth/google - Login con Google
router.post('/google', async (req, res) => {
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

    // Verificar que el token sea para nuestra app
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (googleClientId && googleClientId !== 'TU_GOOGLE_CLIENT_ID_AQUI' && googleData.aud !== googleClientId) {
      return res.status(401).json({ error: 'Token de Google no autorizado para esta aplicación' });
    }

    const { sub: googleId, email, name, picture } = googleData;

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


