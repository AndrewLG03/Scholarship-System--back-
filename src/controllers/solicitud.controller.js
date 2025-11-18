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
