// =============================================
// TOKEN BLACKLIST — Invalidación de JWT en logout
// Persiste en BD para sobrevivir reinicios
// =============================================
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Tabla para almacenar tokens JWT revocados.
 * Se limpia automáticamente cuando expiran.
 */
const RevokedToken = sequelize.define('RevokedToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  token_jti: {
    // JWT ID — identificador único del token
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  revoked_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del usuario que revocó el token',
  },
}, {
  tableName: 'revoked_tokens',
  updatedAt: false,
  indexes: [
    { fields: ['token_jti'] },
    { fields: ['expires_at'] },
  ],
});

/** Verificar si un token está revocado */
export async function isTokenRevoked(jti) {
  if (!jti) return false;
  const found = await RevokedToken.findOne({ where: { token_jti: jti } });
  return !!found;
}

/** Revocar un token por su JTI */
export async function revokeToken(jti, expiresAt, revokedBy = null) {
  if (!jti) return;
  try {
    await RevokedToken.upsert({ token_jti: jti, expires_at: expiresAt, revoked_by: revokedBy });
  } catch (e) {
    // No fallar si ya estaba revocado
  }
}

/**
 * Limpiar tokens expirados de la BD.
 * Se llama periódicamente para mantener la tabla pequeña.
 */
export async function cleanExpiredTokens() {
  const { Op } = await import('sequelize');
  const deleted = await RevokedToken.destroy({
    where: { expires_at: { [Op.lt]: new Date() } },
  });
  if (deleted > 0) {
    console.log(`🧹 Limpiados ${deleted} tokens revocados expirados.`);
  }
}

export default RevokedToken;
