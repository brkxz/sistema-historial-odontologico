import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TreatmentTeeth = sequelize.define('TreatmentTeeth', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  treatment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'treatments',
      key: 'id',
    },
  },
  tooth_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teeth',
      key: 'id',
    },
  },
  condition: {
    type: DataTypes.ENUM(
      'sano', 'caries', 'obturado', 'ausente',
      'fracturado', 'endodoncia', 'corona', 'puente',
      'sellante', 'protesis'
    ),
    allowNull: true,
  },
  surface: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'oclusal, mesial, distal, vestibular, lingual, palatino',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'treatment_teeth',
});

export default TreatmentTeeth;
