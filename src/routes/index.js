// backend/src/routes/index.js
const express = require('express');
<<<<<<< HEAD
=======
const router = express.Router();

// Importar rutas
>>>>>>> 29923aaa8d68b308505c8ea36314d412f11d3985
const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const adminRoutes = require('./admin.routes');
const solicitudRoutes = require('./solicitud.routes');
<<<<<<< HEAD

const router = express.Router();
=======
const apelacionRoutes = require("./apelacion.routes");
const resultadoRoutes = require("./resultado.routes");
>>>>>>> 29923aaa8d68b308505c8ea36314d412f11d3985

console.log('🔍 [DEBUG] Resultado Routes loaded:', typeof resultadoRoutes);

// Auth → /auth/*
router.use('/auth', authRoutes);

// Estudiantes / aspirantes → /api/*
router.use('/', studentRoutes);
router.use('/solicitudes', solicitudRoutes);

// Panel admin → /admin/*
router.use('/admin', adminRoutes);

<<<<<<< HEAD
// Endpoint de salud
router.get('/health', (req, res) => res.json({ status: 'ok' }));
=======
router.use('/solicitudes', solicitudRoutes);

router.use("/apelaciones", apelacionRoutes);

console.log('🔍 [DEBUG] Montando /resultados/aspirante con resultadoRoutes');
router.use("/resultados/aspirante", resultadoRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
>>>>>>> 29923aaa8d68b308505c8ea36314d412f11d3985

module.exports = router;


