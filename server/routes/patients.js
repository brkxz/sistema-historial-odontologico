import { Router } from 'express';
import { Op } from 'sequelize';
import { Patient, User, Treatment, sequelize } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireDentistOrAdmin } from '../middleware/roles.js';
import { logAudit } from '../middleware/audit.js';
import { createPatientSchema, updatePatientSchema, paginationSchema, validate } from '../utils/schemas.js';
import logger from '../utils/logger.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/patients — Listar pacientes con paginación segura
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const { page, limit } = paginationSchema.parse(req.query);
    const offset = (page - 1) * limit;

    let where = { deleted_at: null }; // Solo pacientes activos (soft delete)
    if (search) {
      const likeOp = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
      where = {
        deleted_at: null,
        [Op.or]: [
          { dni:        { [likeOp]: `%${search}%` } },
          { first_name: { [likeOp]: `%${search}%` } },
          { last_name:  { [likeOp]: `%${search}%` } },
        ],
      };
    }

    const { rows: patients, count: total } = await Patient.findAndCountAll({
      where,
      include: [{ model: User, as: 'registeredByUser', attributes: ['full_name'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      patients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error('Error al listar pacientes', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/patients/search/:dni - Buscar por DNI
router.get('/search/:dni', async (req, res) => {
  try {
    const { dni } = req.params;

    const patient = await Patient.findOne({
      where: { dni },
      include: [
        { model: User, as: 'registeredByUser', attributes: ['full_name'] },
        {
          model: Treatment,
          as: 'treatments',
          limit: 5,
          order: [['treatment_date', 'DESC']],
          include: [
            { model: User, as: 'dentist', attributes: ['full_name'] },
          ],
        },
      ],
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.json({ patient });
  } catch (error) {
    console.error('Error al buscar paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/patients/:id - Obtener paciente por ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [
        { model: User, as: 'registeredByUser', attributes: ['full_name'] },
      ],
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.json({ patient });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/patients — Crear paciente (validado con Zod)
router.post('/', requireDentistOrAdmin, validate(createPatientSchema), async (req, res) => {
  try {
    const data = req.body;

    // Verificar DNI único (incluyendo eliminados lógicamente)
    const existing = await Patient.findOne({ where: { dni: data.dni } });
    if (existing) {
      if (existing.deleted_at) {
        return res.status(409).json({
          error: 'Ya existe un paciente con este DNI (fue eliminado). Contacte al administrador para restaurarlo.',
        });
      }
      return res.status(409).json({ error: 'Ya existe un paciente con este DNI' });
    }

    const patient = await Patient.create({
      ...data,
      email:             data.email && data.email.trim() !== '' ? data.email.trim() : null,
      registration_date: new Date().toISOString().split('T')[0],
      registered_by:     req.user.id,
    });

    await logAudit(req.user.id, 'CREATE', 'patient', patient.id, null, patient.toJSON(), req.ip);
    logger.info('Paciente creado', { patientId: patient.id, dni: data.dni, by: req.user.username });

    res.status(201).json({ patient });
  } catch (error) {
    logger.error('Error al crear paciente', { error: error.message });
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ya existe un paciente con este DNI' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/patients/:id — Actualizar paciente (validado con Zod)
router.put('/:id', requireDentistOrAdmin, validate(updatePatientSchema), async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: { id: req.params.id, deleted_at: null },
    });
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });

    const oldValues = patient.toJSON();
    const data = req.body;

    // Verificar DNI único si se cambia
    if (data.dni && data.dni !== patient.dni) {
      const existing = await Patient.findOne({ where: { dni: data.dni } });
      if (existing) return res.status(409).json({ error: 'Ya existe un paciente con este DNI' });
    }

    await patient.update(data);
    await logAudit(req.user.id, 'UPDATE', 'patient', patient.id, oldValues, patient.toJSON(), req.ip);

    res.json({ patient });
  } catch (error) {
    logger.error('Error al actualizar paciente', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/patients/:id — Eliminación lógica (soft delete)
router.delete('/:id', requireDentistOrAdmin, async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: { id: req.params.id, deleted_at: null },
    });
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });

    const oldValues = patient.toJSON();
    await patient.update({ deleted_at: new Date() });
    await logAudit(req.user.id, 'DELETE', 'patient', patient.id, oldValues, null, req.ip);
    logger.info('Paciente eliminado (soft delete)', { patientId: patient.id, by: req.user.username });

    res.json({ message: 'Paciente eliminado correctamente' });
  } catch (error) {
    logger.error('Error al eliminar paciente', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
