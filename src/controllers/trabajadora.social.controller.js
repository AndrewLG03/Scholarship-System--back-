const service = require('../services/trabajadora.social.service');

/* ============================================
   PERIODOS
============================================ */
exports.listPeriodos = async (req, res) => {
  try {
    const data = await service.listPeriodos();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPeriodo = async (req, res) => {
  try {
    const data = await service.getPeriodo(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPeriodo = async (req, res) => {
  try {
    const nuevo = await service.createPeriodo(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePeriodo = async (req, res) => {
  try {
    await service.updatePeriodo(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePeriodo = async (req, res) => {
  try {
    await service.deletePeriodo(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ============================================
   CONVOCATORIAS
============================================ */
exports.listConvocatorias = async (req, res) => {
  try {
    const data = await service.listConvocatorias();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createConvocatoria = async (req, res) => {
  try {
    const nueva = await service.createConvocatoria(req.body);
    res.status(201).json(nueva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateConvocatoriaEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    await service.updateConvocatoriaEstado(req.params.id, estado);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.abrirConvocatoria = async (req, res) => {
  try {
    await service.updateConvocatoriaEstado(req.params.id, "ABIERTO");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cerrarConvocatoria = async (req, res) => {
  try {
    await service.updateConvocatoriaEstado(req.params.id, "CERRADO");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ============================================
   TIPOS DE BECA
============================================ */
exports.listTiposBeca = async (req, res) => {
  try {
    const data = await service.listTiposBeca();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTipoBeca = async (req, res) => {
  try {
    const data = await service.getTipoBeca(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTipoBeca = async (req, res) => {
  try {
    const data = await service.createTipoBeca(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTipoBeca = async (req, res) => {
  try {
    await service.updateTipoBeca(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTipoBeca = async (req, res) => {
  try {
    await service.deleteTipoBeca(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ============================================
   SOLICITUDES
============================================ */
exports.listSolicitudes = async (req, res) => {
  try {
    const data = await service.listSolicitudes(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSolicitud = async (req, res) => {
  try {
    const data = await service.getSolicitud(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSolicitudEstado = async (req, res) => {
  try {
    await service.updateSolicitudEstado(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSolicitud = async (req, res) => {
  try {
    const nueva = await service.createSolicitud(req.body);
    res.status(201).json(nueva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ============================================
   SOCIOECONÓMICO (CORREGIDO)
============================================ */
exports.listCasosSocioeconomicos = async (req, res) => {
  try {
    const data = await service.listCasosSocioeconomicos();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ⭐ NUEVO: Crear info socioeconómica + aplicar fórmula */
exports.createInfoSocioeconomica = async (req, res) => {
  try {
    const nueva = await service.createInfoSocioeconomica(req.body);

    // Ejecutar asignación automática SOCIOECONÓMICA
    await service.asignarTipoBecaAutomatico(req.body.id_solicitud);

    res.status(201).json({ success: true, nueva });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ============================================
   EVALUACIÓN ACADÉMICA
============================================ */
exports.listEvaluacionAcademica = async (req, res) => {
  try {
    const data = await service.listEvaluacionAcademica();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ============================================
   ETAPAS DE CONVOCATORIA  (CORREGIDO)
============================================ */
exports.listEtapas = async (req, res) => {
  try {
    // 1) Prioridad: query param
    let id_convocatoria = req.query.id_convocatoria;

    // 2) Si no viene → usar path param
    if (!id_convocatoria && req.params.id_convocatoria) {
      id_convocatoria = req.params.id_convocatoria;
    }

    // 3) Si aún no viene → obtener la convocatoria activa
    if (!id_convocatoria) {
      const convocatorias = await service.listConvocatorias();
      const activa = convocatorias.find(c => c.estado === "ABIERTO");

      if (activa) id_convocatoria = activa.id_convocatoria;
    }

    // 4) Si aún no existe → no hay nada que mostrar
    if (!id_convocatoria) {
      return res.json([]);
    }

    const data = await service.listEtapas(id_convocatoria);
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updateEtapa = async (req, res) => {
  try {
    const id_etapa = req.params.id;
    const { id_convocatoria, estado } = req.body;
    await service.updateEtapa(id_etapa, id_convocatoria, { estado });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
/* ============================================
   APELACIONES
============================================ */
exports.listApelaciones = async (req, res) => {
  try {
    const data = await service.listApelaciones();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createApelacion = async (req, res) => {
  try {
    const nueva = await service.createApelacion(req.body);
    res.status(201).json(nueva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateApelacion = async (req, res) => {
  try {
    await service.updateApelacion(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
