import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.use(authenticateToken);

// GET /api/users - Listar usuarios (solo admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });

    res.json({ users });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/users/dentists - Listar odontólogos activos
router.get('/dentists', async (req, res) => {
  try {
    const dentists = await User.findAll({
      where: { role: 'odontologo', is_active: true },
      attributes: ['id', 'full_name', 'specialty'],
      order: [['full_name', 'ASC']],
    });

    res.json({ dentists });
  } catch (error) {
    console.error('Error al listar odontólogos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/users - Crear usuario (solo admin)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { username, password, full_name, email, role, specialty } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'Usuario, contraseña y nombre completo son requeridos' });
    }

    // Verificar username único
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password_hash,
      full_name,
      email,
      role: role || 'odontologo',
      specialty,
      is_active: true,
    });

    await logAudit(req.user.id, 'CREATE', 'user', user.id, null, { username, full_name, role }, req.ip);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/users/:id - Actualizar usuario (solo admin)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { full_name, email, role, specialty, is_active, password } = req.body;

    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (role) updateData.role = role;
    if (specialty !== undefined) updateData.specialty = specialty;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (password) updateData.password_hash = await bcrypt.hash(password, 10);

    // Protección: el admin no puede desactivarse a sí mismo
    if (parseInt(req.params.id) === req.user.id && is_active === false) {
      return res.status(403).json({ error: 'No puedes desactivar tu propia cuenta' });
    }

    // Protección: el admin no puede quitarse el rol de admin a sí mismo
    if (parseInt(req.params.id) === req.user.id && role && role !== 'admin') {
      return res.status(403).json({ error: 'No puedes quitarte el rol de administrador' });
    }

    await user.update(updateData);

    await logAudit(req.user.id, 'UPDATE', 'user', user.id, null, updateData, req.ip);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
