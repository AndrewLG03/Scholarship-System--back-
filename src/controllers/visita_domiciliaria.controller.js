// =======================================
// VISITAS DOMICILIARIAS CONTROLLER
// =======================================
const visitasService = require('../services/visita_service');


/* =======================================
   LISTAR TODAS LAS VISITAS
======================================= */
exports.listVisitas = async (req, res) => {
  try {
    const visitas = await visitasService.listVisitas();
    res.json(visitas);
  } catch (error) {
    console.error("Error listando visitas:", error);
    res.status(500).json({ message: "Error al obtener las visitas domiciliarias" });
  }
};

/* =======================================
   OBTENER VISITA POR ID
======================================= */
exports.getVisita = async (req, res) => {
  const { id } = req.params;

  try {
    const visita = await visitasService.getVisita(id);

    if (!visita) {
      return res.status(404).json({ message: "Visita no encontrada" });
    }

    res.json(visita);
  } catch (error) {
    console.error("Error obteniendo visita:", error);
    res.status(500).json({ message: "Error al obtener la visita" });
  }
};

/* =======================================
   CREAR VISITA DOMICILIARIA
======================================= */
exports.createVisita = async (req, res) => {
  const {
    id_solicitud,
    fecha_programada,
    fecha_realizada,
    estado,
    observaciones,
    resultado
  } = req.body;

  try {
    const result = await visitasService.createVisita({
      id_solicitud,
      fecha_programada,
      fecha_realizada,
      estado,
      observaciones,
      resultado
    });

    res.status(201).json({
      message: "Visita registrada exitosamente",
      id_visita: result.id
    });
  } catch (error) {
    console.error("Error creando visita:", error);
    res.status(500).json({ message: "Error al registrar la visita domiciliaria" });
  }
};

/* =======================================
   ACTUALIZAR VISITA
======================================= */
exports.updateVisita = async (req, res) => {
  const { id } = req.params;
  const {
    id_solicitud,
    fecha_programada,
    fecha_realizada,
    estado,
    observaciones,
    resultado
  } = req.body;

  try {
    const result = await visitasService.updateVisita(id, {
      id_solicitud,
      fecha_programada,
      fecha_realizada,
      estado,
      observaciones,
      resultado
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Visita no encontrada" });
    }

    res.json({ message: "Visita actualizada correctamente" });
  } catch (error) {
    console.error("Error actualizando visita:", error);
    res.status(500).json({ message: "Error al actualizar la visita domiciliaria" });
  }
};

/* =======================================
   ELIMINAR VISITA
======================================= */
exports.deleteVisita = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await visitasService.deleteVisita(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Visita no encontrada" });
    }

    res.json({ message: "Visita eliminada correctamente" });
  } catch (error) {
    console.error("Error eliminando visita:", error);
    res.status(500).json({ message: "Error al eliminar la visita domiciliaria" });
  }
};
