// backend/src/controllers/student.controller.js
const { pool } = require('../config');
const path = require('path');

/*
 * Controlador para operaciones de estudiantes y aspirantes:
 *  - Actualización de expediente (carnet, carrera, promedio).
 *  - Creación de solicitudes de beca.
 *  - Subida de documentos asociados a una solicitud.
 *  - Consulta de resoluciones (resultados).
 *  - Registro de apelaciones.
 *  - Registro de suspensiones (justificación de pérdida de cursos).
 */

/** Actualiza el expediente (carnet, carrera, promedio) de un estudiante existente. */
exports.updateExpediente = async (req, res, next) => {
    const { studentId } = req.params;
    const { carnet, carrera, promedio } = req.body;

    try {
        const [result] = await pool.query(
        'UPDATE estudiantes SET carnet = ?, carrera = ?, promedio = ? WHERE id_estudiante = ?',
        [carnet, carrera, promedio, studentId],
        );
        if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Estudiante no encontrado' });
        }
        return res.json({ message: 'Expediente actualizado correctamente' });
    } catch (err) {
        return next(err);
    }
};

/** Crea una solicitud de beca para un estudiante (tabla `solicitudes`). */
exports.createSolicitudEstudiante = async (req, res, next) => {
    const { studentId } = req.params;
    const { id_convocatoria } = req.body;
    try {
        const codigo = `SOL-${Date.now()}`;
        const [result] = await pool.query(
        'INSERT INTO solicitudes (id_estudiante, id_convocatoria, estado, codigo) VALUES (?, ?, ?, ?)',
        [studentId, id_convocatoria, 'ENVIADA', codigo],
        );
        return res.json({ message: 'Solicitud creada', id_solicitud: result.insertId });
    } catch (err) {
        return next(err);
    }
};

/** Crea una solicitud de beca para un aspirante (tabla `solicitudes`). */
exports.createSolicitudAspirante = async (req, res, next) => {
    const { aspiranteId } = req.params;
    const { id_convocatoria } = req.body;
    try {
        const codigo = `SOL-${Date.now()}`;
        const [result] = await pool.query(
        'INSERT INTO solicitudes (id_aspirante, id_convocatoria, estado, codigo) VALUES (?, ?, ?, ?)',
        [aspiranteId, id_convocatoria, 'ENVIADA', codigo],
        );
        return res.json({ message: 'Solicitud creada', id_solicitud: result.insertId });
    } catch (err) {
        return next(err);
    }
};

/** Sube un documento para una solicitud. Requiere `req.file` (Multer) y `id_documento` en el cuerpo. */
exports.uploadDocument = async (req, res, next) => {
    const { solicitudId } = req.params;
    const { id_documento } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'No se envió ningún archivo' });
    }

    try {
        const url_archivo = path.join('uploads', file.filename);
        await pool.query(
        'INSERT INTO solicitud_docs (id_solicitud, id_documento, url_archivo, valido) VALUES (?, ?, ?, ?)',
        [solicitudId, id_documento, url_archivo, 'NO'],
        );
        return res.json({ message: 'Documento cargado exitosamente' });
    } catch (err) {
        return next(err);
    }
};

/** Devuelve todas las resoluciones asociadas a las solicitudes de un estudiante o aspirante. */
exports.getResultados = async (req, res, next) => {
  const { id } = req.params; // puede ser id_estudiante o id_aspirante
    try {
        const sql = `
        SELECT s.id_solicitud,
                s.estado AS estado_solicitud,
                r.decision,
                r.motivo,
                r.fecha
            FROM solicitudes AS s
            LEFT JOIN resoluciones AS r ON s.id_solicitud = r.id_solicitud
        WHERE s.id_estudiante = ? OR s.id_aspirante = ?`;
        const [rows] = await pool.query(sql, [id, id]);
        return res.json({ resultados: rows });
    } catch (err) {
        return next(err);
    }
};

/** Registra una apelación para una solicitud. Requiere `motivo` en el cuerpo. */
exports.createAppeal = async (req, res, next) => {
    const { solicitudId } = req.params;
    const { motivo } = req.body;
    try {
        await pool.query(
        'INSERT INTO apelaciones (id_solicitud, motivo, estado, fecha) VALUES (?, ?, ?, NOW())',
        [solicitudId, motivo, 'PENDIENTE'],
        );
        return res.json({ message: 'Apelación registrada correctamente' });
    } catch (err) {
        return next(err);
    }
};

/** Registra una suspensión (justificación de pérdida de cursos) para una beca. */
exports.createSuspension = async (req, res, next) => {
    const { becaId } = req.params;
    const { fecha_inicio, fecha_fin, motivo } = req.body;
    try {
        await pool.query(
        'INSERT INTO suspensiones (id_beca, fecha_inicio, fecha_fin, motivo) VALUES (?, ?, ?, ?)',
        [becaId, fecha_inicio, fecha_fin, motivo],
        );
        return res.json({ message: 'Suspensión registrada correctamente' });
    } catch (err) {
        return next(err);
    }
};
