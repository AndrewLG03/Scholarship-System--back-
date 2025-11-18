// backend/src/routes/admin.routes.js
const express = require('express');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Middleware to verify that the authenticated user has the admin role.
function verifyAdmin(req, res, next) {
    const user = req.user;
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    return next();
}

// Panel de administración – devuelve métricas agregadas.
router.get('/dashboard', authMiddleware, verifyAdmin, adminController.getDashboard);

module.exports = router;