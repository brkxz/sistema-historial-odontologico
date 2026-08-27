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

// Middleware para registrar automáticamente
export const auditMiddleware = (action, entity) => {
  return (req, res, next) => {
    const originalSend = res.json.bind(res);

    res.json = (data) => {
      // Solo registrar si la respuesta fue exitosa
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const ip = req.ip || req.connection.remoteAddress;
        logAudit(
          req.user.id,
          action,
          entity,
          data?.id || data?.data?.id || null,
          req.body._oldValues || null,
          req.body,
          ip
        );
      }
      return originalSend(data);
    };

    next();
  };
};
