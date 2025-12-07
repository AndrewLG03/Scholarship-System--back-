// src/routes/admin_routes.js 
const express = require('express');
const adminController = require('../controllers/trabajadora.social.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

// TODAS las rutas requieren TRABAJADORA SOCIAL
router.use(authMiddleware, requireRole('TRABAJADORA_SOCIAL'));

/* =====================================================
   PERIODOS
===================================================== */
router.get('/periodos', adminController.listPeriodos);
router.get('/periodos/:id', adminController.getPeriodo);
router.post('/periodos', adminController.createPeriodo);
router.put('/periodos/:id', adminController.updatePeriodo);
router.delete('/periodos/:id', adminController.deletePeriodo);

/* =====================================================
   CONVOCATORIAS
===================================================== */
router.get('/convocatorias', adminController.listConvocatorias);
router.post('/convocatorias', adminController.createConvocatoria);
router.put('/convocatorias/:id/estado', adminController.updateConvocatoriaEstado);
router.put('/convocatorias/:id/abrir', adminController.abrirConvocatoria);
router.put('/convocatorias/:id/cerrar', adminController.cerrarConvocatoria);

/* =====================================================
   TIPOS DE BECA
===================================================== */
router.get('/tipos-beca', adminController.listTiposBeca);
router.get('/tipos-beca/:id', adminController.getTipoBeca);
router.post('/tipos-beca', adminController.createTipoBeca);
router.put('/tipos-beca/:id', adminController.updateTipoBeca);
router.delete('/tipos-beca/:id', adminController.deleteTipoBeca);

/* =====================================================
   SOLICITUDES
===================================================== */
router.get('/solicitudes', adminController.listSolicitudes);
router.get('/solicitudes/:id', adminController.getSolicitud);
router.put('/solicitudes/:id/estado', adminController.updateSolicitudEstado);
router.post('/solicitudes', adminController.createSolicitud);

/* =====================================================
   INFO SOCIOECONÓMICA
===================================================== */
router.get('/socioeconomico/casos', adminController.listCasosSocioeconomicos);

// ⭐ RUTA NUEVA → CREA ESTUDIO SOCIOECONÓMICO + APLICA FÓRMULA
router.post('/socioeconomico', adminController.createInfoSocioeconomica);

/* =====================================================
   EVALUACIÓN ACADÉMICA
===================================================== */
router.get('/academico/estudiantes', adminController.listEvaluacionAcademica);

/* =====================================================
   ETAPAS DE CONVOCATORIA
===================================================== */

// Obtener etapas (acepta query o path param)
router.get('/etapas', adminController.listEtapas);
router.get('/etapas/:id_convocatoria', adminController.listEtapas);

// Actualizar etapa específica
router.put('/etapas/:id', adminController.updateEtapa);
/* =====================================================
   APELACIONES
===================================================== */
router.get('/apelaciones', adminController.listApelaciones);
router.post('/apelaciones', adminController.createApelacion);
router.put('/apelaciones/:id', adminController.updateApelacion);


module.exports = router;
