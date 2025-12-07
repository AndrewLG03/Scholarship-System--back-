// src/controllers/solicitud.controller.js
const { pool } = require('../config/database');
const { encryptData } = require('../utils/encryption');

exports.guardarSolicitudCompleta = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      primer_apellido, segundo_apellido, nombre, cedula, fecha_nacimiento,
      estado_civil, genero, correo, telefono, provincia, canton, distrito, direccion,
      colegio, tipo_institucion, beca_colegio, institucion_beca, monto_beca, posee_titulo, grado_aprobado,
      area, tipo_vivienda, condicion_vivienda, medio_adquisicion, servicios_basicos, 
      ocupacion_padre, ocupacion_madre, ingreso_total, egreso_total, desc_ingresos, desc_gastos,
      observaciones, firma, fecha_firma, id_usuario, rol
    } = req.body;

    // Mostrar datos recibidos para info_socioeconomica
    console.log('\n========== REQ.BODY PARA INFO_SOCIOECONOMICA ==========');
    console.log(JSON.stringify({
      id_solicitud: null, // Se genera automáticamente
      ocupacion_padre,
      ocupacion_madre,
      ingreso_total,
      egreso_total,
      tipo_vivienda,
      condicion_vivienda,
      servicios_basicos,
      observaciones
    }, null, 2));
    console.log('=====================================================\n');

    // Encriptar datos sensibles
    const cedulaEncriptada = encryptData(cedula);
    const correoEncriptado = encryptData(correo);
    const telefonoEncriptado = encryptData(telefono);
    
    // Encriptar datos de ingresos y egresos
    const ingresoEncriptado = encryptData(ingreso_total ? ingreso_total.toString() : null);
    const egresoEncriptado = encryptData(egreso_total ? egreso_total.toString() : null);

    console.log('[DEBUG] Guardando solicitud completa para usuario:', id_usuario);

    // 1. Guardar primero la información del aspirante (siempre)
    const [asp] = await connection.query(
      `INSERT INTO aspirantes
       (id_usuario, nombre, apellido1, apellido2, cedula,
        fecha_nacimiento, estado_civil, genero, correo, telefono,
        provincia, canton, distrito, direccion, fecha_registro, estado)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),'pendiente')`,
      [id_usuario, nombre, primer_apellido, segundo_apellido, cedulaEncriptada,
       fecha_nacimiento, estado_civil, genero, correoEncriptado, telefonoEncriptado,
       provincia, canton, distrito, direccion]
    );
    const idAspirante = asp.insertId;

    console.log('[DEBUG] id_aspirante creado:', idAspirante);

    // 2. Generar código de solicitud con formato SOL-XXXXX basado en ID del aspirante
    const codigoSolicitud = `SOL-${String(idAspirante).padStart(5, '0')}`;

    // 2.1 Obtener ID del tipo de beca "socioeconómica"
    const [tiposBecaResult] = await connection.query(
      `SELECT id_tipo_beca FROM tipos_beca WHERE LOWER(nombre) LIKE '%socioecon%' LIMIT 1`
    );
    const id_tipo_beca = tiposBecaResult.length > 0 ? tiposBecaResult[0].id_tipo_beca : null;

    console.log('[DEBUG] Código de solicitud generado:', codigoSolicitud);
    console.log('[DEBUG] ID tipo beca socioeconómica:', id_tipo_beca);

    // 3. Crear solicitud vinculada con el aspirante, incluyendo código y tipo de beca
    const [solicitudResult] = await connection.query(
      `INSERT INTO solicitudes (id_aspirante, codigo, estado, fecha_creacion, id_tipo_beca)
       VALUES (?, ?, ?, NOW(), ?)`,
      [idAspirante, codigoSolicitud, 'EN_EVALUACION', id_tipo_beca]
    );
    const id_solicitud = solicitudResult.insertId;

    console.log('[DEBUG] id_solicitud creado:', id_solicitud);

    // 4. Guardar información académica
    await connection.query(
      `INSERT INTO info_academica_aspirante 
       (id_solicitud, colegio, tipo_institucion, beca_colegio, institucion_beca, monto_beca, posee_titulo, grado_aprobado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_solicitud, colegio || null, tipo_institucion || null, beca_colegio || null, institucion_beca || null, monto_beca || null, posee_titulo || null, grado_aprobado || null]
    );

    // 5. Guardar información socioeconómica (con filtro de null)
    await connection.query(
      `INSERT INTO info_socioeconomica 
       (id_solicitud, ocupacion_padre, ocupacion_madre, ingreso_total, egreso_total, tipo_vivienda, condicion_vivienda, servicios_basicos, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_solicitud, ocupacion_padre || null, ocupacion_madre || null, ingresoEncriptado, egresoEncriptado, tipo_vivienda || null, condicion_vivienda || null, servicios_basicos || null, observaciones || null]
    );

    await connection.commit();
    
    res.json({ 
      ok: true, 
      mensaje: 'Solicitud guardada correctamente',
      id_solicitud: id_solicitud,
      id_aspirante: idAspirante,
      codigo: codigoSolicitud
    });

  } catch (err) {
    await connection.rollback();
    console.error('[ERROR GUARDANDO SOLICITUD]', err);
    res.status(500).json({ ok: false, error: 'Error al guardar la solicitud' });
  } finally {
    connection.release();
  }
};
//subir documento complementario
exports.subirDocumento = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const idSolicitud = req.params.id;
    const archivo = req.file;
    const { id_documento } = req.body;

    if (!archivo) {
      return res.status(400).json({ ok: false, msg: 'No se envió ningún archivo' });
    }

    if (!id_documento) {
      return res.status(400).json({ ok: false, msg: 'Debe indicar id_documento' });
    }

    await connection.query(
      `INSERT INTO solicitud_docs (id_solicitud, id_documento, url_archivo, valido)
       VALUES (?, ?, ?, 'SI')`,
      [idSolicitud, id_documento, archivo.filename]
    );

    res.json({
      ok: true,
      msg: 'Documento cargado correctamente',
      archivo: archivo.filename
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: 'Error al subir documento' });
  } finally {
    connection.release();
  }
};

//obtener documentos
exports.obtenerDocumentos = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const idSolicitud = req.params.id;

    const [docs] = await connection.query(
      `SELECT 
          d.id_documento,
          d.codigo,
          d.nombre,
          d.obligatorio,
          sd.id_solicitud_doc,
          sd.url_archivo,
          sd.valido
       FROM documentos d
       LEFT JOIN solicitud_docs sd
         ON sd.id_documento = d.id_documento
        AND sd.id_solicitud = ?
       ORDER BY d.id_documento`,
      [idSolicitud]
    );

    res.json({ ok: true, documentos: docs });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: 'Error al obtener documentos' });
  } finally {
    connection.release();
  }
};

exports.eliminarDocumento = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { idSolicitud, idDoc } = req.params;

    // Verificar si existe
    const [rows] = await connection.query(
      `SELECT * FROM solicitud_docs 
       WHERE id_solicitud = ? AND id_documento = ?`,
      [idSolicitud, idDoc]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "El documento no existe o no pertenece a esta solicitud"
      });
    }

    // Eliminar registro
    await connection.query(
      `DELETE FROM solicitud_docs 
       WHERE id_solicitud = ? AND id_documento = ?`,
      [idSolicitud, idDoc]
    );

    return res.json({
      ok: true,
      msg: "Documento eliminado correctamente"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      msg: "Error al eliminar documento"
    });
  } finally {
    connection.release();
  }
};

// Paso 1: Información Personal
exports.guardarPaso1 = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const {
      id_usuario, primer_apellido, segundo_apellido, nombre, cedula, fecha_nacimiento,
      estado_civil, genero, correo, telefono, provincia, canton, distrito, direccion
    } = req.body;

    // Encriptar datos sensibles
    const cedulaEncriptada = encryptData(cedula);
    const correoEncriptado = encryptData(correo);
    const telefonoEncriptado = encryptData(telefono);

    // Guardar información del aspirante
    const [asp] = await connection.query(
      `INSERT INTO aspirantes
       (id_usuario, nombre, apellido1, apellido2, cedula,
        fecha_nacimiento, estado_civil, genero, correo, telefono,
        provincia, canton, distrito, direccion, fecha_registro, estado)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),'pendiente')`,
      [id_usuario, nombre, primer_apellido, segundo_apellido, cedulaEncriptada,
       fecha_nacimiento, estado_civil, genero, correoEncriptado, telefonoEncriptado,
       provincia, canton, distrito, direccion]
    );
    const idAspirante = asp.insertId;

    // Crear solicitud vinculada
    const [solicitudResult] = await connection.query(
      `INSERT INTO solicitudes (id_aspirante, estado, fecha_creacion)
       VALUES (?, ?, NOW())`,
      [idAspirante, 'EN_EVALUACION']
    );
    const id_solicitud = solicitudResult.insertId;

    res.json({
      ok: true,
      mensaje: 'Paso 1 guardado correctamente',
      id_solicitud: id_solicitud,
      id_aspirante: idAspirante
    });

  } catch (err) {
    console.error('[ERROR GUARDANDO PASO 1]', err);
    res.status(500).json({ ok: false, error: 'Error al guardar paso 1' });
  } finally {
    connection.release();
  }
};

// Paso 2: Información Académica
exports.guardarPaso2 = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      id_solicitud, colegio, tipo_institucion, beca_colegio, institucion_beca, monto_beca, posee_titulo, grado_aprobado
    } = req.body;

    await connection.query(
      `INSERT INTO info_academica_aspirante 
       (id_solicitud, colegio, tipo_institucion, beca_colegio, institucion_beca, monto_beca, posee_titulo, grado_aprobado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_solicitud, colegio, tipo_institucion, beca_colegio, institucion_beca, monto_beca || null, posee_titulo, grado_aprobado || null]
    );

    res.json({
      ok: true,
      mensaje: 'Paso 2 guardado correctamente',
      id_solicitud: id_solicitud
    });

  } catch (err) {
    console.error('[ERROR GUARDANDO PASO 2]', err);
    res.status(500).json({ ok: false, error: 'Error al guardar paso 2' });
  } finally {
    connection.release();
  }
};

// Paso 3: Información de Vivienda y Servicios
exports.guardarPaso3 = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    console.log('[DEBUG BACKEND] Paso 3 - REQ.BODY COMPLETO:', JSON.stringify(req.body, null, 2));
    
    const { id_solicitud, area, tipo_vivienda, condicion_vivienda, medio_adquisicion, servicios_basicos } = req.body;

    console.log('[DEBUG BACKEND] Paso 3 - Datos desestructurados:', { id_solicitud, area, tipo_vivienda, condicion_vivienda, servicios_basicos });
    console.log('[DEBUG BACKEND] Paso 3 - Valores nulos/vacíos detectados:', { 
      tipo_vivienda_is_null: tipo_vivienda === null || tipo_vivienda === undefined,
      condicion_vivienda_is_null: condicion_vivienda === null || condicion_vivienda === undefined,
      servicios_basicos_is_null: servicios_basicos === null || servicios_basicos === undefined
    });

    // Verificar si ya existe información socioeconómica
    const [existing] = await connection.query(
      `SELECT * FROM info_socioeconomica WHERE id_solicitud = ?`,
      [id_solicitud]
    );

    if (existing.length > 0) {
      // Actualizar
      await connection.query(
        `UPDATE info_socioeconomica 
         SET tipo_vivienda = ?, condicion_vivienda = ?, servicios_basicos = ?
         WHERE id_solicitud = ?`,
        [tipo_vivienda || '', condicion_vivienda || '', servicios_basicos || '', id_solicitud]
      );
    } else {
      // Crear
      await connection.query(
        `INSERT INTO info_socioeconomica 
         (id_solicitud, tipo_vivienda, condicion_vivienda, servicios_basicos)
         VALUES (?, ?, ?, ?)`,
        [id_solicitud, tipo_vivienda || '', condicion_vivienda || '', servicios_basicos || '']
      );
    }

    res.json({
      ok: true,
      mensaje: 'Paso 3 guardado correctamente',
      id_solicitud: id_solicitud
    });

  } catch (err) {
    console.error('[ERROR GUARDANDO PASO 3]', err);
    res.status(500).json({ ok: false, error: 'Error al guardar paso 3' });
  } finally {
    connection.release();
  }
};

// Paso 4: Información de Ocupaciones
exports.guardarPaso4 = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    console.log('[DEBUG BACKEND] Paso 4 - REQ.BODY COMPLETO:', JSON.stringify(req.body, null, 2));
    
    const { id_solicitud, ocupacion_padre, ocupacion_madre } = req.body;

    console.log('[DEBUG BACKEND] Paso 4 - Datos desestructurados:', { id_solicitud, ocupacion_padre, ocupacion_madre });
    console.log('[DEBUG BACKEND] Paso 4 - Tipo de ocupacion_padre:', typeof ocupacion_padre, '| Valor:', ocupacion_padre);
    console.log('[DEBUG BACKEND] Paso 4 - Tipo de ocupacion_madre:', typeof ocupacion_madre, '| Valor:', ocupacion_madre);

    // Verificar si ya existe información socioeconómica
    const [existing] = await connection.query(
      `SELECT * FROM info_socioeconomica WHERE id_solicitud = ?`,
      [id_solicitud]
    );

    if (existing.length > 0) {
      // Actualizar
      await connection.query(
        `UPDATE info_socioeconomica 
         SET ocupacion_padre = ?, ocupacion_madre = ?
         WHERE id_solicitud = ?`,
        [ocupacion_padre || null, ocupacion_madre || null, id_solicitud]
      );
    } else {
      // Crear
      await connection.query(
        `INSERT INTO info_socioeconomica 
         (id_solicitud, ocupacion_padre, ocupacion_madre)
         VALUES (?, ?, ?)`,
        [id_solicitud, ocupacion_padre || null, ocupacion_madre || null]
      );
    }

    res.json({
      ok: true,
      mensaje: 'Paso 4 guardado correctamente',
      id_solicitud: id_solicitud
    });

  } catch (err) {
    console.error('[ERROR GUARDANDO PASO 4]', err);
    res.status(500).json({ ok: false, error: 'Error al guardar paso 4' });
  } finally {
    connection.release();
  }
};

// Paso 5: Información de Ingresos y Egresos
exports.guardarPaso5 = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    console.log('[DEBUG BACKEND] Paso 5 - REQ.BODY COMPLETO:', JSON.stringify(req.body, null, 2));
    
    const { id_solicitud, ingreso_total, egreso_total, desc_ingresos, desc_gastos } = req.body;

    console.log('[DEBUG BACKEND] Paso 5 - Datos desestructurados:', { id_solicitud, ingreso_total, egreso_total, desc_ingresos });
    console.log('[DEBUG BACKEND] Paso 5 - Tipos de datos:', {
      ingreso_total_type: typeof ingreso_total,
      egreso_total_type: typeof egreso_total,
      ingreso_es_null: ingreso_total === null || ingreso_total === undefined,
      egreso_es_null: egreso_total === null || egreso_total === undefined
    });
    const ingresoEncriptado = encryptData(ingreso_total ? ingreso_total.toString() : null);
    const egresoEncriptado = encryptData(egreso_total ? egreso_total.toString() : null);

    // Verificar si ya existe información socioeconómica
    const [existing] = await connection.query(
      `SELECT * FROM info_socioeconomica WHERE id_solicitud = ?`,
      [id_solicitud]
    );

    if (existing.length > 0) {
      // Actualizar
      await connection.query(
        `UPDATE info_socioeconomica 
         SET ingreso_total = ?, egreso_total = ?, observaciones = ?
         WHERE id_solicitud = ?`,
        [ingresoEncriptado, egresoEncriptado, desc_ingresos || null, id_solicitud]
      );
    } else {
      // Crear
      await connection.query(
        `INSERT INTO info_socioeconomica 
         (id_solicitud, ingreso_total, egreso_total, observaciones)
         VALUES (?, ?, ?, ?)`,
        [id_solicitud, ingresoEncriptado, egresoEncriptado, desc_ingresos || null]
      );
    }

    res.json({
      ok: true,
      mensaje: 'Paso 5 guardado correctamente',
      id_solicitud: id_solicitud
    });

  } catch (err) {
    console.error('[ERROR GUARDANDO PASO 5]', err);
    res.status(500).json({ ok: false, error: 'Error al guardar paso 5' });
  } finally {
    connection.release();
  }
};

// Paso 6: Observaciones
exports.guardarPaso6 = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id_solicitud, observaciones } = req.body;

    // Verificar si ya existe información socioeconómica
    const [existing] = await connection.query(
      `SELECT * FROM info_socioeconomica WHERE id_solicitud = ?`,
      [id_solicitud]
    );

    if (existing.length > 0) {
      // Actualizar
      await connection.query(
        `UPDATE info_socioeconomica 
         SET observaciones = ?
         WHERE id_solicitud = ?`,
        [observaciones || null, id_solicitud]
      );
    }

    res.json({
      ok: true,
      mensaje: 'Paso 6 guardado correctamente',
      id_solicitud: id_solicitud
    });

  } catch (err) {
    console.error('[ERROR GUARDANDO PASO 6]', err);
    res.status(500).json({ ok: false, error: 'Error al guardar paso 6' });
  } finally {
    connection.release();
  }
};

// Paso 7: Firma
exports.guardarPaso7 = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id_solicitud, firma, fecha_firma } = req.body;

    // Actualizar estado de solicitud a completada
    await connection.query(
      `UPDATE solicitudes 
       SET estado = 'COMPLETADA'
       WHERE id = ?`,
      [id_solicitud]
    );

    res.json({
      ok: true,
      mensaje: 'Solicitud completada correctamente',
      id_solicitud: id_solicitud
    });

  } catch (err) {
    console.error('[ERROR GUARDANDO PASO 7]', err);
    res.status(500).json({ ok: false, error: 'Error al guardar paso 7' });
  } finally {
    connection.release();
  }
};

/* ============================================================
   🔵 OBTENER SOLICITUDES DEL USUARIO AUTENTICADO
   ============================================================ */
exports.obtenerSolicitudesUsuario = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ ok: false, msg: "Usuario no autenticado." });
    }

    console.log('\n========== OBTENER SOLICITUDES ==========');
    console.log('[DEBUG] userId:', userId);

    // Obtener solicitudes del usuario
    const [solicitudes] = await connection.query(
      `
      SELECT 
        s.id_solicitud,
        s.codigo,
        s.estado,
        DATE_FORMAT(s.fecha_creacion, '%Y-%m-%d') AS fecha_creacion,
        s.id_tipo_beca,
        s.id_aspirante,
        a.id_usuario
      FROM solicitudes s
      JOIN aspirantes a ON s.id_aspirante = a.id_aspirante
      WHERE a.id_usuario = ?
      ORDER BY s.fecha_creacion DESC
      `,
      [userId]
    );

    console.log('[DEBUG] Solicitudes encontradas:', solicitudes.length);
    if (solicitudes.length > 0) {
      console.log('[DEBUG] Primeras 3 solicitudes:');
      solicitudes.slice(0, 3).forEach((s, idx) => {
        console.log(`  [${idx + 1}] ID: ${s.id_solicitud}, Código: ${s.codigo}, Estado: ${s.estado}`);
      });
    }
    console.log('=========================================\n');

    res.json({ 
      ok: true, 
      solicitudes: solicitudes 
    });

  } catch (err) {
    console.error('[ERROR OBTENER SOLICITUDES]', err);
    res.status(500).json({ ok: false, msg: "Error al obtener solicitudes." });
  } finally {
    connection.release();
  }
};
