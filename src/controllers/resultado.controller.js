const db = require("../config/database"); 

exports.obtenerResultados = async (req, res) => {

    console.log('🔍 [DEBUG] obtenerResultados called');
    console.log('🔍 [DEBUG] req.params:', req.params);

    const { id } = req.params;

    try {
        // El ID recibido debería ser id_aspirante directamente
        // Pero como fallback, intentamos convertir si es id_usuario
        const [aspirantesResult] = await db.pool.query(
            `SELECT id_aspirante FROM aspirantes WHERE id_usuario = ? LIMIT 1`,
            [id]
        );

        let idAspirante = id;
        if (aspirantesResult.length > 0) {
            idAspirante = aspirantesResult[0].id_aspirante;
            console.log('🔍 [DEBUG] id_usuario convertido a id_aspirante:', idAspirante);
        } else {
            console.log('🔍 [DEBUG] Usando id directamente como id_aspirante:', id);
        }

        const sql = `
            SELECT 
                s.id_solicitud,
                s.id_aspirante,
                s.codigo AS codigo_solicitud,
                s.estado AS estado_solicitud,
                s.fecha_creacion,
                s.id_tipo_beca,

                r.id_resolucion,
                r.decision AS decision_comite,
                r.motivo AS motivo_resolucion,
                r.fecha AS fecha_resolucion,

                b.id_beca,
                b.valor AS monto_beca,
                b.fecha_inicio,
                b.fecha_fin,
                b.estado AS estado_beca,

                t.id_tipo_beca AS id_tipo_beca_tabla,
                t.nombre AS tipo_beca,
                t.codigo AS codigo_tipo_beca,
                t.modalidad AS modalidad_beca,
                t.tope_mensual AS tope_beca

            FROM solicitudes s
            LEFT JOIN resoluciones r ON r.id_solicitud = s.id_solicitud
            LEFT JOIN becas b ON b.id_solicitud = s.id_solicitud
            LEFT JOIN tipos_beca t ON t.id_tipo_beca = s.id_tipo_beca
            WHERE s.id_aspirante = ?
            ORDER BY s.fecha_creacion DESC;
        `;

        console.log('🔍 [DEBUG] Ejecutando query con idAspirante:', idAspirante);

        const [results] = await db.pool.query(sql, [idAspirante]);

        console.log('🔍 [DEBUG] Resultados encontrados:', results.length);
        if (results.length > 0) {
            console.log('🔍 [DEBUG] Primera solicitud:', JSON.stringify(results[0], null, 2));
        }

        if (results.length === 0) {
            return res.status(404).json({
                mensaje: "El aspirante no cuenta con solicitudes ni resultados",
                debug: {
                    id_buscado: idAspirante,
                    id_parametro: id
                }
            });
        }

        res.json({
            aspirante: idAspirante,
            total_registros: results.length,
            resultados: results
        });
    } catch (err) {
        console.error("Error obteniendo resultados:", err);
        return res.status(500).json({ 
            error: "Error al obtener los resultados del aspirante" 
        });
    }
};
