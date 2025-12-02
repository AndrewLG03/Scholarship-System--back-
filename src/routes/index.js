// src/routes/index.js - VERSIÓN ORIGINAL
const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const adminRoutes = require('./admin_routes');  // ← admin_routes.js
const solicitudRoutes = require('./solicitud.routes');

// ORDEN CORREGIDO
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/solicitudes', solicitudRoutes);
router.use('/', studentRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;