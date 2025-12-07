
const { pool } = require("../config/database");

// Helper para normalizar formatos de hora a TIME 'HH:MM:SS'
function normalizeTimeToSql(hora) {
  if (!hora && hora !== 0) return null;
  let s = String(hora).trim();
  // corregir errores comunes: letra O -> cero
  s = s.replace(/[Oo]/g, '0');
  // normalizar espacios y llevar a minúsculas para detectar am/pm
  s = s.replace(/\s+/g, ' ').toLowerCase();

  // Si contiene am/pm, convertir a 24h
  const ampmMatch = s.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*(am|pm)/i);
  if (ampmMatch) {
    const timePart = ampmMatch[1];
    const ampm = ampmMatch[2].toLowerCase();
    const parts = timePart.split(':');
    let hh = parseInt(parts[0].replace(/\D/g, ''), 10);
    const mm = (parts[1] || '00').replace(/\D/g, '').padStart(2, '0');
    const ss = (parts[2] || '00').replace(/\D/g, '').padStart(2, '0');
    if (isNaN(hh) || isNaN(parseInt(mm, 10))) return null;
    if (ampm === 'pm' && hh < 12) hh += 12;
    if (ampm === 'am' && hh === 12) hh = 0;
    return `${String(hh).padStart(2, '0')}:${mm}:${ss}`;
  }

  // Formato plain HH:MM o HH:MM:SS
  const parts = s.split(':');
  if (parts.length >= 2) {
    const hh = parseInt(parts[0].replace(/\D/g, ''), 10);
    const mm = (parts[1] || '00').replace(/\D/g, '').padStart(2, '0');
    const ss = (parts[2] || '00').replace(/\D/g, '').padStart(2, '0');
    if (isNaN(hh) || isNaN(parseInt(mm, 10))) return null;
    return `${String(hh).padStart(2, '0')}:${mm}:${ss}`;
  }

  // No se pudo parsear
  return null;
}

//  SESIONES DEL COMITÉ

// Crear nueva sesión
async function crearSesion(req, res) {
  try {
    const { fecha, hora, lugar, motivo } = req.body;

    if (!fecha) {
      return res.status(400).json({ message: "Debe enviar la fecha" });
    }

    // Normalizar/validar hora antes de insertar
    const horaSql = normalizeTimeToSql(hora);
    if (hora && horaSql === null) {
      return res.status(400).json({ message: 'Formato de hora inválido. Use HH:MM o HH:MM AM/PM.' });
    }

    // Insertar con hora/lugar si la tabla los contiene (después de aplicar ALTER TABLE)
    const [result] = await pool.query(
      `INSERT INTO sesiones_comite (fecha, hora, lugar, motivo, estado)
       VALUES (?, ?, ?, ?, 'ABIERTA')`,
      [fecha, horaSql || null, lugar || null, motivo || null]
    );

    const id_sesion = result && result.insertId ? result.insertId : null;

    res.json({ message: "Sesión creada correctamente", id_sesion, fecha, hora: hora || null, lugar: lugar || null, motivo, estado: 'ABIERTA' });
  } catch (error) {
    console.error("Error en crearSesion:", error);
    res.status(500).json({ message: "Error creando sesión" });
  }
}

// Obtener la próxima sesión ABIERTA
async function getProximaSesion(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id_sesion, fecha, hora, lugar, motivo, estado
       FROM sesiones_comite
       WHERE estado = 'ABIERTA'
       ORDER BY fecha ASC
       LIMIT 1`
    );

    res.json(rows[0] || null);
  } catch (error) {
    console.error("Error en getProximaSesion:", error);
    res.status(500).json({ message: "Error obteniendo próxima sesión" });
  }
}

// Listar todas las sesiones
async function listarSesiones(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id_sesion, fecha, hora, lugar, motivo, estado
       FROM sesiones_comite
       ORDER BY fecha DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("Error en listarSesiones:", error);
    res.status(500).json({ message: "Error listando sesiones" });
  }
}

// Actualizar sesión (hora, lugar, motivo, estado)
async function actualizarSesion(req, res) {
  try {
    const { id } = req.params;
    const { fecha, hora, lugar, motivo, estado } = req.body;

    // Validación básica
    if (!id) return res.status(400).json({ message: 'ID de sesión requerido' });

    // Normalizar hora de actualización
    const horaSql = normalizeTimeToSql(hora);
    if (hora && horaSql === null) {
      return res.status(400).json({ message: 'Formato de hora inválido. Use HH:MM o HH:MM AM/PM.' });
    }

    await pool.query(
      `UPDATE sesiones_comite SET fecha = ?, hora = ?, lugar = ?, motivo = ?, estado = ? WHERE id_sesion = ?`,
      [fecha || null, horaSql || null, lugar || null, motivo || null, estado || null, id]
    );

    // Devolver la sesión actualizada
    const [rows] = await pool.query(`SELECT id_sesion, fecha, hora, lugar, motivo, estado FROM sesiones_comite WHERE id_sesion = ?`, [id]);
    return res.json(rows[0] || null);
  } catch (error) {
    console.error('Error en actualizarSesion:', error);
    res.status(500).json({ message: 'Error actualizando sesión', error: error.message });
  }
}

// Eliminar sesión
async function eliminarSesion(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID de sesión requerido' });

    // Primero, eliminar todas las resoluciones asociadas a esta sesión
    await pool.query(`DELETE FROM resoluciones WHERE id_sesion = ?`, [id]);
    console.log(`✓ Resoluciones eliminadas para sesión ${id}`);

    // Luego, eliminar la sesión
    await pool.query(`DELETE FROM sesiones_comite WHERE id_sesion = ?`, [id]);
    console.log(`✓ Sesión ${id} eliminada`);

    res.json({ message: 'Sesión y sus resoluciones eliminadas correctamente' });
  } catch (error) {
    console.error('Error en eliminarSesion:', error);
    res.status(500).json({ message: 'Error eliminando sesión', error: error.message });
  }
}



// ===============================
//  SOLICITUDES PENDIENTES 
// ===============================
async function getSolicitudesPendientes(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        s.id_solicitud,
        s.codigo,
        s.estado,
        s.fecha_creacion,
        s.total,
        s.nota_acad,
        s.nota_socio,

        s.id_aspirante,
        COALESCE(ap.nombre, '') AS estudiante,
        COALESCE(ap.cedula, '') AS cedula,
        COALESCE(ap.correo, '') AS correo,

        COALESCE(tb.nombre, '') AS tipo_beca

      FROM solicitudes s

      LEFT JOIN aspirantes ap
        ON ap.id_aspirante = s.id_aspirante

      LEFT JOIN tipos_beca tb
        ON tb.id_tipo_beca = s.id_tipo_beca

      WHERE s.estado IN ('Enviado', 'Revisión Comité', 'EN_EVALUACION')

      ORDER BY s.fecha_creacion DESC
    `);

    console.log(`getSolicitudesPendientes: retornando ${rows.length} filas`);
    return res.json(rows);

  } catch (error) {
    console.error("ERROR en getSolicitudesPendientes:", error);
    // Enviar mensaje detallado en desarrollo
    res.status(500).json({ message: "Error obteniendo solicitudes pendientes", error: error.message });
  }
}


// Expediente
// ===============================
//  EXPEDIENTE COMPLETO DE UNA SOLICITUD
// ===============================
async function getExpediente(req, res) {
  try {
    const { id } = req.params; // id_solicitud

    // 1. Solicitud + estudiante + tipo de beca
    const [[solicitud]] = await pool.query(`
      SELECT 
        s.id_solicitud,
        s.codigo,
        s.estado,
        s.nota_acad,
        s.nota_socio,
        s.total,
        s.fecha_creacion,
        s.id_aspirante,
        COALESCE(ap.nombre, '') AS estudiante,
        COALESCE(ap.cedula, '') AS cedula,
        COALESCE(ap.correo, '') AS correo,

        COALESCE(tb.nombre, '') AS tipo_beca

      FROM solicitudes s
      LEFT JOIN aspirantes ap ON ap.id_aspirante = s.id_aspirante
      LEFT JOIN tipos_beca tb ON tb.id_tipo_beca = s.id_tipo_beca
      WHERE s.id_solicitud = ?
    `, [id]);

    if (!solicitud) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    // 2. Documentos adjuntos
    const [documentos] = await pool.query(`
      SELECT 
        id_solicitud_doc,
        id_documento,
        url_archivo,
        valido
      FROM solicitud_docs
      WHERE id_solicitud = ?
    `, [id]);

    // 3. Información académica del aspirante
    const [[info_academica]] = await pool.query(`
      SELECT *
      FROM info_academica_aspirante
      WHERE id_solicitud = ?
    `, [id]);

    // 4. Información socioeconómica
    const [[info_socio]] = await pool.query(`
      SELECT *
      FROM info_socioeconomica
      WHERE id_solicitud = ?
    `, [id]);

    // Respuesta unificada
    res.json({
      solicitud,
      documentos,
      info_academica,
      info_socio
    });

  } catch (error) {
    console.error("Error en getExpediente:", error);
    res.status(500).json({ message: "Error obteniendo expediente" });
  }
}


// Aprobar solicitud
async function aprobarSolicitud(req, res) {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE solicitudes SET estado = 'APROBADA' WHERE id_solicitud = ?`,
      [id]
    );

    res.json({ message: "Solicitud aprobada correctamente" });
  } catch (error) {
    console.error("Error en aprobarSolicitud:", error);
    res.status(500).json({ message: "Error aprobando solicitud" });
  }
}

// Denegar solicitud
async function denegarSolicitud(req, res) {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE solicitudes SET estado = 'NO APROBADA' WHERE id_solicitud = ?`,
      [id]
    );

    res.json({ message: "Solicitud denegada correctamente" });
  } catch (error) {
    console.error("Error en denegarSolicitud:", error);
    res.status(500).json({ message: "Error denegando solicitud" });
  }
}

// Informe completo
async function generarInforme(req, res) {
  try {
    const [rows] = await pool.query(`SELECT * FROM solicitudes`);
    res.json(rows);
  } catch (error) {
    console.error("Error en generarInforme:", error);
    res.status(500).json({ message: "Error generando informe" });
  }
}


// 3. Solicitudes para el COMITÉ 
async function getSolicitudesComite(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id_solicitud AS id,
        codigo,
        estado,
        nota_socio,
        nota_acad,
        total,
        fecha_creacion
      FROM solicitudes
      WHERE estado IN ('EN_EVALUACION', 'APROBADA', 'NO APROBADA')
      ORDER BY fecha_creacion DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error en getSolicitudesComite:", error);
    res.status(500).json({ message: "Error obteniendo solicitudes" });
  }
}

//  HISTORIAL DEL COMITÉ  
async function getHistorialComite(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.id_sesion,
        s.fecha,
        s.estado,

        (SELECT COUNT(*) 
         FROM solicitudes 
         WHERE id_sesion = s.id_sesion) AS total_solicitudes,

        (SELECT COUNT(*) 
         FROM solicitudes 
         WHERE id_sesion = s.id_sesion
         AND estado = 'APROBADA') AS aprobadas,

        (SELECT COUNT(*) 
         FROM solicitudes 
         WHERE id_sesion = s.id_sesion
         AND estado = 'NO APROBADA') AS rechazadas

      FROM sesiones_comite s
      ORDER BY s.fecha DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error en getHistorialComite:", error);
    res.status(500).json({ message: "Error obteniendo historial del comité" });
  }
}

// Las funciones relacionadas al sistema de votación y registro de decisiones
// han sido eliminadas a petición: registrarDecision, guardarDecisionComite
// y obtenerHistorialDecisiones.

// ---------------------------------------------
// HISTORIAL DE DECISIONES DEL COMITÉ
// ---------------------------------------------
async function obtenerHistorialDecisiones(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        r.id_resolucion,
        r.id_solicitud,
        r.id_sesion,
        r.decision,
        r.motivo,
        DATE_FORMAT(r.fecha, '%Y-%m-%d %H:%i') AS fecha
      FROM resoluciones r
      ORDER BY r.fecha DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error("Error en historial de decisiones:", error);
    res.status(500).json({
      message: "Error obteniendo el historial de decisiones",
      error: error.message
    });
  }
}


// Registrar una resolución (decisión final) para una solicitud
async function registrarResolucion(req, res) {
  try {
    const { id } = req.params; // id_solicitud
    const { decision, motivo } = req.body;

    if (!id) return res.status(400).json({ message: 'ID de solicitud requerido' });
    if (!decision) return res.status(400).json({ message: 'Decision requerida' });

    // Insertar resolución (si se proporciona id_sesion, incluirlo)
    let insertResult;
    if (req.body.id_sesion) {
      const [r] = await pool.query(
        `INSERT INTO resoluciones (id_solicitud, id_sesion, decision, motivo, fecha)
         VALUES (?, ?, ?, ?, NOW())`,
        [id, req.body.id_sesion, decision, motivo || null]
      );
      insertResult = r;
    } else {
      const [r] = await pool.query(
        `INSERT INTO resoluciones (id_solicitud, decision, motivo, fecha)
         VALUES (?, ?, ?, NOW())`,
        [id, decision, motivo || null]
      );
      insertResult = r;
    }

    const id_resolucion = insertResult.insertId;

    // Actualizar estado de la solicitud según la decisión
    let nuevoEstado = null;
    if (decision.toUpperCase().includes('APROB')) nuevoEstado = 'APROBADA';
    else if (decision.toUpperCase().includes('RECH') || decision.toUpperCase().includes('NO APROB')) nuevoEstado = 'NO APROBADA';
    else nuevoEstado = decision;

    await pool.query(`UPDATE solicitudes SET estado = ? WHERE id_solicitud = ?`, [nuevoEstado, id]);

    // Devolver la resolución creada (join con solicitud para conveniencia)
    const [[row]] = await pool.query(`
      SELECT r.id_resolucion, r.id_sesion, r.id_solicitud, r.decision, r.motivo, DATE_FORMAT(r.fecha, '%Y-%m-%d %H:%i') AS fecha,
             s.codigo AS codigo_solicitud, s.total AS puntaje
      FROM resoluciones r
      INNER JOIN solicitudes s ON r.id_solicitud = s.id_solicitud
      WHERE r.id_resolucion = ?
    `, [id_resolucion]);

    res.json(row || { id_resolucion, id_solicitud: id });
  } catch (error) {
    console.error('Error en registrarResolucion:', error);
    res.status(500).json({ message: 'Error registrando resolución', error: error.message });
  }
}



// EXPORTACIÓN DE FUNCIONES
module.exports = {
  crearSesion,
  getProximaSesion,
  listarSesiones,
  actualizarSesion,
  eliminarSesion,
  getSolicitudesPendientes,
  getExpediente,
  aprobarSolicitud,
  denegarSolicitud,
  generarInforme,
  getSolicitudesComite,
  getHistorialComite,
  obtenerHistorialDecisiones
  ,
  registrarResolucion
};



