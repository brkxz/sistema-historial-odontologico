// =============================================
// RATE LIMITER - Protección contra fuerza bruta
// Sin dependencias externas, usa memoria
// =============================================

const rateLimitStores = {};

/**
 * Crea un middleware de rate limiting en memoria.
 * @param {Object} options
 * @param {number} options.windowMs - Ventana de tiempo en milisegundos
 * @param {number} options.max - Máximo de requests en la ventana
 * @param {string} options.message - Mensaje de error
 * @param {string} options.name - Nombre del limiter (para separar stores)
 */
export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 100, message = 'Demasiadas solicitudes. Intente más tarde.', name = 'default' } = {}) {
  // Inicializar store para este limiter
  if (!rateLimitStores[name]) {
    rateLimitStores[name] = new Map();

    // Limpiar entradas expiradas cada 5 minutos
    setInterval(() => {
      const now = Date.now();
      const store = rateLimitStores[name];
      for (const [key, data] of store.entries()) {
        if (now - data.firstRequest > windowMs) {
          store.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  return (req, res, next) => {
    const store = rateLimitStores[name];
    // Usar IP + ruta como clave
    const key = (req.ip || req.connection.remoteAddress || 'unknown') + ':' + name;
    const now = Date.now();

    let record = store.get(key);

    if (!record || (now - record.firstRequest > windowMs)) {
      // Nueva ventana
      record = { count: 1, firstRequest: now };
      store.set(key, record);
      setRateLimitHeaders(res, max, max - 1, windowMs);
      return next();
    }

    record.count++;

    if (record.count > max) {
      const retryAfter = Math.ceil((record.firstRequest + windowMs - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      setRateLimitHeaders(res, max, 0, windowMs);

      console.warn(`⚠️ Rate limit excedido: ${key} (${record.count} requests)`);

      return res.status(429).json({
        error: message,
        retryAfter,
      });
    }

    setRateLimitHeaders(res, max, max - record.count, windowMs);
    next();
  };
}

function setRateLimitHeaders(res, limit, remaining, windowMs) {
  res.set('X-RateLimit-Limit', String(limit));
  res.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  res.set('X-RateLimit-Reset', String(Math.ceil((Date.now() + windowMs) / 1000)));
}

// Rate limiters preconfigurados
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,                    // 5 intentos
  message: 'Demasiados intentos de inicio de sesión. Intente en 15 minutos.',
  name: 'login',
});

export const googleAuthLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos de autenticación con Google. Intente en 15 minutos.',
  name: 'google-auth',
});

export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Demasiadas solicitudes al servidor. Intente más tarde.',
  name: 'api-general',
});
