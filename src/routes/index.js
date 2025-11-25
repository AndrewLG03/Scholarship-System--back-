// src/routes/index.js
const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const adminRoutes = require('./admin_routes');
const solicitudRoutes = require('./solicitud.routes');
const comiteRoutes = require('./comite.routes');   // 👈 AGREGADO

// ORDEN CORREGIDO
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/solicitudes', solicitudRoutes);
router.use('/comite', comiteRoutes);               // 👈 AGREGADO
router.use('/', studentRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;
ports = router;