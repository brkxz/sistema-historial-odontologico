import { AuditLog } from '../models/index.js';

// Registrar acción de auditoría
export const logAudit = async (userId, action, entity, entityId, oldValues = null, newValues = null, ipAddress = null) => {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      ip_address: ipAddress,
    });
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
};

