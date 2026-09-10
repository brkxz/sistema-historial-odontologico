import { Router } from 'express';
import { Op } from 'sequelize';
import { AuditLog, User } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin); // Solo administradores pueden ver los logs de auditoría

// GET /api/audit - Listar logs de auditoría con paginación y filtros
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 30,
      action,
      entity,
      user_id,
      start_date,
      end_date,
    } = req.query;

    const offset = (page - 1) * limit;

    const where = {};

    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (user_id) where.user_id = parseInt(user_id);

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) {
        const end = new Date(end_date);
        end.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = end;
      }
    }

    const { rows: logs, count: total } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'full_name'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
