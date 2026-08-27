import sequelize from '../config/database.js';
import User from './User.js';
import Patient from './Patient.js';
import Treatment from './Treatment.js';
import Tooth from './Tooth.js';
import TreatmentTeeth from './TreatmentTeeth.js';
import Odontogram from './Odontogram.js';
import AuditLog from './AuditLog.js';

// =============================================
// RELACIONES
// =============================================

// User -> Patients (quien registró al paciente)
User.hasMany(Patient, { foreignKey: 'registered_by', as: 'registeredPatients' });
Patient.belongsTo(User, { foreignKey: 'registered_by', as: 'registeredByUser' });

// User -> Treatments (odontólogo que realizó la atención)
User.hasMany(Treatment, { foreignKey: 'dentist_id', as: 'treatments' });
Treatment.belongsTo(User, { foreignKey: 'dentist_id', as: 'dentist' });

// Patient -> Treatments
Patient.hasMany(Treatment, { foreignKey: 'patient_id', as: 'treatments' });
Treatment.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Treatment <-> Teeth (muchos a muchos a través de TreatmentTeeth)
Treatment.belongsToMany(Tooth, {
  through: TreatmentTeeth,
  foreignKey: 'treatment_id',
  otherKey: 'tooth_id',
  as: 'teeth',
});
Tooth.belongsToMany(Treatment, {
  through: TreatmentTeeth,
  foreignKey: 'tooth_id',
  otherKey: 'treatment_id',
  as: 'treatments',
});

// TreatmentTeeth relaciones directas
Treatment.hasMany(TreatmentTeeth, { foreignKey: 'treatment_id', as: 'treatmentTeeth' });
TreatmentTeeth.belongsTo(Treatment, { foreignKey: 'treatment_id' });
Tooth.hasMany(TreatmentTeeth, { foreignKey: 'tooth_id', as: 'treatmentTeeth' });
TreatmentTeeth.belongsTo(Tooth, { foreignKey: 'tooth_id', as: 'tooth' });

// Patient -> Odontogram
Patient.hasMany(Odontogram, { foreignKey: 'patient_id', as: 'odontogram' });
Odontogram.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Tooth -> Odontogram
Tooth.hasMany(Odontogram, { foreignKey: 'tooth_id', as: 'odontogramEntries' });
Odontogram.belongsTo(Tooth, { foreignKey: 'tooth_id', as: 'tooth' });

// Treatment -> Odontogram
Treatment.hasMany(Odontogram, { foreignKey: 'treatment_id', as: 'odontogramEntries' });
Odontogram.belongsTo(Treatment, { foreignKey: 'treatment_id', as: 'treatment' });

// User -> Odontogram (quien registró)
User.hasMany(Odontogram, { foreignKey: 'dentist_id', as: 'odontogramEntries' });
Odontogram.belongsTo(User, { foreignKey: 'dentist_id', as: 'dentist' });

// User -> AuditLog
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  sequelize,
  User,
  Patient,
  Treatment,
  Tooth,
  TreatmentTeeth,
  Odontogram,
  AuditLog,
};
