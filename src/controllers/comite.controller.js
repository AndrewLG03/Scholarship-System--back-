// backend/src/controllers/comite.controller.js
const { pool } = require("../config/database");

// =====================================================
// 1. SESIONES DEL COMITÉ (TABLA REAL: sesiones_comite)
// =====================================================

// Crear nueva sesión
async function crearSesion(req, res) {
  try {
    const { fecha } = req.body;

    if (!fecha) {
      return res.status(400).json({ message: "Debe enviar la fecha" });
    }

    await pool.query(
      `INSERT INTO sesiones_comite (fecha, estado)
       VALUES (?, 'ABIERTA')`,
      [fecha]
    );

    res.json({ message: "Sesión creada correctamente" });
  } catch (error) {
    console.error("Error en crearSesion:", error);
    res.status(500).json({ message: "Error creando sesión" });
  }
}

// Obtener la próxima sesión ABIERTA
async function getProximaSesion(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id_sesion, fecha, estado
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

// Listar todas las sesiones (ABIERTAS + CERRADAS)
async function listarSesiones(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id_sesion, fecha, estado
       FROM sesiones_comite
       ORDER BY fecha DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("Error en listarSesiones:", error);
    res.status(500).json({ message: "Error listando sesiones" });
  }
}

// =====================================================
// 2. SOLICITUDES (TABLA REAL: solicitudes)
// =====================================================

// Solicitudes en cualquier estado (según tu tabla real)
async function getSolicitudesPendientes(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id_solicitud AS id,
        codigo AS nombre,
        fecha_creacion AS fecha,
        estado,
        nota_socio,
        nota_acad,
        total,
        id_estudiante
      FROM solicitudes
      WHERE estado IN ('EN_EVALUACION', 'APROBADA', 'NO APROBADA')
    `);

    res.json(rows);
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ message: "Error obteniendo solicitudes" });
  }
}

// Obtener expediente de un estudiante + documentos asociados
async function getExpediente(req, res) {
  try {
    const { id } = req.params;

    // Datos del estudiante
    const [[estudiante]] = await pool.query(
      `
      SELECT nombre, carrera, promedio
      FROM estudiantes
      WHERE id_estudiante = ?
      `,
      [id]
    );

    // Archivos de la solicitud
    const [documentos] = await pool.query(
      `
      SELECT url_archivo AS archivo
      FROM solicitud_docs
      WHERE id_solicitud = ?
      `,
      [id]
    );

    res.json({
      ...estudiante,
      documentos: documentos.map(doc => doc.archivo)
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

// Informe completo de solicitudes
async function generarInforme(req, res) {
  try {
    const [rows] = await pool.query(`SELECT * FROM solicitudes`);
    res.json(rows);
  } catch (error) {
    console.error("Error en generarInforme:", error);
    res.status(500).json({ message: "Error generando informe" });
  }
}

// =====================================================
// EXPORTACIÓN DE FUNCIONES
// =====================================================
module.exports = {
  // Sesiones
  crearSesion,
  getProximaSesion,
  listarSesiones,

  // Solicitudes
  getSolicitudesPendientes,
  getExpediente,
  aprobarSolicitud,
  denegarSolicitud,
  generarInforme
};
