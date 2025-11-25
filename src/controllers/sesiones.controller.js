const { pool } = require("../config/database");

async function crearSesion(req, res) {
    try {
        const { fecha } = req.body;

        await pool.query(
            `INSERT INTO sesiones_comite (fecha) VALUES (?)`,
            [fecha]
        );

        res.json({ message: "Sesión creada correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creando sesión" });
    }
}

async function getProximaSesion(req, res) {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM sesiones_comite
            ORDER BY fecha ASC
            LIMIT 1
        `);

        if (rows.length === 0) return res.json(null);

        res.json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error obteniendo sesión" });
    }
}

module.exports = { crearSesion, getProximaSesion };
