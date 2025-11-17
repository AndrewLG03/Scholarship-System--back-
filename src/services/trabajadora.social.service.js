// src/services/trabajadora.social.service.js
const { pool } = require('../config/database');

//
// ======================= TIPOS DE BECA =======================
//

const modalidadesPermitidas = [
  'SOCIOECONOMICA',
  'CULTURAL',
  'ACADEMICA',
  'DEPORTIVA'
];

exports.listTiposBeca = async () => {
  const [rows] = await pool.query(
    `SELECT id_tipo_beca, codigo, nombre, modalidad, tope_mensual
     FROM tipos_beca
     ORDER BY nombre`
  );
  return rows;
};

exports.createTipoBeca = async ({ codigo, nombre, modalidad, tope_mensual }) => {
  if (!nombre || !modalidad) {
    const err = new Error('nombre y modalidad son requeridos');
    err.status = 400;
    throw err;
  }

  const mod = String(modalidad).trim().toUpperCase();
  if (!modalidadesPermitidas.includes(mod)) {
    const err = new Error('modalidad inválida');
    err.status = 400;
    throw err;
  }

  const codFinal = codigo && codigo.trim() !== ''
    ? codigo.trim()
    : generarCodigoAutomatico(mod);

  const [result] = await pool.query(
    `INSERT INTO tipos_beca (codigo, nombre, modalidad, tope_mensual)
     VALUES (?, ?, ?, ?)`,
    [codFinal, nombre, mod, tope_mensual || null]
  );

  return {
    id_tipo_beca: result.insertId,
    codigo: codFinal,
    nombre,
    modalidad: mod,
    tope_mensual: tope_mensual || null
  };
};

exports.updateTipoBeca = async (idTipoBeca, { codigo, nombre, modalidad, tope_mensual }) => {
  const [rows] = await pool.query(
    'SELECT * FROM tipos_beca WHERE id_tipo_beca = ?',
    [idTipoBeca]
  );
  if (rows.length === 0) {
    const err = new Error('Tipo de beca no encontrado');
    err.status = 404;
    throw err;
  }

  const actual = rows[0];

  const mod = modalidad
    ? String(modalidad).trim().toUpperCase()
    : actual.modalidad;

  if (!modalidadesPermitidas.includes(mod)) {
    const err = new Error('modalidad inválida');
    err.status = 400;
    throw err;
  }

  const codFinal = (codigo && codigo.trim() !== '') ? codigo.trim() : actual.codigo;
  const nombreFinal = nombre || actual.nombre;
  const topeFinal = (tope_mensual !== undefined) ? tope_mensual : actual.tope_mensual;

  await pool.query(
    `UPDATE tipos_beca
     SET codigo = ?, nombre = ?, modalidad = ?, tope_mensual = ?
     WHERE id_tipo_beca = ?`,
    [codFinal, nombreFinal, mod, topeFinal, idTipoBeca]
  );

  return {
    id_tipo_beca: Number(idTipoBeca),
    codigo: codFinal,
    nombre: nombreFinal,
    modalidad: mod,
    tope_mensual: topeFinal
  };
};

exports.deleteTipoBeca = async (idTipoBeca) => {
  const [becaRows] = await pool.query(
    'SELECT COUNT(*) AS total FROM becas WHERE id_tipo_beca = ?',
    [idTipoBeca]
  );
  if (becaRows[0].total > 0) {
    const err = new Error('No se puede eliminar: el tipo de beca está en uso');
    err.status = 400;
    throw err;
  }

  await pool.query(
    'DELETE FROM tipos_beca WHERE id_tipo_beca = ?',
    [idTipoBeca]
  );
};

function generarCodigoAutomatico(modalidad) {
  const pref =
    modalidad === 'SOCIOECONOMICA' ? 'SOC' :
    modalidad === 'CULTURAL'       ? 'CUL' :
    modalidad === 'ACADEMICA'      ? 'ACA' :
    'DEP';
  const suf = Date.now().toString().slice(-4);
  return `${pref}-${suf}`;
}

//
// ======================= ASIGNACIÓN DE BECA A SOLICITUD =======================
//

exports.assignTipoBecaToSolicitud = async (
  idSolicitud,
  idTipoBeca,
  { valor, fecha_inicio, fecha_fin },
  idFuncionario
) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [solRows] = await conn.query(
      'SELECT id_solicitud FROM solicitudes WHERE id_solicitud = ?',
      [idSolicitud]
    );
    if (solRows.length === 0) {
      const err = new Error('La solicitud no existe');
      err.status = 404;
      throw err;
    }

    let valorFinal = valor;
    if (!valorFinal) {
      const [tipoRows] = await conn.query(
        'SELECT tope_mensual FROM tipos_beca WHERE id_tipo_beca = ?',
        [idTipoBeca]
      );
      if (tipoRows.length === 0) {
        const err = new Error('El tipo de beca no existe');
        err.status = 404;
        throw err;
      }
      valorFinal = tipoRows[0].tope_mensual || null;
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const fechaInicioFinal = fecha_inicio || hoy;
    const fechaFinFinal = fecha_fin || null;

    const [becaRows] = await conn.query(
      'SELECT id_beca FROM becas WHERE id_solicitud = ?',
      [idSolicitud]
    );

    let message;
    if (becaRows.length > 0) {
      const idBeca = becaRows[0].id_beca;
      await conn.query(
        `UPDATE becas
         SET id_tipo_beca = ?, valor = ?, fecha_inicio = ?, fecha_fin = ?
         WHERE id_beca = ?`,
        [idTipoBeca, valorFinal, fechaInicioFinal, fechaFinFinal, idBeca]
      );
      message = 'Tipo de beca actualizado para la solicitud.';
    } else {
      await conn.query(
        `INSERT INTO becas (
            id_solicitud,
            id_tipo_beca,
            valor,
            fecha_inicio,
            fecha_fin,
            estado
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        [idSolicitud, idTipoBeca, valorFinal, fechaInicioFinal, fechaFinFinal, 'PRE-ASIGNADA']
      );
      message = 'Tipo de beca asignado a la solicitud.';
    }
    await conn.commit();

    return {
      message,
      id_solicitud: Number(idSolicitud),
      id_tipo_beca: Number(idTipoBeca),
      valor: valorFinal,
      fecha_inicio: fechaInicioFinal,
      fecha_fin: fechaFinFinal,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

//
// ======================= CONVOCATORIAS =======================
//

exports.listConvocatorias = async () => {
  const [rows] = await pool.query(
    `SELECT c.id_convocatoria,
            c.nombre,
            c.fecha_inicio,
            c.fecha_cierre,
            c.estado,
            p.id_periodo,
            p.anio,
            p.ciclo,
            p.fecha_ini AS periodo_fecha_ini,
            p.fecha_fin AS periodo_fecha_fin
     FROM convocatorias c
     LEFT JOIN periodos p ON c.id_periodo = p.id_periodo
     ORDER BY p.anio DESC, p.ciclo DESC, c.id_convocatoria DESC`
  );

  return rows;
};

exports.cambiarEstadoConvocatoria = async (
  idConvocatoria,
  nuevoEstado,
  idFuncionario
) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM convocatorias WHERE id_convocatoria = ?',
      [idConvocatoria]
    );

    if (rows.length === 0) {
      const err = new Error('La convocatoria no existe');
      err.status = 404;
      throw err;
    }

    const conv = rows[0];
    const hoy = new Date().toISOString().slice(0, 10);

    let fechaInicio = conv.fecha_inicio;
    let fechaCierre = conv.fecha_cierre;

    if (nuevoEstado === 'ABIERTO' && !fechaInicio) {
      fechaInicio = hoy;
    }

    if (nuevoEstado === 'CERRADO' && !fechaCierre) {
      fechaCierre = hoy;
    }

    await conn.query(
      `UPDATE convocatorias
       SET estado = ?, fecha_inicio = ?, fecha_cierre = ?
       WHERE id_convocatoria = ?`,
      [nuevoEstado, fechaInicio, fechaCierre, idConvocatoria]
    );
    await conn.commit();

    return {
      message:
        nuevoEstado === 'ABIERTO'
          ? 'Convocatoria abierta para recepción de documentación.'
          : 'Convocatoria cerrada para recepción de documentación.',
      id_convocatoria: Number(idConvocatoria),
      estado: nuevoEstado,
      fecha_inicio: fechaInicio,
      fecha_cierre: fechaCierre,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

//
// ======================= ESTADOS DE SOLICITUD =======================
//

exports.actualizarEstadoSolicitud = async (idSolicitud, nuevoEstado, { responsable, observaciones }) => {
  const estadosPermitidos = [
    'CREADA',
    'EN_REVISION_TS',
    'EN_COMITE',
    'APROBADA',
    'DENEGADA',
    'CERRADA'
  ];

  if (!estadosPermitidos.includes(nuevoEstado)) {
    const err = new Error('Estado inválido');
    err.status = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [sol] = await conn.query(
      'SELECT id_solicitud FROM solicitudes WHERE id_solicitud = ?',
      [idSolicitud]
    );
    if (sol.length === 0) {
      const err = new Error('La solicitud no existe');
      err.status = 404;
      throw err;
    }

    await conn.query(
      'UPDATE solicitudes SET estado = ? WHERE id_solicitud = ?',
      [nuevoEstado, idSolicitud]
    );

    await conn.query(
      `INSERT INTO revisiones_admin (id_solicitud, responsable, fecha, observaciones)
       VALUES (?, ?, DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'), ?)`,
      [idSolicitud, responsable, observaciones || `Cambio de estado a ${nuevoEstado}`]
    );

    await conn.commit();

    return {
      message: 'Estado de la solicitud actualizado',
      id_solicitud: Number(idSolicitud),
      estado: nuevoEstado
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

//
// ======================= ANUNCIOS =======================
//

exports.listAnuncios = async () => {
  const [rows] = await pool.query(
    `SELECT a.id_anuncio,
            a.titulo,
            a.contenido,
            a.visible_para,
            a.fecha_publicacion,
            a.publicado_por,
            u.nombre AS publicado_por_nombre
     FROM anuncios a
     LEFT JOIN usuarios u ON a.publicado_por = u.id_usuario
     ORDER BY a.id_anuncio DESC`
  );
  return rows;
};

exports.createAnuncio = async ({ titulo, contenido, visible_para, publicado_por }) => {
  const [result] = await pool.query(
    `INSERT INTO anuncios (titulo, contenido, visible_para, publicado_por, fecha_publicacion)
     VALUES (?, ?, ?, ?, DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))`,
    [titulo, contenido, visible_para, publicado_por]
  );

  return {
    id_anuncio: result.insertId,
    titulo,
    contenido,
    visible_para,
    publicado_por,
  };
};

exports.updateAnuncio = async (idAnuncio, { titulo, contenido, visible_para }) => {
  await pool.query(
    `UPDATE anuncios
     SET titulo = ?, contenido = ?, visible_para = ?
     WHERE id_anuncio = ?`,
    [titulo, contenido, visible_para, idAnuncio]
  );

  const [rows] = await pool.query(
    `SELECT a.id_anuncio,
            a.titulo,
            a.contenido,
            a.visible_para,
            a.fecha_publicacion,
            a.publicado_por,
            u.nombre AS publicado_por_nombre
     FROM anuncios a
     LEFT JOIN usuarios u ON a.publicado_por = u.id_usuario
     WHERE a.id_anuncio = ?`,
    [idAnuncio]
  );

  return rows[0];
};

exports.deleteAnuncio = async (idAnuncio) => {
  await pool.query(
    'DELETE FROM anuncios WHERE id_anuncio = ?',
    [idAnuncio]
  );
};

//
// ======================= CONSULTAS =======================
//

exports.listConsultas = async () => {
  const [rows] = await pool.query(
    `SELECT c.id_consulta,
            c.id_usuario,
            c.asunto,
            c.mensaje,
            c.fecha,
            u.nombre,
            u.correo,
            EXISTS (
              SELECT 1
              FROM notificaciones n
              WHERE n.id_usuario = c.id_usuario
                AND n.tipo = 'RESPUESTA_CONSULTA'
                AND n.mensaje LIKE CONCAT('CONSULTA:', c.id_consulta, '|%')
            ) AS respondida
     FROM consultas c
     LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
     ORDER BY c.id_consulta DESC`
  );
  return rows;
};

exports.getConsulta = async (idConsulta) => {
  const [rows] = await pool.query(
    `SELECT c.id_consulta,
            c.id_usuario,
            c.asunto,
            c.mensaje,
            c.fecha,
            u.nombre,
            u.correo,
            EXISTS (
              SELECT 1
              FROM notificaciones n
              WHERE n.id_usuario = c.id_usuario
                AND n.tipo = 'RESPUESTA_CONSULTA'
                AND n.mensaje LIKE CONCAT('CONSULTA:', c.id_consulta, '|%')
            ) AS respondida
     FROM consultas c
     LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
     WHERE c.id_consulta = ?`,
    [idConsulta]
  );

  if (rows.length === 0) {
    const err = new Error('Consulta no encontrada');
    err.status = 404;
    throw err;
  }

  return rows[0];
};

exports.responderConsulta = async (idConsulta, respuesta, idFuncionario) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT c.id_consulta,
              c.id_usuario,
              c.asunto,
              c.mensaje,
              c.fecha,
              u.nombre,
              u.correo
       FROM consultas c
       LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
       WHERE c.id_consulta = ?`,
      [idConsulta]
    );

    if (rows.length === 0) {
      const err = new Error('Consulta no encontrada');
      err.status = 404;
      throw err;
    }

    const consulta = rows[0];

    const mensajeNoti =
      `CONSULTA:${consulta.id_consulta}|Respuesta a tu consulta "${consulta.asunto}": ${respuesta}`;

    await conn.query(
      `INSERT INTO notificaciones (id_usuario, tipo, mensaje)
       VALUES (?, 'RESPUESTA_CONSULTA', ?)`,
      [consulta.id_usuario, mensajeNoti]
    );

    await conn.commit();

    return {
      message: 'Consulta respondida y notificación enviada',
      id_consulta: consulta.id_consulta,
      id_usuario: consulta.id_usuario,
      respuesta,
      atendida_por: idFuncionario
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

//
// ======================= CHATBOT =======================
//

exports.listChatbotRespuestas = async () => {
  const [rows] = await pool.query(
    `SELECT id_respuesta, pregunta, respuesta, fecha_creacion
     FROM chatbot_respuestas
     ORDER BY id_respuesta DESC`
  );
  return rows;
};

exports.createChatbotRespuesta = async ({ pregunta, respuesta }) => {
  const [result] = await pool.query(
    `INSERT INTO chatbot_respuestas (pregunta, respuesta)
     VALUES (?, ?)`,
    [pregunta, respuesta]
  );

  return {
    id_respuesta: result.insertId,
    pregunta,
    respuesta,
  };
};

exports.updateChatbotRespuesta = async (idRespuesta, { pregunta, respuesta }) => {
  await pool.query(
    `UPDATE chatbot_respuestas
     SET pregunta = ?, respuesta = ?
     WHERE id_respuesta = ?`,
    [pregunta, respuesta, idRespuesta]
  );

  const [rows] = await pool.query(
    `SELECT id_respuesta, pregunta, respuesta, fecha_creacion
     FROM chatbot_respuestas
     WHERE id_respuesta = ?`,
    [idRespuesta]
  );

  return rows[0];
};

exports.deleteChatbotRespuesta = async (idRespuesta) => {
  await pool.query(
    'DELETE FROM chatbot_respuestas WHERE id_respuesta = ?',
    [idRespuesta]
  );
};

//
// ======================= APROBACIÓN / DENEGACIÓN DE SOLICITUD =======================
//

exports.aprobarSolicitud = async (idSolicitud, { motivo, id_sesion, evaluador }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [solRows] = await conn.query(
      'SELECT * FROM solicitudes WHERE id_solicitud = ?',
      [idSolicitud]
    );
    if (solRows.length === 0) {
      const err = new Error('Solicitud no encontrada');
      err.status = 404;
      throw err;
    }

    const [becaRows] = await conn.query(
      'SELECT * FROM becas WHERE id_solicitud = ?',
      [idSolicitud]
    );
    if (becaRows.length === 0) {
      const err = new Error('Debe asignar un tipo de beca antes de aprobar');
      err.status = 400;
      throw err;
    }

    const idBeca = becaRows[0].id_beca;

    await conn.query(
      'UPDATE becas SET estado = ? WHERE id_beca = ?',
      ['ACTIVA', idBeca]
    );

    await conn.query(
      'UPDATE solicitudes SET estado = ? WHERE id_solicitud = ?',
      ['APROBADA', idSolicitud]
    );

    await conn.query(
      `INSERT INTO resoluciones (id_solicitud, id_sesion, decision, motivo, fecha)
       VALUES (?, ?, 'APROBADA', ?, DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))`,
      [idSolicitud, id_sesion || null, motivo || `Aprobada por ${evaluador}`]
    );

    await conn.commit();

    return {
      message: 'Solicitud aprobada y beca activada',
      id_solicitud: Number(idSolicitud),
      id_beca: idBeca,
      estado_solicitud: 'APROBADA',
      estado_beca: 'ACTIVA',
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.denegarSolicitud = async (idSolicitud, { motivo, id_sesion, evaluador }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [solRows] = await conn.query(
      'SELECT * FROM solicitudes WHERE id_solicitud = ?',
      [idSolicitud]
    );
    if (solRows.length === 0) {
      const err = new Error('Solicitud no encontrada');
      err.status = 404;
      throw err;
    }

    const [becaRows] = await conn.query(
      'SELECT * FROM becas WHERE id_solicitud = ?',
      [idSolicitud]
    );
    if (becaRows.length > 0) {
      const idBeca = becaRows[0].id_beca;
      await conn.query(
        'UPDATE becas SET estado = ? WHERE id_beca = ?',
        ['DENEGADA', idBeca]
      );
    }

    await conn.query(
      'UPDATE solicitudes SET estado = ? WHERE id_solicitud = ?',
      ['DENEGADA', idSolicitud]
    );

    await conn.query(
      `INSERT INTO resoluciones (id_solicitud, id_sesion, decision, motivo, fecha)
       VALUES (?, ?, 'DENEGADA', ?, DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))`,
      [idSolicitud, id_sesion || null, motivo || `Denegada por ${evaluador}`]
    );

    await conn.commit();

    return {
      message: 'Solicitud denegada',
      id_solicitud: Number(idSolicitud),
      estado_solicitud: 'DENEGADA',
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

//
// ======================= VERIFICACIÓN DE DOCUMENTOS =======================
//

exports.listDocumentosSolicitud = async (idSolicitud) => {
  const [rows] = await pool.query(
    `SELECT sd.id_solicitud_doc,
            sd.id_solicitud,
            sd.id_documento,
            d.codigo,
            d.nombre,
            d.obligatorio,
            sd.url_archivo,
            sd.valido
     FROM solicitud_docs sd
     JOIN documentos d ON sd.id_documento = d.id_documento
     WHERE sd.id_solicitud = ?
     ORDER BY d.nombre`,
    [idSolicitud]
  );
  return rows;
};

exports.verificarDocumento = async (idSolicitud, idDocumento, validoRaw) => {
  const valido = String(validoRaw || '').trim().toUpperCase();

  if (!['SI', 'NO'].includes(valido)) {
    const err = new Error("Valor 'valido' debe ser 'SI' o 'NO'");
    err.status = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [sol] = await conn.query(
      'SELECT id_solicitud FROM solicitudes WHERE id_solicitud = ?',
      [idSolicitud]
    );
    if (sol.length === 0) {
      const err = new Error('Solicitud no encontrada');
      err.status = 404;
      throw err;
    }

    const [sdRows] = await conn.query(
      `SELECT id_solicitud_doc
       FROM solicitud_docs
       WHERE id_solicitud = ? AND id_documento = ?`,
      [idSolicitud, idDocumento]
    );
    if (sdRows.length === 0) {
      const err = new Error('Documento no asociado a la solicitud');
      err.status = 404;
      throw err;
    }

    const idSolicitudDoc = sdRows[0].id_solicitud_doc;

    await conn.query(
      'UPDATE solicitud_docs SET valido = ? WHERE id_solicitud_doc = ?',
      [valido, idSolicitudDoc]
    );

    const [detalle] = await conn.query(
      `SELECT sd.id_solicitud_doc,
              sd.id_solicitud,
              sd.id_documento,
              d.codigo,
              d.nombre,
              d.obligatorio,
              sd.url_archivo,
              sd.valido
       FROM solicitud_docs sd
       JOIN documentos d ON sd.id_documento = d.id_documento
       WHERE sd.id_solicitud_doc = ?`,
      [idSolicitudDoc]
    );

    await conn.commit();

    return {
      message: 'Documento verificado',
      documento: detalle[0],
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

//
// ======================= VISITAS DOMICILIARIAS =======================
//

exports.getVisitaDomiciliaria = async (idSolicitud) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM visitas_domiciliarias
     WHERE id_solicitud = ?
     ORDER BY id_visita DESC
     LIMIT 1`,
    [idSolicitud]
  );
  return rows[0] || null;
};

exports.programarVisitaDomiciliaria = async (idSolicitud, { fecha_programada, observaciones }) => {
  const [sol] = await pool.query(
    'SELECT id_solicitud FROM solicitudes WHERE id_solicitud = ?',
    [idSolicitud]
  );

  if (sol.length === 0) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }

  const [result] = await pool.query(
    `INSERT INTO visitas_domiciliarias
       (id_solicitud, fecha_programada, estado, observaciones)
     VALUES (?, ?, 'PENDIENTE', ?)`,
    [idSolicitud, fecha_programada, observaciones]
  );

  return {
    id_visita: result.insertId,
    id_solicitud: Number(idSolicitud),
    fecha_programada,
    estado: 'PENDIENTE',
    observaciones,
  };
};

exports.actualizarVisitaDomiciliaria = async (
  idSolicitud,
  { fecha_programada, fecha_realizada, estado, observaciones, resultado }
) => {
  const estadosPermitidos = ['PENDIENTE', 'REALIZADA', 'CANCELADA'];

  if (estado && !estadosPermitidos.includes(estado.toUpperCase())) {
    const err = new Error('Estado inválido');
    err.status = 400;
    throw err;
  }

  const [rows] = await pool.query(
    `SELECT *
     FROM visitas_domiciliarias
     WHERE id_solicitud = ?
     ORDER BY id_visita DESC
     LIMIT 1`,
    [idSolicitud]
  );

  if (rows.length === 0) {
    const err = new Error('No hay visita programada');
    err.status = 404;
    throw err;
  }

  const actual = rows[0];

  await pool.query(
    `UPDATE visitas_domiciliarias
     SET fecha_programada = ?,
         fecha_realizada = ?,
         estado = ?,
         observaciones = ?,
         resultado = ?
     WHERE id_visita = ?`,
    [
      fecha_programada || actual.fecha_programada,
      fecha_realizada || actual.fecha_realizada,
      estado || actual.estado,
      observaciones || actual.observaciones,
      resultado || actual.resultado,
      actual.id_visita
    ]
  );

  return {
    id_visita: actual.id_visita,
    id_solicitud: Number(idSolicitud),
    fecha_programada: fecha_programada || actual.fecha_programada,
    fecha_realizada: fecha_realizada || actual.fecha_realizada,
    estado: estado || actual.estado,
    observaciones: observaciones || actual.observaciones,
    resultado: resultado || actual.resultado
  };
};

//
// ======================= INFORMES =======================
//

exports.informeEstadistico = async () => {
  const [resumen] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM solicitudes) AS total_solicitudes,
       (SELECT COUNT(*) FROM solicitudes WHERE estado = 'APROBADA') AS solicitudes_aprobadas,
       (SELECT COUNT(*) FROM solicitudes WHERE estado = 'DENEGADA') AS solicitudes_denegadas,
       (SELECT COUNT(*) FROM becas WHERE estado = 'ACTIVA') AS becas_activas,
       (SELECT COUNT(*) FROM becas WHERE estado = 'SUSPENDIDA') AS becas_suspendidas,
       (SELECT COALESCE(SUM(monto+0),0) FROM desembolsos) AS total_desembolsado
     FROM dual`
  );

  const [porModalidad] = await pool.query(
    `SELECT tb.modalidad,
            COUNT(*) AS total_becas,
            COALESCE(SUM(b.valor+0),0) AS monto_asignado
     FROM becas b
     JOIN tipos_beca tb ON b.id_tipo_beca = tb.id_tipo_beca
     GROUP BY tb.modalidad`
  );

  return {
    resumen: resumen[0],
    por_modalidad: porModalidad
  };
};

exports.informeDetallado = async ({ tipo, periodo }) => {
  const t = (tipo || '').toLowerCase();

  if (!t) {
    const err = new Error('tipo de informe requerido');
    err.status = 400;
    throw err;
  }

  switch (t) {
    case 'becas_activas': {
      const [rows] = await pool.query(
        `SELECT b.id_beca,
                b.valor,
                b.estado,
                e.id_estudiante,
                e.carnet,
                e.carrera,
                tb.nombre AS tipo_beca
         FROM becas b
         JOIN solicitudes s ON b.id_solicitud = s.id_solicitud
         JOIN estudiantes e ON s.id_estudiante = e.id_estudiante
         JOIN tipos_beca tb ON b.id_tipo_beca = tb.id_tipo_beca
         WHERE b.estado = 'ACTIVA'`
      );
      return { tipo: 'becas_activas', datos: rows };
    }

    case 'becas_por_periodo': {
      const idPeriodo = periodo || null;
      if (!idPeriodo) {
        const err = new Error('periodo requerido para este informe');
        err.status = 400;
        throw err;
      }

      const [rows] = await pool.query(
        `SELECT p.id_periodo,
                p.anio,
                p.ciclo,
                COUNT(DISTINCT b.id_beca) AS total_becas,
                COALESCE(SUM(d.monto+0),0) AS total_desembolsado
         FROM periodos p
         LEFT JOIN desembolsos d ON p.id_periodo = d.id_periodo
         LEFT JOIN becas b ON d.id_beca = b.id_beca
         WHERE p.id_periodo = ?
         GROUP BY p.id_periodo, p.anio, p.ciclo`,
        [idPeriodo]
      );
      return { tipo: 'becas_por_periodo', datos: rows };
    }

    case 'seguimiento': {
      const [rows] = await pool.query(
        `SELECT s.id_seguimiento,
                s.id_beca,
                s.id_periodo,
                s.promedio_verif,
                s.cumple,
                s.nota,
                b.estado AS estado_beca
         FROM seguimientos s
         JOIN becas b ON s.id_beca = b.id_beca`
      );
      return { tipo: 'seguimiento', datos: rows };
    }

    default: {
      const err = new Error('tipo de informe no soportado');
      err.status = 400;
      throw err;
    }
  }
};

//
// ======================= APELACIONES =======================
//

exports.listApelaciones = async () => {
  const [rows] = await pool.query(
    `SELECT a.*, s.estado AS estado_solicitud
     FROM apelaciones a
     JOIN solicitudes s ON a.id_solicitud = s.id_solicitud
     ORDER BY a.id_apelacion DESC`
  );
  return rows;
};

exports.getApelacion = async (idApelacion) => {
  const [rows] = await pool.query(
    `SELECT a.*, s.estado AS estado_solicitud
     FROM apelaciones a
     JOIN solicitudes s ON a.id_solicitud = s.id_solicitud
     WHERE a.id_apelacion = ?`,
    [idApelacion]
  );
  if (rows.length === 0) {
    const err = new Error('Apelación no encontrada');
    err.status = 404;
    throw err;
  }
  return rows[0];
};

exports.crearApelacion = async ({ id_solicitud, motivo }) => {
  const [sol] = await pool.query(
    'SELECT id_solicitud FROM solicitudes WHERE id_solicitud = ?',
    [id_solicitud]
  );
  if (sol.length === 0) {
    const err = new Error('Solicitud no encontrada');
    err.status = 404;
    throw err;
  }

  const [res] = await pool.query(
    `INSERT INTO apelaciones (id_solicitud, motivo, estado, fecha)
     VALUES (?, ?, 'PENDIENTE', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))`,
    [id_solicitud, motivo]
  );

  return {
    id_apelacion: res.insertId,
    id_solicitud,
    motivo,
    estado: 'PENDIENTE',
  };
};

exports.resolverApelacion = async (idApelacion, { estado, resolucion }) => {
  const est = (estado || '').toUpperCase();
  if (!['ACEPTADA', 'RECHAZADA'].includes(est)) {
    const err = new Error('Estado de apelación inválido');
    err.status = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM apelaciones WHERE id_apelacion = ?',
      [idApelacion]
    );
    if (rows.length === 0) {
      const err = new Error('Apelación no encontrada');
      err.status = 404;
      throw err;
    }
    const ap = rows[0];

    await conn.query(
      `UPDATE apelaciones
       SET estado = ?, resolucion = ?
       WHERE id_apelacion = ?`,
      [est, resolucion || null, idApelacion]
    );

    if (est === 'ACEPTADA') {
      await conn.query(
        `UPDATE solicitudes
         SET estado = 'APROBADA'
         WHERE id_solicitud = ?`,
        [ap.id_solicitud]
      );
    }

    await conn.commit();

    return {
      id_apelacion: idApelacion,
      id_solicitud: ap.id_solicitud,
      estado: est,
      resolucion: resolucion || null,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

//
// ======================= SUSPENSIÓN / REANUDACIÓN DE BECAS =======================
//

exports.suspenderBeca = async (idBeca, { motivo, fecha_fin }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [bRows] = await conn.query(
      'SELECT * FROM becas WHERE id_beca = ?',
      [idBeca]
    );
    if (bRows.length === 0) {
      const err = new Error('Beca no encontrada');
      err.status = 404;
      throw err;
    }

    const hoy = new Date().toISOString().slice(0, 10);

    await conn.query(
      `INSERT INTO suspensiones (id_beca, fecha_inicio, fecha_fin, motivo)
       VALUES (?, ?, ?, ?)`,
      [idBeca, hoy, fecha_fin || null, motivo || null]
    );

    await conn.query(
      'UPDATE becas SET estado = ? WHERE id_beca = ?',
      ['SUSPENDIDA', idBeca]
    );

    await conn.commit();

    return {
      message: 'Beca suspendida',
      id_beca: Number(idBeca),
      fecha_inicio: hoy,
      fecha_fin: fecha_fin || null,
      motivo: motivo || null
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.reanudarBeca = async (idBeca) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [bRows] = await conn.query(
      'SELECT * FROM becas WHERE id_beca = ?',
      [idBeca]
    );
    if (bRows.length === 0) {
      const err = new Error('Beca no encontrada');
      err.status = 404;
      throw err;
    }

    await conn.query(
      `UPDATE suspensiones
       SET fecha_fin = COALESCE(fecha_fin, DATE_FORMAT(NOW(), '%Y-%m-%d'))
       WHERE id_beca = ? AND fecha_fin IS NULL`,
      [idBeca]
    );

    await conn.query(
      'UPDATE becas SET estado = ? WHERE id_beca = ?',
      ['ACTIVA', idBeca]
    );

    await conn.commit();

    return {
      message: 'Beca reanudada',
      id_beca: Number(idBeca),
      estado: 'ACTIVA'
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

//
// ======================= CIERRE DE EXPEDIENTE =======================
//

exports.cerrarExpediente = async (idSolicitud, { responsable, observaciones }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [solRows] = await conn.query(
      'SELECT * FROM solicitudes WHERE id_solicitud = ?',
      [idSolicitud]
    );
    if (solRows.length === 0) {
      const err = new Error('Solicitud no encontrada');
      err.status = 404;
      throw err;
    }

    await conn.query(
      'UPDATE solicitudes SET estado = ? WHERE id_solicitud = ?',
      ['CERRADA', idSolicitud]
    );

    await conn.query(
      `UPDATE becas
       SET estado = 'FINALIZADA'
       WHERE id_solicitud = ? AND estado IN ('ACTIVA','SUSPENDIDA')`,
      [idSolicitud]
    );

    await conn.query(
      `INSERT INTO revisiones_admin (id_solicitud, responsable, fecha, observaciones)
       VALUES (?, ?, DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'), ?)`,

      [idSolicitud, responsable, observaciones || 'Cierre de expediente']
    );

    await conn.commit();

    return {
      message: 'Expediente cerrado',
      id_solicitud: Number(idSolicitud),
      estado: 'CERRADA'
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
