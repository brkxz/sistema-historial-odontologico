import { Router } from 'express';
import { Op } from 'sequelize';
import { Patient, User, Treatment } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/patients - Listar pacientes
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = {};
    if (search) {
      where = {
        [Op.or]: [
          { dni: { [Op.like]: `%${search}%` } },
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    const { rows: patients, count: total } = await Patient.findAndCountAll({
      where,
      include: [
        { model: User, as: 'registeredByUser', attributes: ['full_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      patients,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error al listar pacientes:', error);
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

// POST /api/patients - Crear paciente
router.post('/', async (req, res) => {
  try {
    const { dni, first_name, last_name, birth_date, age, gender, phone, address, email } = req.body;

    // Validaciones
    if (!dni || !first_name || !last_name) {
      return res.status(400).json({ error: 'DNI, nombres y apellidos son requeridos' });
    }

    // Verificar DNI único
    const existing = await Patient.findOne({ where: { dni } });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un paciente con este DNI' });
    }

    const patient = await Patient.create({
      dni,
      first_name,
      last_name,
      birth_date,
      age,
      gender,
      phone,
      address,
      email,
      registration_date: new Date().toISOString().split('T')[0],
      registered_by: req.user.id,
    });

    // Auditoría
    await logAudit(req.user.id, 'CREATE', 'patient', patient.id, null, patient.toJSON(), req.ip);

    res.status(201).json({ patient });
  } catch (error) {
    console.error('Error al crear paciente:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ya existe un paciente con este DNI' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/patients/:id - Actualizar paciente
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const oldValues = patient.toJSON();
    const { dni, first_name, last_name, birth_date, age, gender, phone, address, email } = req.body;

    // Verificar DNI único si se cambia
    if (dni && dni !== patient.dni) {
      const existing = await Patient.findOne({ where: { dni } });
      if (existing) {
        return res.status(409).json({ error: 'Ya existe un paciente con este DNI' });
      }
    }

    await patient.update({
      dni: dni || patient.dni,
      first_name: first_name || patient.first_name,
      last_name: last_name || patient.last_name,
      birth_date: birth_date !== undefined ? birth_date : patient.birth_date,
      age: age !== undefined ? age : patient.age,
      gender: gender !== undefined ? gender : patient.gender,
      phone: phone !== undefined ? phone : patient.phone,
      address: address !== undefined ? address : patient.address,
      email: email !== undefined ? email : patient.email,
    });

    // Auditoría
    await logAudit(req.user.id, 'UPDATE', 'patient', patient.id, oldValues, patient.toJSON(), req.ip);

    res.json({ patient });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
