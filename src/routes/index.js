// backend/src/routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin_routes'); 

const router = express.Router();

const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const adminRoutes = require('./admin.routes');

// Ruta de autenticación
router.use('/auth', authRoutes);

// Rutas de estudiantes, aspirantes, solicitudes, etc. se montan en la raíz de /api
router.use('/', studentRoutes);

// Rutas de administración (panel)
router.use('/admin', adminRoutes);

// Endpoint de salud
router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

