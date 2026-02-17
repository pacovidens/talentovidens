#!/usr/bin/env node
/**
 * Importa candidatos desde el Excel consolidado a la base de datos.
 * Uso: node import-xlsx.js "ruta/al/archivo.xlsx"
 */

const XLSX = require('xlsx');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ruta por defecto (NAS) o: node import-xlsx.js "ruta/a/tu/archivo.xlsx"
const DEFAULT_PATH = '/Volumes/Videns_NAS/Administración/RH/2026/Julius/consolidated_candidates_for_google_sheets_v4.xlsx';
const EXCEL_PATH = process.argv[2] || DEFAULT_PATH;
const DB_PATH = path.join(__dirname, 'database.db');

// Mapeo flexible: posibles nombres de columna en el Excel -> campo en BD
const COLUMN_MAP = {
  nombre: ['nombre', 'name', 'candidato', 'candidate', 'nombre completo', 'full name', 'nombre y apellido'],
  email: ['email', 'correo', 'e-mail', 'mail', 'correo electrónico'],
  telefono: ['telefono', 'teléfono', 'phone', 'tel', 'celular', 'mobile', 'número', 'numero'],
  categoria: ['categoria', 'categoría', 'category', 'tipo', 'type'],
  area: ['area', 'área', 'department', 'departamento', 'departamento/área', 'location'],
  job_title: ['job', 'puesto', 'position', 'job title', 'job titles', 'cargo', 'vacante', 'vacancy', 'rol', 'role', 'posición'],
  skills: ['skills', 'habilidades', 'skills/habilidades', 'competencias', 'competencies', 'tecnologías', 'technologies'],
  video_link: ['video', 'video link', 'link video', 'url video', 'video_url', 'video link (opcional)', 'reel/video'],
  reel_link: ['reel', 'reel link', 'link reel', 'instagram', 'reel_url', 'reel link (opcional)'],
  portfolio_link: ['portfolio', 'portafolio', 'portfolio link', 'link portfolio', 'portfolio_url', 'portafolio link (opcional)', 'web', 'sitio web', 'resume', 'resume link', 'cv', 'curriculum'],
  linkedin_link: ['linkdedin', 'linkedin', 'linkedin link', 'linkedin url', 'linkedin profile'],
  experiencia: ['experiencia', 'experience', 'años experiencia', 'años de experiencia'],
  educacion: ['educacion', 'educación', 'education', 'formación', 'formacion académica'],
  notas: ['notas', 'notes', 'observaciones', 'comments', 'comentarios', 'entrevistado'],
  score: ['score', 'puntuación', 'puntuacion', 'rating', 'calificación', 'calificacion']
};

function normalizeHeader(str) {
  if (typeof str !== 'string') return '';
  return str.toString().toLowerCase().trim();
}

function findColumnKey(headers, rowIndex = 0) {
  const mapping = {};
  for (const [dbField, possibleNames] of Object.entries(COLUMN_MAP)) {
    for (let col = 0; col < headers.length; col++) {
      const cell = headers[col];
      const val = normalizeHeader(cell);
      if (possibleNames.some(name => val.includes(name) || name.includes(val))) {
        mapping[dbField] = col;
        break;
      }
    }
  }
  return mapping;
}

function getCell(row, col) {
  if (col < 0 || !Array.isArray(row)) return '';
  const v = row[col];
  if (v === undefined || v === null) return '';
  const s = String(v).trim();
  return s === '' ? '' : s;
}

function getCellNumber(row, col) {
  const s = getCell(row, col);
  if (!s) return null;
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('❌ Archivo no encontrado:', EXCEL_PATH);
    process.exit(1);
  }

  console.log('📂 Leyendo:', EXCEL_PATH);
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!data.length) {
    console.error('❌ La hoja está vacía');
    process.exit(1);
  }

  const headers = data[0].map(h => (h != null ? String(h) : ''));
  console.log('📋 Columnas detectadas:', headers.join(' | '));

  const colMap = findColumnKey(headers);
  console.log('🗺️  Mapeo usado:', JSON.stringify(colMap, null, 2));

  const db = new Database(DB_PATH);

  db.exec(`
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
      notas TEXT,
      score REAL,
      linkedin_link TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_categoria ON candidatos(categoria);
    CREATE INDEX IF NOT EXISTS idx_area ON candidatos(area);
    CREATE INDEX IF NOT EXISTS idx_job_title ON candidatos(job_title);
  `);

  try { db.prepare('ALTER TABLE candidatos ADD COLUMN score REAL').run(); } catch (e) { if (!e.message.includes('duplicate column')) throw e; }
  try { db.prepare('ALTER TABLE candidatos ADD COLUMN linkedin_link TEXT').run(); } catch (e) { if (!e.message.includes('duplicate column')) throw e; }

  // Reemplazar datos: borrar candidatos existentes antes de importar
  const prev = db.prepare('SELECT COUNT(*) as n FROM candidatos').get();
  if (prev.n > 0) {
    db.prepare('DELETE FROM candidatos').run();
    console.log('🗑️  Eliminados', prev.n, 'candidatos anteriores');
  }

  const stmt = db.prepare(`
    INSERT INTO candidatos (
      nombre, email, telefono, categoria, area, job_title, skills,
      video_link, reel_link, portfolio_link, experiencia, educacion, notas, score, linkedin_link
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      const nombre = getCell(row, colMap.nombre ?? 0);
      if (!nombre) continue;

      stmt.run(
        nombre,
        getCell(row, colMap.email ?? -1),
        getCell(row, colMap.telefono ?? -1),
        getCell(row, colMap.categoria ?? -1),
        getCell(row, colMap.area ?? -1),
        getCell(row, colMap.job_title ?? -1),
        getCell(row, colMap.skills ?? -1),
        getCell(row, colMap.video_link ?? -1),
        getCell(row, colMap.reel_link ?? -1),
        getCell(row, colMap.portfolio_link ?? -1),
        getCell(row, colMap.experiencia ?? -1),
        getCell(row, colMap.educacion ?? -1),
        getCell(row, colMap.notas ?? -1),
        getCellNumber(row, colMap.score ?? -1),
        getCell(row, colMap.linkedin_link ?? -1)
      );
      inserted++;
    }
  });

  const rows = data.slice(1).map(row => (Array.isArray(row) ? row : []));
  insertMany(rows);

  db.close();
  console.log('✅ Importados', inserted, 'candidatos en', DB_PATH);
}

main();
