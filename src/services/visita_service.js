// =======================================
// VISITAS DOMICILIARIAS SERVICE
// =======================================
const db = require('../config/database');
const query = (...args) => db.pool.query(...args);

/* ================================
   LISTAR TODAS LAS VISITAS
================================ */
exports.listVisitas = async () => {
  const [rows] = await query(`
    SELECT 
      id_visita,
      id_solicitud,
      fecha_programada,
      fecha_realizada,
      estado,
      observaciones,
      resultado
    FROM visitas_domiciliarias
    ORDER BY id_visita DESC
  `);
  return rows;
};

/* ================================
   OBTENER UNA VISITA POR ID
================================ */
exports.getVisita = async (id) => {
  const [rows] = await query(
    `
    SELECT 
      id_visita,
      id_solicitud,
      fecha_programada,
      fecha_realizada,
      estado,
      observaciones,
      resultado
    FROM visitas_domiciliarias
    WHERE id_visita = ?
    `,
    [id]
  );
  return rows[0] || null;
};

/* ================================
   CREAR VISITA
================================ */
exports.createVisita = async ({
  id_solicitud,
  fecha_programada,
  fecha_realizada,
  estado,
  observaciones,
  resultado
}) => {
  const [result] = await query(
    `
    INSERT INTO visitas_domiciliarias
      (id_solicitud, fecha_programada, fecha_realizada, estado, observaciones, resultado)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      id_solicitud || null,
      fecha_programada || null,
      fecha_realizada || null,
      estado || null,
      observaciones || null,
      resultado || null
    ]
  );

  return { id: result.insertId };
};

/* ================================
   ACTUALIZAR VISITA
================================ */
exports.updateVisita = async (
  id,
  {
    id_solicitud,
    fecha_programada,
    fecha_realizada,
    estado,
    observaciones,
    resultado
  }
) => {
  const [result] = await query(
    `
    UPDATE visitas_domiciliarias
    SET
      id_solicitud = ?,
      fecha_programada = ?,
      fecha_realizada = ?,
      estado = ?,
      observaciones = ?,
      resultado = ?
    WHERE id_visita = ?
    `,
    [
      id_solicitud || null,
      fecha_programada || null,
      fecha_realizada || null,
      estado || null,
      observaciones || null,
      resultado || null,
      id
    ]
  );

  return { affectedRows: result.affectedRows };
};

/* ================================
   ELIMINAR VISITA
================================ */
exports.deleteVisita = async (id) => {
  const [result] = await query(
    `DELETE FROM visitas_domiciliarias WHERE id_visita = ?`,
    [id]
  );

  return { affectedRows: result.affectedRows };
};
