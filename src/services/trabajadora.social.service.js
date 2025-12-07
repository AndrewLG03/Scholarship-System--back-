const db = require('../config/database');
const query = (...args) => db.pool.query(...args);

/* =====================================================
   TIPOS DE BECA
===================================================== */

exports.listTiposBeca = async () => {
  const [rows] = await query(
    `SELECT id_tipo_beca, codigo, nombre, modalidad, tope_mensual
     FROM tipos_beca
     ORDER BY nombre`
  );
  return rows;
};

exports.getTipoBeca = async (id) => {
  const [rows] = await query(
    `SELECT id_tipo_beca, codigo, nombre, modalidad, tope_mensual
     FROM tipos_beca
     WHERE id_tipo_beca = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.createTipoBeca = async ({ codigo, nombre, modalidad, tope_mensual }) => {
  const [result] = await query(
    `INSERT INTO tipos_beca (codigo, nombre, modalidad, tope_mensual)
     VALUES (?, ?, ?, ?)`,
    [codigo, nombre, modalidad, tope_mensual]
  );
  return { id: result.insertId };
};

exports.updateTipoBeca = async (id, { codigo, nombre, modalidad, tope_mensual }) => {
  await query(
    `UPDATE tipos_beca
     SET codigo = ?, nombre = ?, modalidad = ?, tope_mensual = ?
     WHERE id_tipo_beca = ?`,
    [codigo, nombre, modalidad, tope_mensual, id]
  );
  return true;
};

exports.deleteTipoBeca = async (id) => {
  await query(`DELETE FROM tipos_beca WHERE id_tipo_beca = ?`, [id]);
  return true;
};

/* =====================================================
   SOLICITUDES
===================================================== */

exports.listSolicitudes = async ({ estado, fecha } = {}) => {
  let sql = `
    SELECT *
    FROM solicitudes
    WHERE 1=1
  `;
  const params = [];

  if (estado) {
    sql += ' AND estado = ?';
    params.push(estado);
  }

  if (fecha) {
    sql += ' AND DATE(fecha_creacion) = ?';
    params.push(fecha);
  }

  sql += ' ORDER BY fecha_creacion DESC, id_solicitud DESC';

  const [rows] = await query(sql, params);
  return rows;
};

exports.getSolicitud = async (id) => {
  const [rows] = await query(
    `SELECT *
     FROM solicitudes
     WHERE id_solicitud = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.createSolicitud = async ({ id_estudiante, id_tipo_beca, estado }) => {
  const [result] = await query(
    `INSERT INTO solicitudes (id_estudiante, id_tipo_beca, estado, fecha_creacion)
     VALUES (?, ?, ?, NOW())`,
    [id_estudiante, id_tipo_beca, estado || "PENDIENTE"]
  );
  return { id: result.insertId };
};

exports.updateSolicitudEstado = async (id, { estado }) => {
  await query(
    `UPDATE solicitudes
     SET estado = ?
     WHERE id_solicitud = ?`,
    [estado, id]
  );
  return true;
};

/* =====================================================
   ASIGNACIÓN AUTOMÁTICA DE BECA SOCIOECONÓMICA
===================================================== */

function calcularTipoBecaSocioeconomica({ ingreso_total, egreso_total, servicios_basicos, condicion_vivienda }) {
  if (!ingreso_total || ingreso_total <= 0) return null;

  const ingreso_neto = ingreso_total - (egreso_total || 0);
  let nivel = null;

  if (ingreso_neto <= 80000) nivel = 0;
  else if (ingreso_neto <= 150000) nivel = 1;
  else if (ingreso_neto <= 250000) nivel = 2;
  else if (ingreso_neto <= 350000) nivel = 3;
  else return null;

  const texto = servicios_basicos ? servicios_basicos.toLowerCase() : "";
  if (!texto.includes("agua")) nivel = Math.max(0, nivel - 1);
  if (!texto.includes("internet")) nivel = Math.max(0, nivel - 1);

  const condicion = condicion_vivienda ? condicion_vivienda.toLowerCase() : "";
  if (condicion.includes("mala")) nivel = Math.max(0, nivel - 1);

  return ["SOC-0", "SOC-1", "SOC-2", "SOC-3"][nivel];
}

exports.asignarTipoBecaAutomatico = async (id_solicitud) => {
  const [infoRows] = await query(
    `SELECT ingreso_total, egreso_total, servicios_basicos, condicion_vivienda
     FROM info_socioeconomica
     WHERE id_solicitud = ?
     ORDER BY id_info DESC
     LIMIT 1`,
    [id_solicitud]
  );

  if (!infoRows || infoRows.length === 0) return { aplicado: false };

  const datos = infoRows[0];

  const codigoTipo = calcularTipoBecaSocioeconomica({
    ingreso_total: datos.ingreso_total,
    egreso_total: datos.egreso_total,
    servicios_basicos: datos.servicios_basicos,
    condicion_vivienda: datos.condicion_vivienda
  });

  // ❌ NO APLICA
  if (!codigoTipo) {
    await query(
      `UPDATE solicitudes 
       SET id_tipo_beca = NULL, estado = 'NO APLICA'
       WHERE id_solicitud = ?`,
      [id_solicitud]
    );

    return { aplicado: true, tipo: null, estado: "NO APLICA" };
  }

  // Buscar tipo de beca
  const [tipoRows] = await query(
    `SELECT id_tipo_beca 
     FROM tipos_beca
     WHERE codigo = ?
     LIMIT 1`,
    [codigoTipo]
  );

  if (!tipoRows || tipoRows.length === 0) return { aplicado: false };

  const tipoId = tipoRows[0].id_tipo_beca;

  // ⚡ Nueva lógica pedida por vos
  let nuevoEstado =
    codigoTipo === "SOC-0" || codigoTipo === "SOC-1"
      ? "APROBADO"
      : "EN EVALUACIÓN";

  await query(
    `UPDATE solicitudes
     SET id_tipo_beca = ?, estado = ?
     WHERE id_solicitud = ?`,
    [tipoId, nuevoEstado, id_solicitud]
  );

  return { aplicado: true, tipo: codigoTipo, estado: nuevoEstado };
};

/* =====================================================
   CONVOCATORIAS
===================================================== */

exports.listConvocatorias = async () => {
  const [rows] = await query(
    `SELECT *
     FROM convocatorias
     ORDER BY fecha_inicio DESC`
  );
  return rows;
};

exports.createConvocatoria = async ({ nombre, fecha_inicio, fecha_cierre, id_periodo }) => {
  const [result] = await query(
    `INSERT INTO convocatorias (nombre, id_periodo, fecha_inicio, fecha_cierre, estado)
     VALUES (?, ?, ?, ?, 'CERRADO')`,
    [nombre, id_periodo || null, fecha_inicio, fecha_cierre]
  );
  return { id: result.insertId };
};

exports.updateConvocatoriaEstado = async (id, estado) => {
  await query(
    `UPDATE convocatorias
     SET estado = ?
     WHERE id_convocatoria = ?`,
    [estado, id]
  );
  return true;
};

/* =====================================================
   INFO SOCIOECONÓMICA
===================================================== */

exports.listCasosSocioeconomicos = async () => {
  const [rows] = await query(`SELECT * FROM info_socioeconomica ORDER BY id_info DESC`);
  return rows;
};

exports.createInfoSocioeconomica = async ({
  id_solicitud,
  ocupacion_padre,
  ocupacion_madre,
  ingreso_total,
  egreso_total,
  tipo_vivienda,
  condicion_vivienda,
  servicios_basicos,
  observaciones
}) => {
  const [result] = await query(
    `INSERT INTO info_socioeconomica
      (id_solicitud, ocupacion_padre, ocupacion_madre, ingreso_total, egreso_total,
       tipo_vivienda, condicion_vivienda, servicios_basicos, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_solicitud,
      ocupacion_padre,
      ocupacion_madre,
      ingreso_total,
      egreso_total,
      tipo_vivienda,
      condicion_vivienda,
      servicios_basicos,
      observaciones
    ]
  );
  return { id: result.insertId };
};

/* =====================================================
   EVALUACIONES ACADÉMICAS
===================================================== */

exports.listEvaluacionAcademica = async () => {
  const [rows] = await query(`SELECT * FROM evaluaciones ORDER BY fecha_eval DESC`);
  return rows;
};

exports.createEvaluacion = async ({
  id_solicitud,
  promedio,
  reprobadas,
  observaciones,
  evaluado_por
}) => {
  const [result] = await query(
    `INSERT INTO evaluaciones
     (id_solicitud, promedio, reprobadas, observaciones, evaluado_por, fecha_eval)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [
      id_solicitud,
      promedio,
      reprobadas,
      observaciones,
      evaluado_por
    ]
  );
  return { id: result.insertId };
};

/* =====================================================
   PERIODOS
===================================================== */

exports.listPeriodos = async () => {
  const [rows] = await query(
    `SELECT id_periodo, anio, ciclo, fecha_ini, fecha_fin
     FROM periodos
     ORDER BY fecha_ini DESC, id_periodo DESC`
  );
  return rows;
};

exports.getPeriodo = async (id) => {
  const [rows] = await query(
    `SELECT id_periodo, anio, ciclo, fecha_ini, fecha_fin
     FROM periodos
     WHERE id_periodo = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.createPeriodo = async ({ anio, ciclo, fecha_ini, fecha_fin }) => {
  const [result] = await query(
    `INSERT INTO periodos (anio, ciclo, fecha_ini, fecha_fin)
     VALUES (?, ?, ?, ?)`,
    [anio, ciclo, fecha_ini, fecha_fin]
  );
  return { id: result.insertId };
};

exports.updatePeriodo = async (id, { anio, ciclo, fecha_ini, fecha_fin }) => {
  await query(
    `UPDATE periodos
     SET anio = ?, ciclo = ?, fecha_ini = ?, fecha_fin = ?
     WHERE id_periodo = ?`,
    [anio, ciclo, fecha_ini, fecha_fin, id]
  );
  return true;
};

/* =====================================================
   ETAPAS POR CONVOCATORIA
===================================================== */

exports.listEtapas = async (id_convocatoria) => {
  console.log('📌 [service.listEtapas] id_convocatoria:', id_convocatoria);
  const [rows] = await query(
    `SELECT id_etapa, id_convocatoria, nombre, descripcion, estado
     FROM etapas_convocatoria
     WHERE id_convocatoria = ?
     ORDER BY id_etapa ASC`,
    [id_convocatoria]
  );

  console.log('📌 [service.listEtapas] Rows de BD:', rows);
  return rows.map(e => ({
    id_etapa: e.id_etapa,
    id_convocatoria: e.id_convocatoria,
    nombre: e.nombre || "Etapa sin nombre",
    descripcion: e.descripcion || "Sin descripción registrada",
    estado: e.estado
  }));
};

exports.updateEtapa = async (id_etapa, id_convocatoria, { estado }) => {
  console.log('📌 [service.updateEtapa] id_etapa:', id_etapa, 'id_convocatoria:', id_convocatoria, 'estado:', estado);
  
  // Cerrar todas las demás etapas
  await query(
    `UPDATE etapas_convocatoria
     SET estado = 'CERRADA'
     WHERE id_convocatoria = ?`,
    [id_convocatoria]
  );

  // Abrir solo la seleccionada
  await query(
    `UPDATE etapas_convocatoria
     SET estado = ?
     WHERE id_etapa = ? AND id_convocatoria = ?`,
    [estado, id_etapa, id_convocatoria]
  );

  console.log('✅ Etapa actualizada en BD');
  return true;
};

/* =====================================================
   APELACIONES
===================================================== */
exports.listApelaciones = async () => {
  const [rows] = await query(`
    SELECT id_apelacion, id_solicitud, motivo, estado, fecha, resolucion
    FROM apelaciones
    ORDER BY fecha DESC
  `);
  return rows;
};

exports.createApelacion = async ({ id_solicitud, motivo }) => {
  const [result] = await query(
    `INSERT INTO apelaciones (id_solicitud, motivo, estado, fecha)
     VALUES (?, ?, 'PENDIENTE', NOW())`,
    [id_solicitud, motivo]
  );
  return { id: result.insertId };
};

exports.updateApelacion = async (id, { estado, resolucion }) => {
  await query(
    `UPDATE apelaciones
     SET estado = ?, resolucion = ?
     WHERE id_apelacion = ?`,
    [estado, resolucion, id]
  );
  return true;
};
