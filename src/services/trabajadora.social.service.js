const db = require('../config/database');

// =====================================================
//  ANUNCIOS (Noticias)
// =====================================================

exports.listAnuncios = async () => {
  try {
    const query = `SELECT * FROM anuncios ORDER BY fecha_publicacion DESC`;
    const [anuncios] = await db.query(query);
    return anuncios;
  } catch (error) {
    console.error('Error en servicio listAnuncios:', error);
    throw error;
  }
};

exports.createAnuncio = async ({ titulo, contenido, visible_para, publicado_por }) => {
  try {
    const query = `
      INSERT INTO anuncios (titulo, contenido, visible_para, publicado_por, fecha_publicacion)
      VALUES (?, ?, ?, ?, NOW())
    `;
    const [result] = await db.query(query, [titulo, contenido, visible_para, publicado_por]);
    return { id: result.insertId, titulo, contenido, visible_para, publicado_por };
  } catch (error) {
    console.error('Error en servicio createAnuncio:', error);
    throw error;
  }
};

exports.updateAnuncio = async (id, { titulo, contenido, visible_para }) => {
  try {
    const query = `
      UPDATE anuncios 
      SET titulo = ?, contenido = ?, visible_para = ?, fecha_actualizacion = NOW()
      WHERE id = ?
    `;
    const [result] = await db.query(query, [titulo, contenido, visible_para, id]);
    return result;
  } catch (error) {
    console.error('Error en servicio updateAnuncio:', error);
    throw error;
  }
};

exports.deleteAnuncio = async (id) => {
  try {
    const query = `DELETE FROM anuncios WHERE id = ?`;
    const [result] = await db.query(query, [id]);
    return result;
  } catch (error) {
    console.error('Error en servicio deleteAnuncio:', error);
    throw error;
  }
};

// =====================================================
//  TIPOS DE BECA
// =====================================================

exports.listTiposBeca = async () => {
  try {
    const query = `SELECT * FROM tipos_beca ORDER BY nombre`;
    const [tipos] = await db.query(query);
    return tipos;
  } catch (error) {
    console.error('Error en servicio listTiposBeca:', error);
    throw error;
  }
};

exports.createTipoBeca = async ({ codigo, nombre, modalidad, tope_mensual }) => {
  try {
    const query = `
      INSERT INTO tipos_beca (codigo, nombre, modalidad, tope_mensual)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [codigo, nombre, modalidad, tope_mensual]);
    return { id: result.insertId, codigo, nombre, modalidad, tope_mensual };
  } catch (error) {
    console.error('Error en servicio createTipoBeca:', error);
    throw error;
  }
};

exports.updateTipoBeca = async (id, { codigo, nombre, modalidad, tope_mensual }) => {
  try {
    const query = `
      UPDATE tipos_beca 
      SET codigo = ?, nombre = ?, modalidad = ?, tope_mensual = ?
      WHERE id = ?
    `;
    const [result] = await db.query(query, [codigo, nombre, modalidad, tope_mensual, id]);
    return result;
  } catch (error) {
    console.error('Error en servicio updateTipoBeca:', error);
    throw error;
  }
};

exports.deleteTipoBeca = async (id) => {
  try {
    const query = `DELETE FROM tipos_beca WHERE id = ?`;
    const [result] = await db.query(query, [id]);
    return result;
  } catch (error) {
    console.error('Error en servicio deleteTipoBeca:', error);
    throw error;
  }
};

exports.assignTipoBecaToSolicitud = async (idSolicitud, idTipoBeca, datos, idFuncionario) => {
  try {
    const { valor, fecha_inicio, fecha_fin } = datos;
    const query = `
      UPDATE solicitudes 
      SET id_tipo_beca = ?, valor_asignado = ?, fecha_inicio = ?, fecha_fin = ?, actualizado_por = ?
      WHERE id_solicitud = ?
    `;
    const [result] = await db.query(query, [idTipoBeca, valor, fecha_inicio, fecha_fin, idFuncionario, idSolicitud]);
    return result;
  } catch (error) {
    console.error('Error en servicio assignTipoBecaToSolicitud:', error);
    throw error;
  }
};

// =====================================================
//  SOLICITUDES - CORREGIDO
// =====================================================

exports.listSolicitudes = async ({ estado, fecha } = {}) => {
  try {
    let query = `SELECT * FROM solicitudes WHERE 1=1`;
    const params = [];

    if (estado) {
      query += ' AND estado = ?';
      params.push(estado);
    }

    if (fecha) {
      query += ' AND DATE(fecha_creacion) = ?';
      params.push(fecha);
    }

    query += ' ORDER BY fecha_creacion DESC';

    const [solicitudes] = await db.query(query, params);
    return solicitudes;
  } catch (error) {
    console.error('Error en servicio listSolicitudes:', error);
    throw error;
  }
};

// =====================================================
//  ANÁLISIS SOCIOECONÓMICO - CORREGIDO
// =====================================================

exports.listCasosSocioeconomicos = async () => {
  try {
    const query = `
      SELECT 
        id_info as id,
        id_solicitud,
        ocupacion_padre,
        ocupacion_madre,
        ingreso_total,
        egreso_total,
        tipo_vivienda,
        condicion_vivienda,
        servicios_basicos,
        observaciones,
        'PENDIENTE' as estado
      FROM info_socioeconomica 
      ORDER BY id_info DESC
    `;
    const [casos] = await db.query(query);
    return casos;
  } catch (error) {
    console.error('Error en servicio listCasosSocioeconomicos:', error);
    throw error;
  }
};

// =====================================================
//  EVALUACIÓN ACADÉMICA - CORREGIDO (sin cuatrimestre)
// =====================================================

exports.listEvaluacionAcademica = async (cuatri) => {
  try {
    let query = `
      SELECT 
        id_evaluacion as id,
        id_solicitud,
        metodo_socio,
        promedio,
        reprobadas as materias_reprobadas,
        observaciones,
        evaluado_por,
        fecha_eval as fecha_evaluacion,
        'REGULAR' as situacion_academica
      FROM evaluaciones 
      WHERE 1=1
    `;
    const params = [];

    // Si necesitas filtrar por cuatrimestre pero la columna no existe,
    // puedes eliminar este filtro o usar otra columna disponible
    if (cuatri) {
      // Si no existe cuatrimestre, puedes omitir el filtro
      // o usar fecha_eval si contiene información del periodo
      console.log('Filtro cuatrimestre ignorado - columna no existe');
    }

    query += ' ORDER BY CAST(promedio AS DECIMAL(4,2)) DESC';
    
    const [estudiantes] = await db.query(query, params);
    return estudiantes;
  } catch (error) {
    console.error('Error en servicio listEvaluacionAcademica:', error);
    throw error;
  }
};
// =====================================================
//  CONVOCATORIAS
// =====================================================

exports.listConvocatorias = async () => {
  try {
    const query = `SELECT * FROM convocatorias ORDER BY fecha_inicio DESC`;
    const [convocatorias] = await db.query(query);
    return convocatorias;
  } catch (error) {
    console.error('Error en servicio listConvocatorias:', error);
    throw error;
  }
};

exports.cambiarEstadoConvocatoria = async (id, estado, idFuncionario) => {
  try {
    const query = `UPDATE convocatorias SET estado = ?, actualizado_por = ? WHERE id = ?`;
    const [result] = await db.query(query, [estado, idFuncionario, id]);
    return result;
  } catch (error) {
    console.error('Error en servicio cambiarEstadoConvocatoria:', error);
    throw error;
  }
};

// =====================================================
//  ESTADO / ETAPAS DE SOLICITUD - CORREGIDO
// =====================================================

exports.actualizarEstadoSolicitud = async (id, estado, { responsable, observaciones }) => {
  try {
    const query = `
      UPDATE solicitudes 
      SET estado = ?, observaciones = ?, responsable = ?, fecha_actualizacion = NOW()
      WHERE id_solicitud = ?
    `;
    const [result] = await db.query(query, [estado, observaciones, responsable, id]);
    return result;
  } catch (error) {
    console.error('Error en servicio actualizarEstadoSolicitud:', error);
    throw error;
  }
};

// =====================================================
//  CONSULTAS
// =====================================================

exports.listConsultas = async () => {
  try {
    const query = `SELECT * FROM consultas ORDER BY fecha_consulta DESC`;
    const [consultas] = await db.query(query);
    return consultas;
  } catch (error) {
    console.error('Error en servicio listConsultas:', error);
    throw error;
  }
};

exports.getConsulta = async (id) => {
  try {
    const query = `SELECT * FROM consultas WHERE id = ?`;
    const [consultas] = await db.query(query, [id]);
    return consultas[0] || null;
  } catch (error) {
    console.error('Error en servicio getConsulta:', error);
    throw error;
  }
};

exports.responderConsulta = async (id, respuesta, idFuncionario) => {
  try {
    const query = `
      UPDATE consultas 
      SET respuesta = ?, respondido_por = ?, fecha_respuesta = NOW(), estado = 'RESPONDIDA'
      WHERE id = ?
    `;
    const [result] = await db.query(query, [respuesta, idFuncionario, id]);
    return result;
  } catch (error) {
    console.error('Error en servicio responderConsulta:', error);
    throw error;
  }
};

// =====================================================
//  CHATBOT
// =====================================================

exports.listChatbotRespuestas = async () => {
  try {
    const query = `SELECT * FROM chatbot_respuestas ORDER BY pregunta`;
    const [respuestas] = await db.query(query);
    return respuestas;
  } catch (error) {
    console.error('Error en servicio listChatbotRespuestas:', error);
    throw error;
  }
};

exports.createChatbotRespuesta = async ({ pregunta, respuesta }) => {
  try {
    const query = `INSERT INTO chatbot_respuestas (pregunta, respuesta) VALUES (?, ?)`;
    const [result] = await db.query(query, [pregunta, respuesta]);
    return { id: result.insertId, pregunta, respuesta };
  } catch (error) {
    console.error('Error en servicio createChatbotRespuesta:', error);
    throw error;
  }
};

exports.updateChatbotRespuesta = async (id, { pregunta, respuesta }) => {
  try {
    const query = `UPDATE chatbot_respuestas SET pregunta = ?, respuesta = ? WHERE id = ?`;
    const [result] = await db.query(query, [pregunta, respuesta, id]);
    return result;
  } catch (error) {
    console.error('Error en servicio updateChatbotRespuesta:', error);
    throw error;
  }
};

exports.deleteChatbotRespuesta = async (id) => {
  try {
    const query = `DELETE FROM chatbot_respuestas WHERE id = ?`;
    const [result] = await db.query(query, [id]);
    return result;
  } catch (error) {
    console.error('Error en servicio deleteChatbotRespuesta:', error);
    throw error;
  }
};

// =====================================================
//  APROBACIÓN / DENEGACIÓN DE SOLICITUDES - CORREGIDO
// =====================================================

exports.aprobarSolicitud = async (id, { motivo, id_sesion, evaluador }) => {
  try {
    const query = `
      UPDATE solicitudes 
      SET estado = 'APROBADA', motivo_aprobacion = ?, id_sesion_aprobacion = ?, evaluador = ?, fecha_aprobacion = NOW()
      WHERE id_solicitud = ?
    `;
    const [result] = await db.query(query, [motivo, id_sesion, evaluador, id]);
    return result;
  } catch (error) {
    console.error('Error en servicio aprobarSolicitud:', error);
    throw error;
  }
};

exports.denegarSolicitud = async (id, { motivo, id_sesion, evaluador }) => {
  try {
    const query = `
      UPDATE solicitudes 
      SET estado = 'DENEGADA', motivo_denegacion = ?, id_sesion_denegacion = ?, evaluador = ?, fecha_denegacion = NOW()
      WHERE id_solicitud = ?
    `;
    const [result] = await db.query(query, [motivo, id_sesion, evaluador, id]);
    return result;
  } catch (error) {
    console.error('Error en servicio denegarSolicitud:', error);
    throw error;
  }
};

// =====================================================
//  VERIFICACIÓN DE DOCUMENTOS - CORREGIDO
// =====================================================

exports.listDocumentosSolicitud = async (idSolicitud) => {
  try {
    const query = `SELECT * FROM documentos WHERE id_solicitud = ?`;
    const [documentos] = await db.query(query, [idSolicitud]);
    return documentos;
  } catch (error) {
    console.error('Error en servicio listDocumentosSolicitud:', error);
    throw error;
  }
};

exports.verificarDocumento = async (idSolicitud, docId, valido) => {
  try {
    const query = `
      UPDATE documentos 
      SET verificado = ?, fecha_verificacion = NOW()
      WHERE id = ? AND id_solicitud = ?
    `;
    const [result] = await db.query(query, [valido, docId, idSolicitud]);
    return result;
  } catch (error) {
    console.error('Error en servicio verificarDocumento:', error);
    throw error;
  }
};

// =====================================================
//  VISITA DOMICILIARIA - CORREGIDO
// =====================================================

exports.getVisitaDomiciliaria = async (idSolicitud) => {
  try {
    const query = `SELECT * FROM visitas_domiciliarias WHERE id_solicitud = ?`;
    const [visitas] = await db.query(query, [idSolicitud]);
    return visitas[0] || null;
  } catch (error) {
    console.error('Error en servicio getVisitaDomiciliaria:', error);
    throw error;
  }
};

exports.programarVisitaDomiciliaria = async (idSolicitud, { fecha_programada, observaciones }) => {
  try {
    const query = `
      INSERT INTO visitas_domiciliarias (id_solicitud, fecha_programada, observaciones, estado)
      VALUES (?, ?, ?, 'PROGRAMADA')
    `;
    const [result] = await db.query(query, [idSolicitud, fecha_programada, observaciones]);
    return { id: result.insertId, id_solicitud: idSolicitud, fecha_programada, observaciones, estado: 'PROGRAMADA' };
  } catch (error) {
    console.error('Error en servicio programarVisitaDomiciliaria:', error);
    throw error;
  }
};

exports.actualizarVisitaDomiciliaria = async (idSolicitud, { fecha_programada, fecha_realizada, estado, observaciones, resultado }) => {
  try {
    const query = `
      UPDATE visitas_domiciliarias 
      SET fecha_programada = ?, fecha_realizada = ?, estado = ?, observaciones = ?, resultado = ?
      WHERE id_solicitud = ?
    `;
    const [result] = await db.query(query, [fecha_programada, fecha_realizada, estado, observaciones, resultado, idSolicitud]);
    return result;
  } catch (error) {
    console.error('Error en servicio actualizarVisitaDomiciliaria:', error);
    throw error;
  }
};

// =====================================================
//  INFORMES - CORREGIDO
// =====================================================

exports.informeEstadistico = async () => {
  try {
    // Estadísticas básicas
    const queries = [
      'SELECT COUNT(*) as total_solicitudes FROM solicitudes',
      'SELECT COUNT(*) as solicitudes_pendientes FROM solicitudes WHERE estado = "PENDIENTE"',
      'SELECT COUNT(*) as solicitudes_aprobadas FROM solicitudes WHERE estado = "APROBADA"',
      'SELECT COUNT(*) as total_estudiantes FROM estudiantes'
    ];

    const resultados = {};
    
    for (let i = 0; i < queries.length; i++) {
      const [rows] = await db.query(queries[i]);
      const key = Object.keys(rows[0])[0];
      resultados[key] = rows[0][key];
    }

    return resultados;
  } catch (error) {
    console.error('Error en servicio informeEstadistico:', error);
    throw error;
  }
};

exports.informeDetallado = async ({ tipo, periodo } = {}) => {
  try {
    let query = '';
    const params = [];

    if (tipo === 'solicitudes') {
      query = `
        SELECT estado, COUNT(*) as cantidad, 
               DATE_FORMAT(fecha_creacion, '%Y-%m') as mes
        FROM solicitudes 
        WHERE 1=1
      `;
      
      if (periodo) {
        query += ' AND DATE_FORMAT(fecha_creacion, "%Y-%m") = ?';
        params.push(periodo);
      }
      
      query += ' GROUP BY estado, DATE_FORMAT(fecha_creacion, "%Y-%m")';
    }

    const [resultados] = await db.query(query, params);
    return resultados;
  } catch (error) {
    console.error('Error en servicio informeDetallado:', error);
    throw error;
  }
};

// =====================================================
//  APELACIONES - CORREGIDO
// =====================================================

exports.listApelaciones = async () => {
  try {
    const query = `
      SELECT a.*, s.codigo as codigo_solicitud 
      FROM apelaciones a 
      LEFT JOIN solicitudes s ON a.id_solicitud = s.id_solicitud 
      ORDER BY a.fecha DESC
    `;
    const [apelaciones] = await db.query(query);
    return apelaciones;
  } catch (error) {
    console.error('Error en servicio listApelaciones:', error);
    throw error;
  }
};

exports.getApelacion = async (id) => {
  try {
    const query = `SELECT * FROM apelaciones WHERE id_apelacion = ?`;
    const [apelaciones] = await db.query(query, [id]);
    return apelaciones[0] || null;
  } catch (error) {
    console.error('Error en servicio getApelacion:', error);
    throw error;
  }
};

exports.crearApelacion = async ({ id_solicitud, motivo }) => {
  try {
    const query = `
      INSERT INTO apelaciones (id_solicitud, motivo, fecha, estado)
      VALUES (?, ?, NOW(), 'PENDIENTE')
    `;
    const [result] = await db.query(query, [id_solicitud, motivo]);
    return { id: result.insertId, id_solicitud, motivo, estado: 'PENDIENTE' };
  } catch (error) {
    console.error('Error en servicio crearApelacion:', error);
    throw error;
  }
};

exports.resolverApelacion = async (id, { estado, resolucion }) => {
  try {
    const query = `
      UPDATE apelaciones 
      SET estado = ?, resolucion = ?, fecha_resolucion = NOW()
      WHERE id_apelacion = ?
    `;
    const [result] = await db.query(query, [estado, resolucion, id]);
    return result;
  } catch (error) {
    console.error('Error en servicio resolverApelacion:', error);
    throw error;
  }
};

// =====================================================
//  SUSPENSIÓN / REANUDACIÓN DE BECAS - CORREGIDO
// =====================================================

exports.suspenderBeca = async (id, { motivo, fecha_fin }) => {
  try {
    const query = `
      UPDATE becas 
      SET estado = 'SUSPENDIDA', motivo_suspension = ?, fecha_suspension = NOW(), fecha_fin_suspension = ?
      WHERE id_beca = ?
    `;
    const [result] = await db.query(query, [motivo, fecha_fin, id]);
    return result;
  } catch (error) {
    console.error('Error en servicio suspenderBeca:', error);
    throw error;
  }
};

exports.reanudarBeca = async (id) => {
  try {
    const query = `
      UPDATE becas 
      SET estado = 'ACTIVA', motivo_suspension = NULL, fecha_suspension = NULL, fecha_fin_suspension = NULL
      WHERE id_beca = ?
    `;
    const [result] = await db.query(query, [id]);
    return result;
  } catch (error) {
    console.error('Error en servicio reanudarBeca:', error);
    throw error;
  }
};

// =====================================================
//  CIERRE DE EXPEDIENTES - CORREGIDO
// =====================================================

exports.cerrarExpediente = async (id, { responsable, observaciones }) => {
  try {
    const query = `
      UPDATE solicitudes 
      SET estado = 'CERRADO', observaciones_cierre = ?, responsable_cierre = ?, fecha_cierre = NOW()
      WHERE id_solicitud = ?
    `;
    const [result] = await db.query(query, [observaciones, responsable, id]);
    return result;
  } catch (error) {
    console.error('Error en servicio cerrarExpediente:', error);
    throw error;
  }
};

module.exports = exports;