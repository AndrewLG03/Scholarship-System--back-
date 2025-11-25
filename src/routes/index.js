// src/routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const adminRoutes = require('./admin.routes');
const solicitudRoutes = require('./solicitud.routes');
const resultadoRoutes = require('./resultado.routes');

const router = express.Router();

// ORDEN CORREGIDO
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/solicitudes', solicitudRoutes);
router.use('/comite', comiteRoutes);               // 👈 AGREGADO
router.use('/', studentRoutes);
router.use('/solicitudes', solicitudRoutes);
router.use('/resultados', resultadoRoutes);

// Rutas de administración (panel)
router.use('/admin', adminRoutes);

// Endpoint de salud
router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;
ports = router;