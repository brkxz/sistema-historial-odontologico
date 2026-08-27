// Middleware para verificar roles de usuario
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'No tiene permisos para realizar esta acción',
      });
    }

    next();
  };
};

// Solo administradores
export const requireAdmin = requireRole('admin');

// Administradores y odontólogos
export const requireDentistOrAdmin = requireRole('admin', 'odontologo');
