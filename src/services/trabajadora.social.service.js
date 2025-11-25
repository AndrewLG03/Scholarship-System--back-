const db = require('../config/database');

// FIX PARA QUE FUNCIONE SIN ALTERAR ARCHIVOS DEL GRUPO
const query = (...args) => db.pool.query(...args);

/* =====================================================
   TIPOS DE BECA  (tabla: tipos_beca)
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

// ✅ INSERT
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
  await query(
    `DELETE FROM tipos_beca WHERE id_tipo_beca = ?`,
    [id]
  );
  return true;
};

/* =====================================================
   SOLICITUDES (tabla: solicitudes)
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

// ✅ INSERT
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
   CONVOCATORIAS (tabla: convocatorias)
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

// ✅ INSERT
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

// ✅ INSERT
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
  const [rows] = await query(`
    SELECT id_periodo, anio, ciclo, fecha_ini, fecha_fin
    FROM periodos
    ORDER BY fecha_ini DESC, id_periodo DESC
  `);
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

// ✅ INSERT
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
   ETAPAS (tabla: etapas_convocatoria)
===================================================== */

// Listar todas las etapas
exports.listEtapas = async () => {
  const [rows] = await query(`
    SELECT id_etapa, nombre, descripcion, estado
    FROM etapas_convocatoria
    ORDER BY id_etapa ASC
  `);
  return rows;
};

// Actualizar estado
exports.updateEtapa = async (id_etapa, { estado }) => {
  await query(
    `UPDATE etapas_convocatoria 
     SET estado = ?
     WHERE id_etapa = ?`,
    [estado, id_etapa]
  );
  return true;
};
