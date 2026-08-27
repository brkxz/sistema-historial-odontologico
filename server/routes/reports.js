import { Router } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Treatment, Patient, User, sequelize } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// GET /api/reports/summary - Resumen general
router.get('/summary', async (req, res) => {
  try {
    const totalPatients = await Patient.count();
    const totalTreatments = await Treatment.count();

    // Atenciones de hoy
    const today = new Date().toISOString().split('T')[0];
    const todayTreatments = await Treatment.count({
      where: { treatment_date: today },
    });

    // Atenciones del mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const monthTreatments = await Treatment.count({
      where: {
        treatment_date: {
          [Op.gte]: startOfMonth.toISOString().split('T')[0],
        },
      },
    });

    // Próximas citas (próximos 7 días)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingAppointments = await Treatment.count({
      where: {
        next_appointment: {
          [Op.between]: [today, nextWeek.toISOString().split('T')[0]],
        },
      },
    });

    res.json({
      totalPatients,
      totalTreatments,
      todayTreatments,
      monthTreatments,
      upcomingAppointments,
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reports/treatments-by-date - Atenciones por fecha
router.get('/treatments-by-date', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let where = {};
    if (start_date && end_date) {
      where.treatment_date = { [Op.between]: [start_date, end_date] };
    } else if (start_date) {
      where.treatment_date = { [Op.gte]: start_date };
    } else if (end_date) {
      where.treatment_date = { [Op.lte]: end_date };
    }

    const treatments = await Treatment.findAll({
      where,
      attributes: [
        'treatment_date',
        [fn('COUNT', col('Treatment.id')), 'count'],
      ],
      group: ['treatment_date'],
      order: [['treatment_date', 'DESC']],
      raw: true,
    });

    res.json({ treatments });
  } catch (error) {
    console.error('Error al obtener atenciones por fecha:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reports/treatments-by-dentist - Atenciones por odontólogo
router.get('/treatments-by-dentist', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let where = {};
    if (start_date && end_date) {
      where.treatment_date = { [Op.between]: [start_date, end_date] };
    }

    const treatments = await Treatment.findAll({
      where,
      attributes: [
        'dentist_id',
        [fn('COUNT', col('Treatment.id')), 'count'],
      ],
      include: [
        { model: User, as: 'dentist', attributes: ['full_name'] },
      ],
      group: ['dentist_id'],
      raw: true,
      nest: true,
    });

    res.json({ treatments });
  } catch (error) {
    console.error('Error al obtener atenciones por odontólogo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reports/recent-treatments - Atenciones recientes
router.get('/recent-treatments', async (req, res) => {
  try {
    const treatments = await Treatment.findAll({
      include: [
        { model: Patient, as: 'patient', attributes: ['dni', 'first_name', 'last_name'] },
        { model: User, as: 'dentist', attributes: ['full_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    res.json({ treatments });
  } catch (error) {
    console.error('Error al obtener atenciones recientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
