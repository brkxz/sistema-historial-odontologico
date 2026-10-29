import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// ============================================================
// AIConversation — Guarda cada intercambio del chat público
// Permite analizar conversaciones y mejorar el sistema prompt
// ============================================================
const AIConversation = sequelize.define('AIConversation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  session_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: 'ID de sesión del visitante (anónimo)',
  },
  user_message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Mensaje del paciente/visitante',
  },
  ai_response: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Respuesta generada por Denty',
  },
  provider: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: 'Proveedor de IA usado (Groq, OpenRouter, etc.)',
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Calificación: 1 = útil, -1 = no útil, null = sin calificar',
  },
  ip_hash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'Hash SHA-256 de la IP para análisis (no guardamos IP directa)',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ai_conversations',
  timestamps: false,
  indexes: [
    { fields: ['session_id'] },
    { fields: ['created_at'] },
    { fields: ['rating'] },
  ],
});

export default AIConversation;
