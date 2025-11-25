const db = require("../config/database");

exports.getResultadosByAspirante = (req, res) => {
    const { id_aspirante } = req.params;

    const sql = `
        SELECT 
            s.id_solicitud,
            s.codigo AS codigo_solicitud,
            s.estado AS estado_solicitud,

            r.decision AS decision_comite,
            r.motivo AS motivo_resolucion,
            r.fecha AS fecha_resolucion,

            b.id_beca,
            b.valor AS monto_beca,
            b.fecha_inicio,
            b.fecha_fin,
            b.estado AS estado_beca,

            t.nombre AS tipo_beca,
            t.codigo AS codigo_tipo_beca,
            t.modalidad AS modalidad_beca,
            t.tope_mensual AS tope_beca

        FROM solicitudes s
        LEFT JOIN resoluciones r ON r.id_solicitud = s.id_solicitud
        LEFT JOIN becas b ON b.id_solicitud = s.id_solicitud
        LEFT JOIN tipos_beca t ON t.id_tipo_beca = b.id_tipo_beca
        WHERE s.id_aspirante = ?;
    `;

    db.query(sql, [id_aspirante], (err, results) => {
        if (err) {
            console.error("Error obteniendo resultados:", err);
            return res.status(500).json({ 
                error: "Error al obtener los resultados del aspirante" 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                mensaje: "El aspirante no cuenta con solicitudes ni resultados"
            });
        }

        res.json({
            aspirante: id_aspirante,
            total_registros: results.length,
            resultados: results
        });
    });
};  