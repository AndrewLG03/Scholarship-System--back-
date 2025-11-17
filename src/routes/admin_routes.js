// src/routes/admin.routes.js
const express = require('express');
const tsController = require('../controllers/trabajadora.social.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();
router.use(authMiddleware, requireRole('TRABAJADORA_SOCIAL'));

//  ANUNCIOS 
router.get('/anuncios', tsController.listAnuncios);
router.post('/anuncios', tsController.createAnuncio);
router.put('/anuncios/:id', tsController.updateAnuncio);
router.delete('/anuncios/:id', tsController.deleteAnuncio);

// TIPOS DE BECA 
// listado de tipos de beca
router.get('/tipos-beca', tsController.listTiposBeca);
// creación/edición/eliminación
router.post('/tipos-beca', tsController.createTipoBeca);
router.put('/tipos-beca/:id', tsController.updateTipoBeca);
router.delete('/tipos-beca/:id', tsController.deleteTipoBeca);
// asignar tipo de beca a solicitud
router.put('/solicitudes/:id/tipo-beca', tsController.assignTipoBeca);

// Activación de periodos de recepción (CONVOCATORIAS) 
router.get('/convocatorias', tsController.listConvocatorias);
router.put('/convocatorias/:id/abrir', tsController.abrirConvocatoria);
router.put('/convocatorias/:id/cerrar', tsController.cerrarConvocatoria);

//  Cambiar estado/etapa de solicitud 
router.put('/solicitudes/:id/estado', tsController.actualizarEstadoSolicitud);

//  CONSULTAS 
router.get('/consultas', tsController.listConsultas);
router.get('/consultas/:id', tsController.getConsulta);
router.post('/consultas/:id/responder', tsController.responderConsulta);

// CHATBOT
router.get('/chatbot-respuestas', tsController.listChatbotRespuestas);
router.post('/chatbot-respuestas', tsController.createChatbotRespuesta);
router.put('/chatbot-respuestas/:id', tsController.updateChatbotRespuesta);
router.delete('/chatbot-respuestas/:id', tsController.deleteChatbotRespuesta);

// APROBACIÓN O DENEGACIÓN DE SOLICITUDES 
router.put('/solicitudes/:id/aprobar', tsController.aprobarSolicitud);
router.put('/solicitudes/:id/denegar', tsController.denegarSolicitud);

// VERIFICACIÓN DE DOCUMENTACIÓN 
router.get('/solicitudes/:id/documentos', tsController.listDocumentosSolicitud);
router.put('/solicitudes/:id/documentos/:docId/verificar', tsController.verificarDocumento);

// VISITA DOMICILIARIA 
router.get('/solicitudes/:id/visita', tsController.getVisitaDomiciliaria);
router.post('/solicitudes/:id/visita', tsController.programarVisitaDomiciliaria);
router.put('/solicitudes/:id/visita', tsController.actualizarVisitaDomiciliaria);

//  INFORMES 
router.get('/informes/estadisticos', tsController.informeEstadistico);
router.get('/informes/detalle', tsController.informeDetallado);

// APELACIONES 
router.get('/apelaciones', tsController.listApelaciones);
router.get('/apelaciones/:id', tsController.getApelacion);
router.post('/apelaciones', tsController.crearApelacion);
router.put('/apelaciones/:id/resolver', tsController.resolverApelacion);

// SUSPENSIÓN / REANUDACIÓN DE BECAS 
router.put('/becas/:id/suspender', tsController.suspenderBeca);
router.put('/becas/:id/reanudar', tsController.reanudarBeca);

// CIERRE DE EXPEDIENTES 
router.put('/expedientes/:id/cerrar', tsController.cerrarExpediente);

module.exports = router;
