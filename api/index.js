// Vercel Serverless Function wrapper para el backend
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar base de datos
// En Vercel: copiar desde el proyecto a /tmp (único lugar escribible)
// En desarrollo: usar la DB local
let dbPath;
let db;

if (process.env.VERCEL) {
  // En Vercel, usar /tmp para escritura
  dbPath = '/tmp/database.db';
  const sourceDb = path.join(__dirname, '../server/database.db');
  
  // Copiar DB si no existe en /tmp
  if (!fs.existsSync(dbPath) && fs.existsSync(sourceDb)) {
    fs.copyFileSync(sourceDb, dbPath);
  }
} else {
  // Desarrollo local
  dbPath = process.env.DB_PATH || path.join(__dirname, '../server/database.db');
}

try {
  db = new Database(dbPath, { readonly: process.env.VERCEL ? false : false });
} catch (error) {
  console.error('Error inicializando base de datos:', error);
  throw error;
}

// Crear tablas si no existen
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

// Añadir columnas si no existen
try {
  db.prepare('ALTER TABLE candidatos ADD COLUMN score REAL').run();
} catch (e) {
  if (!e.message.includes('duplicate column')) throw e;
}
try {
  db.prepare('ALTER TABLE candidatos ADD COLUMN linkedin_link TEXT').run();
} catch (e) {
  if (!e.message.includes('duplicate column')) throw e;
}

// Función para calcular completitud del perfil (0-1)
function calcularCompletitud(candidato) {
  const campos = [
    candidato.email,
    candidato.telefono,
    candidato.categoria,
    candidato.area,
    candidato.job_title,
    candidato.skills,
    candidato.video_link,
    candidato.reel_link,
    candidato.portfolio_link,
    candidato.linkedin_link,
    candidato.experiencia,
    candidato.educacion,
    candidato.notas
  ];
  const llenos = campos.filter(c => c && String(c).trim() !== '').length;
  return llenos / campos.length;
}

// Endpoint: candidatos agrupados por categoría, ordenados por score (alto primero)
app.get('/api/candidatos-por-categoria', (req, res) => {
  try {
    const all = db.prepare(`
      SELECT * FROM candidatos
      WHERE (score IS NULL OR score <= 10)
      ORDER BY 
        CASE WHEN score IS NULL THEN 1 ELSE 0 END,
        score DESC,
        fecha_aplicacion DESC
    `).all();

    const parseSkills = (c) => ({
      ...c,
      skills: c.skills ? c.skills.split(',').map(s => s.trim()) : []
    });

    const candidatosConCompletitud = all.map(c => ({
      ...c,
      completitud: calcularCompletitud(c)
    }));

    candidatosConCompletitud.sort((a, b) => {
      const scoreA = a.score != null ? a.score : -1;
      const scoreB = b.score != null ? b.score : -1;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return b.completitud - a.completitud;
    });

    const top50 = candidatosConCompletitud.slice(0, 50).map(c => {
      const { completitud, ...rest } = c;
      return parseSkills(rest);
    });

    const normalizeCategory = (c) => {
      const cat = (c.categoria || c.area || c.job_title || '').toString().toLowerCase();
      if (/editor|edición|edicion|video edit/.test(cat)) return 'Editores';
      if (/animación|animacion|motion|after effects|2d|3d/.test(cat)) return 'Animación';
      if (c.categoria && c.categoria.trim()) return c.categoria.trim();
      if (c.area && c.area.trim()) return c.area.trim();
      return 'Otros';
    };

    const byCategory = {};
    top50.forEach(c => {
      const key = normalizeCategory(c);
      if (!byCategory[key]) byCategory[key] = [];
      byCategory[key].push(c);
    });

    const order = ['Editores', 'Animación'];
    const rest = Object.keys(byCategory).filter(k => !order.includes(k)).sort();
    const sortedKeys = [...order.filter(k => byCategory[k]?.length), ...rest];

    const categorias = sortedKeys.map(nombre => ({
      nombre,
      candidatos: byCategory[nombre] || []
    }));

    res.json({ categorias });
  } catch (error) {
    console.error('Error al obtener candidatos por categoría:', error);
    res.status(500).json({ error: 'Error al obtener candidatos por categoría' });
  }
});

// Endpoint para obtener todos los candidatos con filtros
app.get('/api/candidatos', (req, res) => {
  try {
    const { categoria, area, job_title, skills, search } = req.query;
    
    let query = 'SELECT * FROM candidatos WHERE 1=1';
    const params = [];

    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }

    if (area) {
      query += ' AND area = ?';
      params.push(area);
    }

    if (job_title) {
      query += ' AND job_title = ?';
      params.push(job_title);
    }

    if (skills) {
      query += ' AND skills LIKE ?';
      params.push(`%${skills}%`);
    }

    if (search) {
      query += ' AND (nombre LIKE ? OR email LIKE ? OR skills LIKE ? OR job_title LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ' AND (score IS NULL OR score <= 10)';
    
    query += ' ORDER BY CASE WHEN score IS NULL THEN 1 ELSE 0 END, score DESC, fecha_aplicacion DESC';

    const candidatos = db.prepare(query).all(...params);
    
    const candidatosConCompletitud = candidatos.map(c => ({
      ...c,
      completitud: calcularCompletitud(c)
    }));

    candidatosConCompletitud.sort((a, b) => {
      const scoreA = a.score != null ? a.score : -1;
      const scoreB = b.score != null ? b.score : -1;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return b.completitud - a.completitud;
    });

    const candidatosFormateados = candidatosConCompletitud.map(c => {
      const { completitud, ...rest } = c;
      return {
        ...rest,
        skills: rest.skills ? rest.skills.split(',').map(s => s.trim()) : []
      };
    });

    res.json(candidatosFormateados);
  } catch (error) {
    console.error('Error al obtener candidatos:', error);
    res.status(500).json({ error: 'Error al obtener candidatos' });
  }
});

// Endpoint para obtener un candidato por ID
app.get('/api/candidatos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const candidato = db.prepare('SELECT * FROM candidatos WHERE id = ?').get(id);
    
    if (!candidato) {
      return res.status(404).json({ error: 'Candidato no encontrado' });
    }

    candidato.skills = candidato.skills ? candidato.skills.split(',').map(s => s.trim()) : [];

    res.json(candidato);
  } catch (error) {
    console.error('Error al obtener candidato:', error);
    res.status(500).json({ error: 'Error al obtener candidato' });
  }
});

// Endpoint para obtener valores únicos para filtros
app.get('/api/filtros', (req, res) => {
  try {
    const categorias = db.prepare("SELECT DISTINCT categoria FROM candidatos WHERE categoria IS NOT NULL AND TRIM(categoria) != ''").all().map(r => r.categoria);
    const areas = db.prepare("SELECT DISTINCT area FROM candidatos WHERE area IS NOT NULL AND TRIM(area) != ''").all().map(r => r.area);
    const jobTitles = db.prepare("SELECT DISTINCT job_title FROM candidatos WHERE job_title IS NOT NULL AND TRIM(job_title) != ''").all().map(r => r.job_title);
    
    const allSkills = db.prepare("SELECT DISTINCT skills FROM candidatos WHERE skills IS NOT NULL AND TRIM(skills) != ''").all();
    const skillsSet = new Set();
    allSkills.forEach(row => {
      if (row.skills) {
        row.skills.split(',').forEach(skill => {
          skillsSet.add(skill.trim());
        });
      }
    });

    res.json({
      categorias: categorias.sort(),
      areas: areas.sort(),
      jobTitles: jobTitles.sort(),
      skills: Array.from(skillsSet).sort()
    });
  } catch (error) {
    console.error('Error al obtener filtros:', error);
    res.status(500).json({ error: 'Error al obtener filtros' });
  }
});

// Exportar para Vercel Serverless Functions
// Vercel espera un handler que reciba (req, res)
module.exports = (req, res) => {
  // Manejar todas las rutas con Express
  app(req, res);
};
