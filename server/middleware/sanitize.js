// =============================================
// SANITIZACIÓN DE INPUTS - Anti XSS e Inyección
// =============================================

/**
 * Limpia un string removiendo caracteres peligrosos
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/[<>]/g, '')           // Remover tags HTML
    .replace(/javascript:/gi, '')    // Remover javascript: URIs
    .replace(/on\w+=/gi, '')         // Remover event handlers (onclick=, etc)
    .replace(/\0/g, '');             // Remover null bytes
}

/**
 * Recursivamente sanitiza todas las propiedades string de un objeto
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Middleware que sanitiza req.body, req.query, y req.params
 */
export function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}

/**
 * Valida que un campo no exceda cierta longitud
 */
export function validateLength(field, maxLength) {
  return (req, res, next) => {
    const value = req.body?.[field];
    if (value && typeof value === 'string' && value.length > maxLength) {
      return res.status(400).json({
        error: `El campo ${field} excede el límite de ${maxLength} caracteres`,
      });
    }
    next();
  };
}
