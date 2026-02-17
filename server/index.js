const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar base de datos
const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.db');
const db = new Database(dbPath);

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
    notas TEXT
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
    // Filtrar scores <= 10 y ordenar por score DESC, luego por completitud DESC
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

    // Calcular completitud y ordenar
    const candidatosConCompletitud = all.map(c => ({
      ...c,
      completitud: calcularCompletitud(c)
    }));

    // Ordenar por score DESC, luego por completitud DESC
    candidatosConCompletitud.sort((a, b) => {
      const scoreA = a.score != null ? a.score : -1;
      const scoreB = b.score != null ? b.score : -1;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Score DESC
      }
      return b.completitud - a.completitud; // Completitud DESC
    });

    // Limitar a 50 candidatos
    const top50 = candidatosConCompletitud.slice(0, 50).map(c => {
      const { completitud, ...rest } = c;
      return parseSkills(rest);
    });

    // Normalizar nombre de categoría para agrupar (Editores, Animación, etc.)
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

    // Orden de secciones: Editores y Animación primero, luego el resto alfabético
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

    // Filtrar scores <= 10
    query += ' AND (score IS NULL OR score <= 10)';
    
    query += ' ORDER BY CASE WHEN score IS NULL THEN 1 ELSE 0 END, score DESC, fecha_aplicacion DESC';

    const candidatos = db.prepare(query).all(...params);
    
    // Calcular completitud y reordenar por score y completitud
    const candidatosConCompletitud = candidatos.map(c => ({
      ...c,
      completitud: calcularCompletitud(c)
    }));

    candidatosConCompletitud.sort((a, b) => {
      const scoreA = a.score != null ? a.score : -1;
      const scoreB = b.score != null ? b.score : -1;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Score DESC
      }
      return b.completitud - a.completitud; // Completitud DESC
    });
    
    // Parsear skills de string a array y remover completitud
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

    // Parsear skills
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
    
    // Obtener todas las skills únicas
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

// Endpoint para crear un candidato (opcional, para testing)
app.post('/api/candidatos', (req, res) => {
  try {
    const {
      nombre,
      email,
      telefono,
      categoria,
      area,
      job_title,
      skills,
      video_link,
      reel_link,
      portfolio_link,
      experiencia,
      educacion,
      notas,
      score
    } = req.body;

    const skillsStr = Array.isArray(skills) ? skills.join(', ') : skills;

    const stmt = db.prepare(`
      INSERT INTO candidatos (
        nombre, email, telefono, categoria, area, job_title, skills,
        video_link, reel_link, portfolio_link, experiencia, educacion, notas, score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nombre,
      email,
      telefono,
      categoria,
      area,
      job_title,
      skillsStr,
      video_link,
      reel_link,
      portfolio_link,
      experiencia,
      educacion,
      notas,
      score != null ? score : null
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Candidato creado exitosamente' });
  } catch (error) {
    console.error('Error al crear candidato:', error);
    res.status(500).json({ error: 'Error al crear candidato' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
