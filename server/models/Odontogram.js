import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Odontogram = sequelize.define('Odontogram', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patients',
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
    allowNull: false,
    defaultValue: 'sano',
  },
  surface: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  treatment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'treatments',
      key: 'id',
    },
  },
  dentist_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'odontogram',
});

export default Odontogram;
