#!/usr/bin/env node

/**
 * Script para inicializar la tabla etapas_convocatoria
 * Uso: node init-etapas.js
 */

const db = require('./src/config/database');

async function initEtapas() {
  const connection = await db.pool.getConnection();

  try {
    console.log('🔄 Inicializando tabla etapas_convocatoria...');

    // 1. Crear tabla
    await connection.query(`
      CREATE TABLE IF NOT EXISTS etapas_convocatoria (
        id_etapa INT AUTO_INCREMENT PRIMARY KEY,
        id_convocatoria INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        estado ENUM('ABIERTA', 'CERRADA') DEFAULT 'CERRADA',
        FOREIGN KEY (id_convocatoria) REFERENCES convocatorias(id_convocatoria) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla etapas_convocatoria creada/verificada');

    // 2. Limpiar etapas existentes para convocatoria 1
    await connection.query('DELETE FROM etapas_convocatoria WHERE id_convocatoria = 1');
    console.log('✅ Etapas previas eliminadas');

    // 3. Insertar etapas
    const etapas = [
      { nombre: 'Recepción de Solicitudes', descripcion: 'Período para la presentación de solicitudes de beca', estado: 'ABIERTA' },
      { nombre: 'Evaluación Socioeconómica', descripcion: 'Análisis de la situación socioeconómica de los aspirantes', estado: 'CERRADA' },
      { nombre: 'Evaluación Académica', descripcion: 'Revisión del desempeño académico de los solicitantes', estado: 'CERRADA' },
      { nombre: 'Sesión de Comité', descripcion: 'Reunión del comité evaluador para tomar decisiones finales', estado: 'CERRADA' },
      { nombre: 'Comunicación de Resultados', descripcion: 'Notificación de resultados a los aspirantes', estado: 'CERRADA' }
    ];

    for (const etapa of etapas) {
      await connection.query(
        'INSERT INTO etapas_convocatoria (id_convocatoria, nombre, descripcion, estado) VALUES (?, ?, ?, ?)',
        [1, etapa.nombre, etapa.descripcion, etapa.estado]
      );
    }
    console.log(`✅ ${etapas.length} etapas insertadas para convocatoria 1`);

    // 4. Copiar etapas a otras convocatorias (si existen)
    const [convocatorias] = await connection.query('SELECT id_convocatoria FROM convocatorias WHERE id_convocatoria > 1');
    
    for (const conv of convocatorias) {
      const id_conv = conv.id_convocatoria;
      
      // Limpiar etapas existentes
      await connection.query('DELETE FROM etapas_convocatoria WHERE id_convocatoria = ?', [id_conv]);
      
      // Copiar etapas
      for (const etapa of etapas) {
        await connection.query(
          'INSERT INTO etapas_convocatoria (id_convocatoria, nombre, descripcion, estado) VALUES (?, ?, ?, ?)',
          [id_conv, etapa.nombre, etapa.descripcion, etapa.estado]
        );
      }
      console.log(`✅ ${etapas.length} etapas insertadas para convocatoria ${id_conv}`);
    }

    console.log('\n✨ Inicialización completada exitosamente!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error durante inicialización:', err.message);
    process.exit(1);
  } finally {
    connection.release();
  }
}

initEtapas();
