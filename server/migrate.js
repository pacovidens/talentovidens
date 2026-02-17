/**
 * Script de migración para adaptar una base de datos existente
 * 
 * INSTRUCCIONES:
 * 1. Copia tu base de datos existente a server/database_original.db
 * 2. Modifica este script según la estructura de tu base de datos
 * 3. Ejecuta: node server/migrate.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Configuración
const DB_ORIGINAL = path.join(__dirname, 'database_original.db');
const DB_NUEVO = path.join(__dirname, 'database.db');

// Verificar que existe la base de datos original
if (!fs.existsSync(DB_ORIGINAL)) {
  console.error('❌ No se encontró database_original.db');
  console.log('💡 Copia tu base de datos existente a server/database_original.db');
  process.exit(1);
}

const dbOriginal = new Database(DB_ORIGINAL);
const dbNuevo = new Database(DB_NUEVO);

// Crear estructura nueva
dbNuevo.exec(`
  CREATE TABLE IF NOT EXISTS candidatos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    categoria TEXT,
    area TEXT,
    job_title TEXT,
    skills TEXT,
    video_link TEXT,
    reel_link TEXT,
    portfolio_link TEXT,
    experiencia TEXT,
    educacion TEXT,
    fecha_aplicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    notas TEXT
  );
`);

// Obtener nombres de tablas de la base de datos original
const tablas = dbOriginal.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
`).all();

console.log('📋 Tablas encontradas:', tablas.map(t => t.name).join(', '));

// EJEMPLO: Adaptar datos según tu estructura
// Modifica esta sección según tu base de datos

try {
  // Ejemplo 1: Si tu tabla se llama 'applicants' y tiene columnas diferentes
  // const candidatos = dbOriginal.prepare('SELECT * FROM applicants').all();
  
  // Ejemplo 2: Si necesitas mapear columnas
  // const candidatos = dbOriginal.prepare(`
  //   SELECT 
  //     name as nombre,
  //     email_address as email,
  //     phone as telefono,
  //     category as categoria,
  //     department as area,
  //     position as job_title,
  //     skills_list as skills,
  //     video_url as video_link,
  //     reel_url as reel_link,
  //     portfolio_url as portfolio_link
  //   FROM tu_tabla
  // `).all();

  // DESCOMENTA Y MODIFICA SEGÚN TU ESTRUCTURA:
  /*
  const candidatos = dbOriginal.prepare('SELECT * FROM tu_tabla').all();
  
  const stmt = dbNuevo.prepare(`
    INSERT INTO candidatos (
      nombre, email, telefono, categoria, area, job_title, skills,
      video_link, reel_link, portfolio_link, experiencia, educacion, notas
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = dbNuevo.transaction((candidatos) => {
    for (const c of candidatos) {
      stmt.run(
        c.nombre || c.name || '',
        c.email || c.email_address || '',
        c.telefono || c.phone || '',
        c.categoria || c.category || '',
        c.area || c.department || '',
        c.job_title || c.position || '',
        c.skills || c.skills_list || '',
        c.video_link || c.video_url || '',
        c.reel_link || c.reel_url || '',
        c.portfolio_link || c.portfolio_url || '',
        c.experiencia || c.experience || '',
        c.educacion || c.education || '',
        c.notas || c.notes || ''
      );
    }
  });

  insertMany(candidatos);
  console.log(`✅ Migrados ${candidatos.length} candidatos`);
  */

  console.log('\n⚠️  Por favor, modifica este script según la estructura de tu base de datos');
  console.log('📝 Revisa los ejemplos comentados y adapta las consultas SQL');

} catch (error) {
  console.error('❌ Error durante la migración:', error.message);
} finally {
  dbOriginal.close();
  dbNuevo.close();
}
