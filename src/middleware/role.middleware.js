// src/middleware/role.middleware.js

// Middleware para verificar rol de usuario
// Uso: router.use(authMiddleware, requireRole('TRABAJADORA_SOCIAL'));

function requireRole(requiredRole) {
  return (req, res, next) => {
    // Si no hay usuario en el request, no está autenticado
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Por ahora permitir todos los usuarios autenticados
    next();
  };
}

module.exports = { requireRole };
