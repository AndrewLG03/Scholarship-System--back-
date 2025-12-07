const { pool } = require('../config/database');

// Crear información académica desde solicitud (durante el formulario)
exports.createInfoAcademica = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            id_solicitud,
            colegio,
            tipo_institucion,
            beca_colegio,
            institucion_beca,
            monto_beca,
            posee_titulo,
            grado_aprobado
        } = req.body;

        // LOG DEBUG
        console.log('[DEBUG INFO ACADEMICA] Body recibido:', req.body);
        console.log('[DEBUG INFO ACADEMICA] id_solicitud:', id_solicitud);

        // Validar que id_solicitud esté presente
        if (!id_solicitud) {
            console.log('[DEBUG ERROR] id_solicitud es null o undefined');
            return res.status(400).json({ 
                ok: false, 
                error: 'Se requiere id_solicitud' 
            });
        }

        const sql = `
            INSERT INTO info_academica_aspirante 
            (id_solicitud, colegio, tipo_institucion, beca_colegio, institucion_beca, monto_beca, posee_titulo, grado_aprobado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await connection.query(sql, [
            id_solicitud,
            colegio,
            tipo_institucion,
            beca_colegio,
            institucion_beca,
            monto_beca || null,
            posee_titulo,
            grado_aprobado || null
        ]);

        res.status(201).json({
            ok: true,
            message: 'Información académica guardada correctamente',
            id_insertado: result.insertId
        });

    } catch (err) {
        console.error('Error al insertar:', err);
        res.status(500).json({ 
            ok: false, 
            error: 'Error al guardar los datos' 
        });
    } finally {
        connection.release();
    }
};

// Obtener todos los registros
exports.getAllInfoAcademica = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const [rows] = await connection.query(
            "SELECT * FROM info_academica_aspirante ORDER BY id_info_academica DESC"
        );

        res.json({ 
            ok: true, 
            data: rows 
        });

    } catch (err) {
        console.error('Error al obtener datos:', err);
        res.status(500).json({ 
            ok: false, 
            error: 'Error al obtener datos' 
        });
    } finally {
        connection.release();
    }
};

// Obtener información académica por id_solicitud
exports.getInfoAcademicaByUsuario = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id_solicitud } = req.params;

        const [rows] = await connection.query(
            "SELECT * FROM info_academica_aspirante WHERE id_solicitud = ? ORDER BY id_info_academica DESC",
            [id_solicitud]
        );

        res.json({ 
            ok: true, 
            data: rows 
        });

    } catch (err) {
        console.error('Error al obtener datos:', err);
        res.status(500).json({ 
            ok: false, 
            error: 'Error al obtener datos' 
        });
    } finally {
        connection.release();
    }
};

// Actualizar información académica
exports.updateInfoAcademica = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id_info_academica } = req.params;
        const {
            colegio,
            tipo_institucion,
            beca_colegio,
            institucion_beca,
            monto_beca,
            posee_titulo,
            grado_aprobado
        } = req.body;

        const sql = `
            UPDATE info_academica_aspirante 
            SET colegio = ?, tipo_institucion = ?, beca_colegio = ?, 
                institucion_beca = ?, monto_beca = ?, posee_titulo = ?, 
                grado_aprobado = ?
            WHERE id_info_academica = ?
        `;

        await connection.query(sql, [
            colegio,
            tipo_institucion,
            beca_colegio,
            institucion_beca,
            monto_beca || null,
            posee_titulo,
            grado_aprobado || null,
            id_info_academica
        ]);

        res.json({
            ok: true,
            message: 'Información académica actualizada correctamente'
        });

    } catch (err) {
        console.error('Error al actualizar:', err);
        res.status(500).json({ 
            ok: false, 
            error: 'Error al actualizar los datos' 
        });
    } finally {
        connection.release();
    }
};
