import { Router } from 'express';
import { Treatment, Patient, User, TreatmentTeeth, Tooth, sequelize } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.use(authenticateToken);

// GET /api/treatments/patient/:patientId - Historial de atenciones de un paciente
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const { rows: treatments, count: total } = await Treatment.findAndCountAll({
      where: { patient_id: patientId },
      include: [
        { model: User, as: 'dentist', attributes: ['id', 'full_name', 'specialty'] },
        {
          model: TreatmentTeeth,
          as: 'treatmentTeeth',
          include: [{ model: Tooth, as: 'tooth' }],
        },
      ],
      order: [['treatment_date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      treatments,
      patient,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/treatments/:id - Obtener detalle de una atención
router.get('/:id', async (req, res) => {
  try {
    const treatment = await Treatment.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'dentist', attributes: ['id', 'full_name', 'specialty'] },
        {
          model: TreatmentTeeth,
          as: 'treatmentTeeth',
          include: [{ model: Tooth, as: 'tooth' }],
        },
      ],
    });

    if (!treatment) {
      return res.status(404).json({ error: 'Atención no encontrada' });
    }

    res.json({ treatment });
  } catch (error) {
    console.error('Error al obtener atención:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/treatments - Crear nueva atención
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      patient_id,
      treatment_date,
      reason,
      procedure_performed,
      observations,
      next_appointment,
      teeth, // Array de { tooth_id, condition, surface, notes }
    } = req.body;

    // Validaciones
    if (!patient_id || !reason) {
      await t.rollback();
      return res.status(400).json({ error: 'Paciente y motivo de consulta son requeridos' });
    }

    const patient = await Patient.findByPk(patient_id, { transaction: t });
    if (!patient) {
      await t.rollback();
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Crear atención
    const treatment = await Treatment.create({
      patient_id,
      treatment_date: treatment_date || new Date().toISOString().split('T')[0],
      reason,
      procedure_performed,
      observations,
      next_appointment,
      dentist_id: req.user.id,
    }, { transaction: t });

    // Asociar dientes si se proporcionaron
    if (teeth && teeth.length > 0) {
      const teethRecords = teeth.map((tooth) => ({
        treatment_id: treatment.id,
        tooth_id: tooth.tooth_id,
        condition: tooth.condition,
        surface: tooth.surface || null,
        notes: tooth.notes || null,
      }));
      await TreatmentTeeth.bulkCreate(teethRecords, { transaction: t });
    }

    await t.commit();

    // Obtener atención completa con relaciones
    const fullTreatment = await Treatment.findByPk(treatment.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'dentist', attributes: ['id', 'full_name', 'specialty'] },
        {
          model: TreatmentTeeth,
          as: 'treatmentTeeth',
          include: [{ model: Tooth, as: 'tooth' }],
        },
      ],
    });

    // Auditoría
    await logAudit(req.user.id, 'CREATE', 'treatment', treatment.id, null, fullTreatment.toJSON(), req.ip);

    res.status(201).json({ treatment: fullTreatment });
  } catch (error) {
    await t.rollback();
    console.error('Error al crear atención:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/treatments/:id - Actualizar atención
router.put('/:id', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const treatment = await Treatment.findByPk(req.params.id, { transaction: t });

    if (!treatment) {
      await t.rollback();
      return res.status(404).json({ error: 'Atención no encontrada' });
    }

    // Solo el odontólogo que creó o admin pueden editar
    if (req.user.role !== 'admin' && treatment.dentist_id !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ error: 'No tiene permisos para editar esta atención' });
    }

    const oldValues = treatment.toJSON();
    const { treatment_date, reason, procedure_performed, observations, next_appointment, teeth } = req.body;

    await treatment.update({
      treatment_date: treatment_date || treatment.treatment_date,
      reason: reason || treatment.reason,
      procedure_performed: procedure_performed !== undefined ? procedure_performed : treatment.procedure_performed,
      observations: observations !== undefined ? observations : treatment.observations,
      next_appointment: next_appointment !== undefined ? next_appointment : treatment.next_appointment,
    }, { transaction: t });

    // Actualizar dientes si se proporcionaron
    if (teeth) {
      await TreatmentTeeth.destroy({ where: { treatment_id: treatment.id }, transaction: t });
      if (teeth.length > 0) {
        const teethRecords = teeth.map((tooth) => ({
          treatment_id: treatment.id,
          tooth_id: tooth.tooth_id,
          condition: tooth.condition,
          surface: tooth.surface || null,
          notes: tooth.notes || null,
        }));
        await TreatmentTeeth.bulkCreate(teethRecords, { transaction: t });
      }
    }

    await t.commit();

    const fullTreatment = await Treatment.findByPk(treatment.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'dentist', attributes: ['id', 'full_name', 'specialty'] },
        {
          model: TreatmentTeeth,
          as: 'treatmentTeeth',
          include: [{ model: Tooth, as: 'tooth' }],
        },
      ],
    });

    await logAudit(req.user.id, 'UPDATE', 'treatment', treatment.id, oldValues, fullTreatment.toJSON(), req.ip);

    res.json({ treatment: fullTreatment });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar atención:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
