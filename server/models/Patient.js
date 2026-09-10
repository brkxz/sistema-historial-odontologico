import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  dni: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('M', 'F'),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  medical_history: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Antecedentes médicos: enfermedades sistémicas, cirugías previas, etc.',
  },
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Alergias conocidas: medicamentos, materiales dentales, látex, etc.',
  },
  medications: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Medicamentos que toma actualmente',
  },
  blood_type: {
    type: DataTypes.STRING(5),
    allowNull: true,
    comment: 'Tipo de sangre: A+, A-, B+, B-, AB+, AB-, O+, O-',
  },
  registration_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  registered_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'patients',
});

export default Patient;
