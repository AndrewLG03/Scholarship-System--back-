const { pool } = require('../config/database');


/* ============================================================
   🔵 OBTENER TODAS LAS APELACIONES DEL USUARIO AUTENTICADO
   ============================================================ */
exports.obtenerApelaciones = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ ok: false, msg: "Usuario no autenticado." });
    }

    // Obtener el ID del estudiante del usuario autenticado
    const [studentRows] = await connection.query(
      `SELECT id_estudiante FROM estudiantes WHERE id_usuario = ? LIMIT 1`,
      [userId]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ ok: false, msg: "No se encontró información de estudiante." });
    }

    const idEstudiante = studentRows[0].id_estudiante;

    // Obtener todas las apelaciones de las solicitudes del estudiante
    const [rows] = await connection.query(
      `
      SELECT 
        a.id_apelacion,
        a.id_solicitud,
        a.motivo,
        a.estado,
        DATE_FORMAT(a.fecha, '%Y-%m-%d') AS fecha,
        a.resolucion,
        s.id_estudiante
      FROM apelaciones a
      JOIN solicitudes s ON a.id_solicitud = s.id_solicitud
      WHERE s.id_estudiante = ?
      ORDER BY a.fecha DESC
      `,
      [idEstudiante]
    );

    res.json({ ok: true, apelaciones: rows });

  } catch (err) {
    console.error("ERROR obtener apelaciones:", err);
    res.status(500).json({ ok: false, msg: "Error al obtener apelaciones." });
  } finally {
    connection.release();
  }
};

/* ============================================================
   🔵 OBTENER APELACIONES DE UNA SOLICITUD ESPECÍFICA
   ============================================================ */
exports.obtenerApelacionesPorSolicitud = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user?.id;
    const { idSolicitud } = req.params;

    if (!userId) {
      return res.status(401).json({ ok: false, msg: "Usuario no autenticado." });
    }

    // Verificar que la solicitud pertenece al usuario autenticado
    const [solicitudRows] = await connection.query(
      `
      SELECT s.id_solicitud, s.id_estudiante, e.id_usuario
      FROM solicitudes s
      JOIN estudiantes e ON s.id_estudiante = e.id_estudiante
      WHERE s.id_solicitud = ? AND e.id_usuario = ?
      LIMIT 1
      `,
      [idSolicitud, userId]
    );

    if (solicitudRows.length === 0) {
      return res.status(403).json({
        ok: false,
        msg: "No tienes permiso para ver apelaciones en esta solicitud."
      });
    }

    // Obtener todas las apelaciones de esta solicitud
    const [rows] = await connection.query(
      `
      SELECT 
        a.id_apelacion,
        a.id_solicitud,
        a.motivo,
        a.estado,
        DATE_FORMAT(a.fecha, '%Y-%m-%d') AS fecha_apelacion,
        a.resolucion
      FROM apelaciones a
      WHERE a.id_solicitud = ?
      ORDER BY a.fecha DESC
      `,
      [idSolicitud]
    );

    res.json({ ok: true, apelaciones: rows });

  } catch (err) {
    console.error("ERROR obtener apelaciones por solicitud:", err);
    res.status(500).json({ ok: false, msg: "Error al obtener apelaciones." });
  } finally {
    connection.release();
  }
};

/* ============================================================
   🔵 CREAR UNA NUEVA APELACIÓN PARA EL USUARIO AUTENTICADO
   ============================================================ */
exports.crearApelacion = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user?.id;
    let { idSolicitud, motivo } = req.body;

    console.log('\n========== CREAR APELACIÓN ==========');
    console.log('[DEBUG] userId:', userId);
    console.log('[DEBUG] idSolicitud recibido:', idSolicitud);
    console.log('[DEBUG] motivo:', motivo);

    if (!userId) {
      return res.status(401).json({ ok: false, msg: "Usuario no autenticado." });
    }

    if (!motivo) {
      return res.status(400).json({
        ok: false,
        msg: "Se requiere el motivo de la apelación."
      });
    }

    if (motivo.trim().length < 10) {
      return res.status(400).json({
        ok: false,
        msg: "El motivo debe contener al menos 10 caracteres."
      });
    }

    // Si no se proporciona idSolicitud, obtener la más reciente del usuario
    if (!idSolicitud) {
      console.log('[DEBUG] Buscando solicitud del usuario...');
      
      const [aspiranteRows] = await connection.query(
        `SELECT id_aspirante FROM aspirantes WHERE id_usuario = ? LIMIT 1`,
        [userId]
      );

      console.log('[DEBUG] Aspirantes encontrados:', aspiranteRows.length);
      if (aspiranteRows.length > 0) {
        console.log('[DEBUG] id_aspirante:', aspiranteRows[0].id_aspirante);
      }

      if (aspiranteRows.length === 0) {
        return res.status(404).json({ ok: false, msg: "No se encontró información de aspirante." });
      }

      const idAspirante = aspiranteRows[0].id_aspirante;

      // Obtener la solicitud más reciente (preferiblemente rechazada)
      const [solicitudRows] = await connection.query(
        `
        SELECT id_solicitud FROM solicitudes 
        WHERE id_aspirante = ? 
        ORDER BY (estado = 'RECHAZADA') DESC, fecha_creacion DESC
        LIMIT 1
        `,
        [idAspirante]
      );

      console.log('[DEBUG] Solicitudes encontradas:', solicitudRows.length);
      if (solicitudRows.length > 0) {
        console.log('[DEBUG] id_solicitud encontrada:', solicitudRows[0].id_solicitud);
      }

      if (solicitudRows.length === 0) {
        return res.status(404).json({ ok: false, msg: "No tienes solicitudes registradas." });
      }

      idSolicitud = solicitudRows[0].id_solicitud;
    }

    // Verificar que la solicitud pertenece al usuario autenticado
    const [solicitudVerif] = await connection.query(
      `
      SELECT s.id_solicitud, s.id_aspirante, a.id_usuario
      FROM solicitudes s
      JOIN aspirantes a ON s.id_aspirante = a.id_aspirante
      WHERE s.id_solicitud = ? AND a.id_usuario = ?
      LIMIT 1
      `,
      [idSolicitud, userId]
    );

    console.log('[DEBUG] Verificación de solicitud:', solicitudVerif.length > 0 ? 'OK' : 'FALLO');

    if (solicitudVerif.length === 0) {
      return res.status(403).json({
        ok: false,
        msg: "No tienes permiso para crear una apelación en esta solicitud."
      });
    }

    // Verificar que no haya apelación hoy para esta solicitud
    const [existe] = await connection.query(
      `
      SELECT id_apelacion 
      FROM apelaciones 
      WHERE id_solicitud = ? 
      AND DATE(fecha) = CURDATE()
      `,
      [idSolicitud]
    );

    console.log('[DEBUG] Apelaciones de hoy:', existe.length);

    if (existe.length > 0) {
      return res.status(409).json({
        ok: false,
        msg: "Ya enviaste una apelación hoy para esta solicitud. Debes esperar hasta mañana."
      });
    }

    // Crear la apelación
    console.log('[DEBUG] Creando apelación con datos:');
    console.log('  - id_solicitud:', idSolicitud);
    console.log('  - motivo:', motivo);
    console.log('  - estado: PENDIENTE');
    console.log('  - fecha: NOW()');

    const [result] = await connection.query(
      `
      INSERT INTO apelaciones (id_solicitud, motivo, estado, fecha)
      VALUES (?, ?, 'PENDIENTE', NOW())
      `,
      [idSolicitud, motivo.trim()]
    );

    console.log('[DEBUG] ✅ Apelación creada exitosamente');
    console.log('[DEBUG] ID de apelación:', result.insertId);
    console.log('=====================================\n');

    res.json({
      ok: true,
      msg: "Apelación enviada correctamente.",
      idApelacion: result.insertId
    });

  } catch (err) {
    console.error("ERROR crear apelación:", err);
    res.status(500).json({ ok: false, msg: "Error al crear la apelación." });
  } finally {
    connection.release();
  }
};
