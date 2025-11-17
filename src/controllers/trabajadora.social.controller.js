// src/controllers/trabajadora.social.controller.js
const tsService = require('../services/trabajadora.social.service');

// =====================================================
//  ANUNCIOS (Noticias)
// =====================================================

// GET /api/admin/anuncios
exports.listAnuncios = async (req, res, next) => {
  try {
    const anuncios = await tsService.listAnuncios();
    res.json(anuncios);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/anuncios
exports.createAnuncio = async (req, res, next) => {
  try {
    const { titulo, contenido, visible_para } = req.body;
    const publicado_por = req.user.id_usuario; // viene del token

    const nuevo = await tsService.createAnuncio({
      titulo,
      contenido,
      visible_para,
      publicado_por,
    });

    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/anuncios/:id
exports.updateAnuncio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, contenido, visible_para } = req.body;

    const actualizado = await tsService.updateAnuncio(id, {
      titulo,
      contenido,
      visible_para,
    });

    res.json(actualizado);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/anuncios/:id
exports.deleteAnuncio = async (req, res, next) => {
  try {
    const { id } = req.params;
    await tsService.deleteAnuncio(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// =====================================================
//  TIPOS DE BECA
// =====================================================

// GET /api/admin/tipos-beca
exports.listTiposBeca = async (req, res, next) => {
  try {
    const tipos = await tsService.listTiposBeca();
    res.json(tipos);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/tipos-beca
exports.createTipoBeca = async (req, res, next) => {
  try {
    const { codigo, nombre, modalidad, tope_mensual } = req.body;
    const tipo = await tsService.createTipoBeca({ codigo, nombre, modalidad, tope_mensual });
    res.status(201).json(tipo);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/tipos-beca/:id
exports.updateTipoBeca = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, modalidad, tope_mensual } = req.body;
    const tipo = await tsService.updateTipoBeca(id, { codigo, nombre, modalidad, tope_mensual });
    res.json(tipo);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/tipos-beca/:id
exports.deleteTipoBeca = async (req, res, next) => {
  try {
    const { id } = req.params;
    await tsService.deleteTipoBeca(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/solicitudes/:id/tipo-beca
exports.assignTipoBeca = async (req, res, next) => {
  try {
    const { id } = req.params; // id_solicitud
    const { id_tipo_beca, valor, fecha_inicio, fecha_fin } = req.body;
    const idFuncionario = req.user?.id_usuario || null;

    const result = await tsService.assignTipoBecaToSolicitud(
      id,
      id_tipo_beca,
      { valor, fecha_inicio, fecha_fin },
      idFuncionario
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// =====================================================
//  CONVOCATORIAS (Apertura / Cierre de periodos)
// =====================================================

// GET /api/admin/convocatorias
exports.listConvocatorias = async (req, res, next) => {
  try {
    const data = await tsService.listConvocatorias();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/convocatorias/:id/abrir
exports.abrirConvocatoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idFuncionario = req.user?.id_usuario || null;

    const data = await tsService.cambiarEstadoConvocatoria(
      id,
      'ABIERTO',
      idFuncionario
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/convocatorias/:id/cerrar
exports.cerrarConvocatoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idFuncionario = req.user?.id_usuario || null;

    const data = await tsService.cambiarEstadoConvocatoria(
      id,
      'CERRADO',
      idFuncionario
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// =====================================================
//  ESTADO / ETAPAS DE SOLICITUD
// =====================================================

// PUT /api/admin/solicitudes/:id/estado
exports.actualizarEstadoSolicitud = async (req, res, next) => {
  try {
    const { id } = req.params;                  // id_solicitud
    const { estado, observaciones } = req.body; // ej: 'EN_REVISION_TS', 'EN_COMITE', etc.
    const responsable =
      req.user?.nombre || req.user?.correo || 'TRABAJADORA_SOCIAL';

    const result = await tsService.actualizarEstadoSolicitud(
      id,
      estado,
      { responsable, observaciones }
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// =====================================================
//  CONSULTAS
// =====================================================

// GET /api/admin/consultas
exports.listConsultas = async (req, res, next) => {
  try {
    const consultas = await tsService.listConsultas();
    res.json(consultas);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/consultas/:id
exports.getConsulta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const consulta = await tsService.getConsulta(id);
    res.json(consulta);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/consultas/:id/responder
exports.responderConsulta = async (req, res, next) => {
  try {
    const { id } = req.params; // id_consulta
    const { respuesta } = req.body;
    const idFuncionario = req.user.id_usuario;

    const data = await tsService.responderConsulta(id, respuesta, idFuncionario);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// =====================================================
//  CHATBOT
// =====================================================

// GET /api/admin/chatbot-respuestas
exports.listChatbotRespuestas = async (req, res, next) => {
  try {
    const data = await tsService.listChatbotRespuestas();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/chatbot-respuestas
exports.createChatbotRespuesta = async (req, res, next) => {
  try {
    const { pregunta, respuesta } = req.body;
    const nueva = await tsService.createChatbotRespuesta({ pregunta, respuesta });
    res.status(201).json(nueva);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/chatbot-respuestas/:id
exports.updateChatbotRespuesta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pregunta, respuesta } = req.body;
    const upd = await tsService.updateChatbotRespuesta(id, { pregunta, respuesta });
    res.json(upd);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/chatbot-respuestas/:id
exports.deleteChatbotRespuesta = async (req, res, next) => {
  try {
    const { id } = req.params;
    await tsService.deleteChatbotRespuesta(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// =====================================================
//  APROBACIÓN / DENEGACIÓN DE SOLICITUDES
// =====================================================

// PUT /api/admin/solicitudes/:id/aprobar
exports.aprobarSolicitud = async (req, res, next) => {
  try {
    const { id } = req.params;              // id_solicitud
    const { motivo, id_sesion } = req.body; // id_sesion opcional
    const evaluador =
      req.user?.nombre || req.user?.correo || 'TRABAJADORA_SOCIAL';

    const data = await tsService.aprobarSolicitud(id, {
      motivo,
      id_sesion,
      evaluador,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/solicitudes/:id/denegar
exports.denegarSolicitud = async (req, res, next) => {
  try {
    const { id } = req.params;              // id_solicitud
    const { motivo, id_sesion } = req.body;
    const evaluador =
      req.user?.nombre || req.user?.correo || 'TRABAJADORA_SOCIAL';

    const data = await tsService.denegarSolicitud(id, {
      motivo,
      id_sesion,
      evaluador,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// =====================================================
//  VERIFICACIÓN DE DOCUMENTOS
// =====================================================

// GET /api/admin/solicitudes/:id/documentos
exports.listDocumentosSolicitud = async (req, res, next) => {
  try {
    const { id } = req.params; // id_solicitud
    const docs = await tsService.listDocumentosSolicitud(id);
    res.json(docs);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/solicitudes/:id/documentos/:docId/verificar
exports.verificarDocumento = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    const { valido } = req.body; // 'SI' | 'NO'
    const data = await tsService.verificarDocumento(id, docId, valido);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// =====================================================
//  VISITA DOMICILIARIA
// =====================================================

// GET /api/admin/solicitudes/:id/visita
exports.getVisitaDomiciliaria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visita = await tsService.getVisitaDomiciliaria(id);
    res.json(visita);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/solicitudes/:id/visita
exports.programarVisitaDomiciliaria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha_programada, observaciones } = req.body;

    const data = await tsService.programarVisitaDomiciliaria(id, {
      fecha_programada,
      observaciones,
    });

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/solicitudes/:id/visita
exports.actualizarVisitaDomiciliaria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      fecha_programada,
      fecha_realizada,
      estado,
      observaciones,
      resultado,
    } = req.body;

    const data = await tsService.actualizarVisitaDomiciliaria(id, {
      fecha_programada,
      fecha_realizada,
      estado,
      observaciones,
      resultado,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// =====================================================
//  INFORMES
// =====================================================

// GET /api/admin/informes/estadisticos
exports.informeEstadistico = async (req, res, next) => {
  try {
    const data = await tsService.informeEstadistico();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/informes/detalle
exports.informeDetallado = async (req, res, next) => {
  try {
    const { tipo, periodo } = req.query; // tipo obligatorio, periodo opcional
    const data = await tsService.informeDetallado({ tipo, periodo });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// =====================================================
//  APELACIONES
// =====================================================

// GET /api/admin/apelaciones
exports.listApelaciones = async (req, res, next) => {
  try {
    const data = await tsService.listApelaciones();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/apelaciones/:id
exports.getApelacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await tsService.getApelacion(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/apelaciones
exports.crearApelacion = async (req, res, next) => {
  try {
    const { id_solicitud, motivo } = req.body;
    const data = await tsService.crearApelacion({ id_solicitud, motivo });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/apelaciones/:id/resolver
exports.resolverApelacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, resolucion } = req.body; // ACEPTADA / RECHAZADA
    const data = await tsService.resolverApelacion(id, { estado, resolucion });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// =====================================================
//  SUSPENSIÓN / REANUDACIÓN DE BECAS
// =====================================================

// PUT /api/admin/becas/:id/suspender
exports.suspenderBeca = async (req, res, next) => {
  try {
    const { id } = req.params; // id_beca
    const { motivo, fecha_fin } = req.body;
    const data = await tsService.suspenderBeca(id, { motivo, fecha_fin });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/becas/:id/reanudar
exports.reanudarBeca = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await tsService.reanudarBeca(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// =====================================================
//  CIERRE DE EXPEDIENTES
// =====================================================

// PUT /api/admin/expedientes/:id/cerrar
exports.cerrarExpediente = async (req, res, next) => {
  try {
    const { id } = req.params; // id_solicitud
    const { observaciones } = req.body;
    const responsable =
      req.user?.nombre || req.user?.correo || 'TRABAJADORA_SOCIAL';

    const data = await tsService.cerrarExpediente(id, { responsable, observaciones });
    res.json(data);
  } catch (err) {
    next(err);
  }
};
