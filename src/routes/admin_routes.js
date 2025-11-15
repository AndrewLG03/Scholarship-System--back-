// src/routes/admin.routes.js
const express = require('express');
const tsController = require('../controllers/trabajadora.social.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const router = express.Router();
router.use(authMiddleware, requireRole('TRABAJADORA_SOCIAL'));
router.get('/anuncios', tsController.listAnuncios);
router.post('/anuncios', tsController.createAnuncio);
router.put('/anuncios/:id', tsController.updateAnuncio);
router.delete('/anuncios/:id', tsController.deleteAnuncio);
//soilicitud de tipos de beca
module.exports = router;
const express = require('express');
const tsController = require('../controllers/trabajadora.social.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
router.use(authMiddleware, requireRole('TRABAJADORA_SOCIAL'));
router.get('/tipos-beca', tsController.listTiposBeca);
router.put('/solicitudes/:id/tipo-beca', tsController.assignTipoBeca);
module.exports = router;

//Activación de periodos de recepción (convocatorias)
const express = require('express');
const tsController = require('../controllers/trabajadora.social.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
router.use(authMiddleware, requireRole('TRABAJADORA_SOCIAL'));
router.get('/convocatorias', tsController.listConvocatorias);
router.put('/convocatorias/:id/abrir', tsController.abrirConvocatoria);
router.put('/convocatorias/:id/cerrar', tsController.cerrarConvocatoria);

module.exports = router;
// Cambiar estado/etapa de solicitud
router.put('/solicitudes/:id/estado', tsController.actualizarEstadoSolicitud);
// src/routes/admin.routes.js
const express = require('express');
const tsController = require('../controllers/trabajadora.social.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authMiddleware, requireRole('TRABAJADORA_SOCIAL'));

//  Anuncios
router.get('/anuncios', tsController.listAnuncios);
router.post('/anuncios', tsController.createAnuncio);
router.put('/anuncios/:id', tsController.updateAnuncio);
router.delete('/anuncios/:id', tsController.deleteAnuncio);

module.exports = router;

// Consultas
router.get('/consultas', tsController.listConsultas);
router.get('/consultas/:id', tsController.getConsulta);
router.post('/consultas/:id/responder', tsController.responderConsulta);

// Chatbot (alimentar base de conocimiento)
router.get('/chatbot-respuestas', tsController.listChatbotRespuestas);
router.post('/chatbot-respuestas', tsController.createChatbotRespuesta);
router.put('/chatbot-respuestas/:id', tsController.updateChatbotRespuesta);
router.delete('/chatbot-respuestas/:id', tsController.deleteChatbotRespuesta);
// Aprobación o denegación de becas
router.put('/solicitudes/:id/aprobar', tsController.aprobarSolicitud);
router.put('/solicitudes/:id/denegar', tsController.denegarSolicitud);
// Verificación de documentación
router.get('/solicitudes/:id/documentos', tsController.listDocumentosSolicitud);
router.put('/solicitudes/:id/documentos/:docId/verificar', tsController.verificarDocumento);
// Tipos de beca (creación, edición, eliminación)
router.post('/tipos-beca', tsController.createTipoBeca);
router.put('/tipos-beca/:id', tsController.updateTipoBeca);
router.delete('/tipos-beca/:id', tsController.deleteTipoBeca);
// Visita domiciliaria
router.get('/solicitudes/:id/visita', tsController.getVisitaDomiciliaria);
router.post('/solicitudes/:id/visita', tsController.programarVisitaDomiciliaria);
router.put('/solicitudes/:id/visita', tsController.actualizarVisitaDomiciliaria);
//  Informes estadísticos
router.get('/informes/estadisticos', tsController.informeEstadistico);
//  Informes detallados
router.get('/informes/detalle', tsController.informeDetallado);
//  Apelaciones
router.get('/apelaciones', tsController.listApelaciones);
router.get('/apelaciones/:id', tsController.getApelacion);
router.post('/apelaciones', tsController.crearApelacion);
router.put('/apelaciones/:id/resolver', tsController.resolverApelacion);
// Suspensión de becas
router.put('/becas/:id/suspender', tsController.suspenderBeca);
router.put('/becas/:id/reanudar', tsController.reanudarBeca);
// Cierre de expedientes
router.put('/expedientes/:id/cerrar', tsController.cerrarExpediente);
