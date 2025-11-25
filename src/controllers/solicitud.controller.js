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
      area, condicion_vivienda, medio_adquisicion, ingreso_total, egreso_total, desc_ingresos, desc_gastos,
      firma, fecha_firma, id_usuario, rol
    } = req.body;

    // Encriptar datos sensibles
    const cedulaEncriptada = encryptData(cedula);
    const correoEncriptado = encryptData(correo);
    const telefonoEncriptado = encryptData(telefono);

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

    await connection.commit();
    res.json({ ok: true, mensaje: 'Solicitud guardada correctamente' });

  } catch (err) {
    await connection.rollback();
    console.error(err);
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
      `SELECT id_solicitud_doc, id_documento, url_archivo, valido
       FROM solicitud_docs
       WHERE id_solicitud = ?`,
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
