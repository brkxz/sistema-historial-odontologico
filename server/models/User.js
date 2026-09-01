import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50],
    },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true, // Nullable para usuarios que inician con Google/Facebook
  },
  auth_provider: {
    type: DataTypes.ENUM('local', 'google', 'facebook'),
    allowNull: false,
    defaultValue: 'local',
  },
  provider_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  full_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  role: {
    type: DataTypes.ENUM('admin', 'odontologo'),
    allowNull: false,
    defaultValue: 'odontologo',
  },
  specialty: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
});

export default User;
