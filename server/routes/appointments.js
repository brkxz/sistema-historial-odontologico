// =============================================
// APPOINTMENTS — Módulo de gestión de citas
// =============================================
import { Router } from 'express';
import { Op } from 'sequelize';
import { Appointment, Patient, User, sequelize } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireDentistOrAdmin } from '../middleware/roles.js';
import { logAudit } from '../middleware/audit.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  paginationSchema,
  validate,
} from '../utils/schemas.js';
import logger from '../utils/logger.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Verifica si un odontólogo ya tiene una cita en el mismo horario */
async function checkScheduleConflict(dentistId, date, time, duration, excludeId = null) {
  const [h, m]    = time.split(':').map(Number);
  const startMins = h * 60 + m;
  const endMins   = startMins + duration;

  const appointments = await Appointment.findAll({
    where: {
      dentist_id: dentistId,
      date,
      status: { [Op.in]: ['pending', 'confirmed'] },
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    },
  });

  return appointments.some((a) => {
    const [ah, am] = a.time.split(':').map(Number);
    const aStart   = ah * 60 + am;
    const aEnd     = aStart + a.duration;
    return startMins < aEnd && endMins > aStart;
  });
}

// ─── Rutas ──────────────────────────────────────────────────────────────────

/**
 * GET /api/appointments
 * Lista citas con filtros opcionales: date, dentist_id, patient_id, status
 */
router.get('/', async (req, res) => {
  try {
    const { date, dentist_id, patient_id, status } = req.query;
    const { page, limit } = paginationSchema.parse(req.query);

    const where = {};
    if (date)       where.date       = date;
    if (status)     where.status     = status;
    if (dentist_id) where.dentist_id = parseInt(dentist_id);
    if (patient_id) where.patient_id = parseInt(patient_id);

    // Los odontólogos solo ven sus propias citas
    if (req.user.role === 'odontologo') {
      where.dentist_id = req.user.id;
    }

    const { rows: appointments, count: total } = await Appointment.findAndCountAll({
      where,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'dni', 'first_name', 'last_name', 'phone'],
        },
        {
          model: User,
          as: 'dentist',
          attributes: ['id', 'full_name', 'specialty'],
        },
      ],
      order: [['date', 'ASC'], ['time', 'ASC']],
      limit,
      offset: (page - 1) * limit,
    });

    res.json({ appointments, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error('Error al listar citas', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/appointments/today
 * Citas del día de hoy para el panel de control
 */
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const where = { date: today, status: { [Op.in]: ['pending', 'confirmed'] } };

    if (req.user.role === 'odontologo') where.dentist_id = req.user.id;

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'dni', 'first_name', 'last_name', 'phone'] },
        { model: User, as: 'dentist', attributes: ['id', 'full_name', 'specialty'] },
      ],
      order: [['time', 'ASC']],
    });

    res.json({ appointments });
  } catch (error) {
    logger.error('Error al obtener citas de hoy', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/appointments/upcoming
 * Próximas citas (7 días)
 */
router.get('/upcoming', async (req, res) => {
  try {
    const today   = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const where = {
      date:   { [Op.between]: [today, nextWeekStr] },
      status: { [Op.in]: ['pending', 'confirmed'] },
    };
    if (req.user.role === 'odontologo') where.dentist_id = req.user.id;

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'dni', 'first_name', 'last_name', 'phone'] },
        { model: User, as: 'dentist', attributes: ['id', 'full_name', 'specialty'] },
      ],
      order: [['date', 'ASC'], ['time', 'ASC']],
      limit: 20,
    });

    res.json({ appointments });
  } catch (error) {
    logger.error('Error al obtener próximas citas', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/appointments/:id
 * Detalle de una cita
 */
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'dentist', attributes: ['id', 'full_name', 'specialty'] },
      ],
    });

    if (!appointment) return res.status(404).json({ error: 'Cita no encontrada' });

    // Los odontólogos solo ven sus propias citas
    if (req.user.role === 'odontologo' && appointment.dentist_id !== req.user.id) {
      return res.status(403).json({ error: 'No tiene permisos para ver esta cita' });
    }

    res.json({ appointment });
  } catch (error) {
    logger.error('Error al obtener cita', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/appointments
 * Crear una nueva cita
 */
router.post('/', requireDentistOrAdmin, validate(createAppointmentSchema), async (req, res) => {
  try {
    const data = req.body;

    // Asignar dentista actual si no se especificó
    if (!data.dentist_id) data.dentist_id = req.user.id;

    // Verificar que el paciente existe
    const patient = await Patient.findByPk(data.patient_id);
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });

    // Verificar que la fecha no sea en el pasado
    const today = new Date().toISOString().split('T')[0];
    if (data.date < today) {
      return res.status(400).json({ error: 'No se pueden crear citas en fechas pasadas' });
    }

    // Verificar conflicto de horario
    const hasConflict = await checkScheduleConflict(
      data.dentist_id, data.date, data.time, data.duration
    );
    if (hasConflict) {
      return res.status(409).json({
        error: 'El odontólogo ya tiene una cita en ese horario. Elija una hora diferente.',
      });
    }

    const appointment = await Appointment.create(data);
    await logAudit(req.user.id, 'CREATE', 'appointment', appointment.id, null, appointment.toJSON(), req.ip);
    logger.info('Cita creada', { appointmentId: appointment.id, date: data.date, by: req.user.username });

    // Obtener cita con relaciones
    const full = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'dni', 'first_name', 'last_name'] },
        { model: User, as: 'dentist', attributes: ['id', 'full_name', 'specialty'] },
      ],
    });

    res.status(201).json({ appointment: full });
  } catch (error) {
    logger.error('Error al crear cita', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PUT /api/appointments/:id
 * Actualizar cita (fecha, hora, notas, estado)
 */
router.put('/:id', requireDentistOrAdmin, validate(updateAppointmentSchema), async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Cita no encontrada' });

    // Solo el dentista asignado o admin pueden editar
    if (req.user.role === 'odontologo' && appointment.dentist_id !== req.user.id) {
      return res.status(403).json({ error: 'No tiene permisos para editar esta cita' });
    }

    const oldValues = appointment.toJSON();
    const data      = req.body;

    // Si cambia la fecha/hora, verificar conflictos
    const newDate     = data.date     || appointment.date;
    const newTime     = data.time     || appointment.time;
    const newDuration = data.duration || appointment.duration;
    const newDentist  = data.dentist_id || appointment.dentist_id;

    if (data.date || data.time || data.duration) {
      const hasConflict = await checkScheduleConflict(
        newDentist, newDate, newTime, newDuration, appointment.id
      );
      if (hasConflict) {
        return res.status(409).json({
          error: 'El odontólogo ya tiene una cita en ese horario.',
        });
      }
    }

    await appointment.update(data);
    await logAudit(req.user.id, 'UPDATE', 'appointment', appointment.id, oldValues, appointment.toJSON(), req.ip);

    const full = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'dni', 'first_name', 'last_name'] },
        { model: User, as: 'dentist', attributes: ['id', 'full_name', 'specialty'] },
      ],
    });

    res.json({ appointment: full });
  } catch (error) {
    logger.error('Error al actualizar cita', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PATCH /api/appointments/:id/cancel
 * Cancelar una cita con motivo
 */
router.patch('/:id/cancel', async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Cita no encontrada' });

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'La cita ya está cancelada' });
    }
    if (appointment.status === 'completed') {
      return res.status(400).json({ error: 'No se puede cancelar una cita completada' });
    }

    // Solo el dentista asignado, el admin o la recepción pueden cancelar
    if (req.user.role === 'odontologo' && appointment.dentist_id !== req.user.id) {
      return res.status(403).json({ error: 'No tiene permisos para cancelar esta cita' });
    }

    const { reason } = req.body;
    const oldValues = appointment.toJSON();
    await appointment.update({
      status: 'cancelled',
      cancelled_reason: reason || null,
    });

    await logAudit(req.user.id, 'UPDATE', 'appointment', appointment.id, oldValues, appointment.toJSON(), req.ip);
    logger.info('Cita cancelada', { appointmentId: appointment.id, reason, by: req.user.username });

    res.json({ appointment, message: 'Cita cancelada correctamente' });
  } catch (error) {
    logger.error('Error al cancelar cita', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PATCH /api/appointments/:id/complete
 * Marcar cita como completada
 */
router.patch('/:id/complete', requireDentistOrAdmin, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Cita no encontrada' });

    if (appointment.status === 'completed') {
      return res.status(400).json({ error: 'La cita ya está completada' });
    }
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'No se puede completar una cita cancelada' });
    }

    const oldValues = appointment.toJSON();
    await appointment.update({ status: 'completed' });
    await logAudit(req.user.id, 'UPDATE', 'appointment', appointment.id, oldValues, appointment.toJSON(), req.ip);

    res.json({ appointment, message: 'Cita marcada como completada' });
  } catch (error) {
    logger.error('Error al completar cita', { error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
