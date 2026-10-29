import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// ============================================================
// AIKnowledge — Base de conocimiento dental para enriquecer
// el system prompt de Denty dinámicamente.
// El doctor puede agregar/editar entradas desde el panel admin.
// ============================================================
const AIKnowledge = sequelize.define('AIKnowledge', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  category: {
    type: DataTypes.STRING(80),
    allowNull: false,
    comment: 'Categoría: servicios, precios, horarios, procedimientos, etc.',
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Pregunta o tema clave que Denty debe conocer',
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Respuesta o información que Denty debe dar',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Si está activa se inyecta en el system prompt',
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Mayor prioridad = se incluye primero en el prompt',
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del doctor que creó esta entrada',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ai_knowledge',
  timestamps: false,
  indexes: [
    { fields: ['category'] },
    { fields: ['is_active'] },
    { fields: ['priority'] },
  ],
});

export default AIKnowledge;

