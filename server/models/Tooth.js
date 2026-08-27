import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Tooth = sequelize.define('Tooth', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tooth_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('incisivo', 'canino', 'premolar', 'molar'),
    allowNull: false,
  },
  quadrant: {
    type: DataTypes.ENUM(
      'superior_derecho',
      'superior_izquierdo',
      'inferior_izquierdo',
      'inferior_derecho'
    ),
    allowNull: false,
  },
}, {
  tableName: 'teeth',
  timestamps: false,
});

export default Tooth;
