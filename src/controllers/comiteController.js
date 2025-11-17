import { pool } from "../config/database.js";

// Obtener solicitudes pendientes
export const getSolicitudesPendientes = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.tipo_beca, s.estado, s.created_at,
             e.nombre AS estudiante, e.email
      FROM solicitudes s
      JOIN estudiantes e ON e.id = s.estudiante_id
      WHERE s.estado = 'pendiente'
      ORDER BY s.created_at DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error al obtener las solicitudes pendientes" });
  }
};

// Ver expediente de una solicitud
export const getExpediente = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(`
      SELECT s.*, e.nombre AS estudiante, e.email, e.promedio
      FROM solicitudes s
      JOIN estudiantes e ON e.id = s.estudiante_id
      WHERE s.id = ?
    `, [id]);

    if (rows.length === 0)
      return res.status(404).json({ error: "Solicitud no encontrada" });

    res.json(rows[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error al obtener el expediente" });
  }
};

// Aprobar solicitud
export const aprobarSolicitud = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`
      UPDATE solicitudes
      SET estado = 'aprobada', revisado_por = ?, observaciones = 'Aprobada por comité'
      WHERE id = ?
    `, [req.user.id, id]);

    res.json({ message: "Solicitud aprobada exitosamente" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error al aprobar la solicitud" });
  }
};

// Denegar solicitud
export const denegarSolicitud = async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  try {
    await pool.query(`
      UPDATE solicitudes
      SET estado = 'denegada', revisado_por = ?, observaciones = ?
      WHERE id = ?
    `, [req.user.id, motivo || "Denegada por comité", id]);

    res.json({ message: "Solicitud denegada exitosamente" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error al denegar la solicitud" });
  }
};

// Informe del comité
export const generarInforme = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT estado, COUNT(*) AS total
      FROM solicitudes
      GROUP BY estado
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error al generar informe" });
  }
};

