import { Router } from 'express';
import { Odontogram, Patient, Tooth, User, Treatment } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.use(authenticateToken);

// GET /api/odontogram/:patientId - Obtener odontograma del paciente
router.get('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const odontogram = await Odontogram.findAll({
      where: { patient_id: patientId },
      include: [
        { model: Tooth, as: 'tooth' },
        { model: User, as: 'dentist', attributes: ['full_name'] },
        { model: Treatment, as: 'treatment', attributes: ['id', 'treatment_date', 'reason'] },
      ],
      order: [['updated_at', 'DESC']],
    });

    // Obtener todos los dientes
    const allTeeth = await Tooth.findAll({ order: [['tooth_number', 'ASC']] });

    res.json({ odontogram, teeth: allTeeth, patient });
  } catch (error) {
    console.error('Error al obtener odontograma:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/odontogram - Crear/actualizar entrada del odontograma
router.post('/', async (req, res) => {
  try {
    const { patient_id, tooth_id, condition, surface, notes, treatment_id } = req.body;

    if (!patient_id || !tooth_id || !condition) {
      return res.status(400).json({ error: 'Paciente, diente y condición son requeridos' });
    }

    // Buscar si ya existe una entrada para este diente y paciente
    let entry = await Odontogram.findOne({
      where: { patient_id, tooth_id },
    });

    if (entry) {
      const oldValues = entry.toJSON();
      await entry.update({
        condition,
        surface,
        notes,
        treatment_id,
        dentist_id: req.user.id,
      });
      await logAudit(req.user.id, 'UPDATE', 'odontogram', entry.id, oldValues, entry.toJSON(), req.ip);
    } else {
      entry = await Odontogram.create({
        patient_id,
        tooth_id,
        condition,
        surface,
        notes,
        treatment_id,
        dentist_id: req.user.id,
      });
      await logAudit(req.user.id, 'CREATE', 'odontogram', entry.id, null, entry.toJSON(), req.ip);
    }

    const fullEntry = await Odontogram.findByPk(entry.id, {
      include: [
        { model: Tooth, as: 'tooth' },
        { model: User, as: 'dentist', attributes: ['full_name'] },
      ],
    });

    res.json({ entry: fullEntry });
  } catch (error) {
    console.error('Error al actualizar odontograma:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/odontogram/bulk - Actualizar múltiples dientes
router.post('/bulk', async (req, res) => {
  try {
    const { patient_id, entries, treatment_id } = req.body;

    if (!patient_id || !entries || entries.length === 0) {
      return res.status(400).json({ error: 'Paciente y entradas son requeridos' });
    }

    const results = [];

    for (const entry of entries) {
      let existing = await Odontogram.findOne({
        where: { patient_id, tooth_id: entry.tooth_id },
      });

      if (existing) {
        await existing.update({
          condition: entry.condition,
          surface: entry.surface || null,
          notes: entry.notes || null,
          treatment_id: treatment_id || null,
          dentist_id: req.user.id,
        });
        results.push(existing);
      } else {
        const newEntry = await Odontogram.create({
          patient_id,
          tooth_id: entry.tooth_id,
          condition: entry.condition,
          surface: entry.surface || null,
          notes: entry.notes || null,
          treatment_id: treatment_id || null,
          dentist_id: req.user.id,
        });
        results.push(newEntry);
      }
    }

    res.json({ entries: results });
  } catch (error) {
    console.error('Error al actualizar odontograma en lote:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
