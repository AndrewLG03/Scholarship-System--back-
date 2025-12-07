// backend/src/routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const adminRoutes = require('./admin_routes');
const solicitudRoutes = require('./solicitud.routes');
const resultadoRoutes = require('./resultado.routes');
const infoAcademicaRoutes = require('./info_Academica.routes');
const apelacionRoutes = require('./apelacion.routes');
const visitasRoutes = require('./visita_routes');
const router = express.Router();

// Ruta de autenticación
router.use('/auth', authRoutes);

// Rutas de estudiantes, aspirantes, solicitudes, etc. se montan en la raíz de /api
router.use('/', studentRoutes);
router.use('/solicitud', solicitudRoutes);
router.use('/resultados', resultadoRoutes);
router.use('/info-academica', infoAcademicaRoutes);
router.use('/apelacion', apelacionRoutes);
router.use('/comite', require('./comite.routes'));
router.use('/visitas', visitasRoutes);

// Rutas de administración (panel)
router.use('/admin', adminRoutes);

// Endpoint de salud
router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;