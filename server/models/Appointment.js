// =============================================
// APPOINTMENT — Modelo de Citas
// =============================================
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'patients', key: 'id' },
  },
  dentist_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Fecha de la cita (YYYY-MM-DD)',
  },
  time: {
    type: DataTypes.STRING(5),
    allowNull: false,
    comment: 'Hora de la cita (HH:MM)',
    validate: {
      is: /^\d{2}:\d{2}$/,
    },
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    comment: 'Duración en minutos',
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas adicionales de la cita',
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Estado de la cita',
  },
  cancelled_reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Motivo de cancelación si aplica',
  },
}, {
  tableName: 'appointments',
  indexes: [
    { fields: ['patient_id'] },
    { fields: ['dentist_id'] },
    { fields: ['date'] },
    { fields: ['status'] },
    { fields: ['date', 'dentist_id'] }, // Para verificar conflictos de horario
  ],
});

export default Appointment;
