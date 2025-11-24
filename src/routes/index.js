// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const adminRoutes = require('./admin.routes');
const solicitudRoutes = require('./solicitud.routes');
const apelacionRoutes = require("./apelacion.routes");
const resultadoRoutes = require("./resultado.routes");

console.log('🔍 [DEBUG] Resultado Routes loaded:', typeof resultadoRoutes);

// Auth → /auth/*
router.use('/auth', authRoutes);

// Estudiantes / aspirantes → /api/*
router.use('/', studentRoutes);

// Panel admin → /admin/*
router.use('/admin', adminRoutes);

router.use('/solicitudes', solicitudRoutes);

router.use("/apelaciones", apelacionRoutes);

console.log('🔍 [DEBUG] Montando /resultados/aspirante con resultadoRoutes');
router.use("/resultados/aspirante", resultadoRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;


