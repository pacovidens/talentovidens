/**
 * Talento Videns - App única para Vercel y local.
 * En Vercel usa sql.js (WASM, sin compilación nativa). En local usa better-sqlite3.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = !!process.env.VERCEL;

app.use(cors());
app.use(express.json());

// --- Base de datos: better-sqlite3 (local) o sql.js (Vercel) ---
let db = null;
let dbReady = null;

function initDbLocal() {
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'server', 'database.db');
  const d = new Database(dbPath);
  d.exec(`
    CREATE TABLE IF NOT EXISTS candidatos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT, telefono TEXT, categoria TEXT, area TEXT, job_title TEXT, skills TEXT,
      video_link TEXT, reel_link TEXT, portfolio_link TEXT, experiencia TEXT, educacion TEXT,
      fecha_aplicacion DATETIME DEFAULT CURRENT_TIMESTAMP, notas TEXT, score REAL, linkedin_link TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_categoria ON candidatos(categoria);
    CREATE INDEX IF NOT EXISTS idx_area ON candidatos(area);
    CREATE INDEX IF NOT EXISTS idx_job_title ON candidatos(job_title);
  `);
  try { d.prepare('ALTER TABLE candidatos ADD COLUMN score REAL').run(); } catch (e) {}
  try { d.prepare('ALTER TABLE candidatos ADD COLUMN linkedin_link TEXT').run(); } catch (e) {}
  return d;
}

async function initDbVercel() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const source = path.join(__dirname, 'server', 'database.db');
  if (!fs.existsSync(source)) throw new Error('server/database.db no encontrado');
  const buf = fs.readFileSync(source);
  const sqlDb = new SQL.Database(buf);

  // Adapter: misma API que better-sqlite3 (prepare().all() / .get())
  return {
    prepare(sql) {
      return {
        all(...params) {
          const stmt = sqlDb.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
        get(...params) {
          const stmt = sqlDb.prepare(sql);
          stmt.bind(params);
          const row = stmt.step() ? stmt.getAsObject() : null;
          stmt.free();
          return row;
        }
      };
    },
    exec(sql) {
      sqlDb.run(sql);
    }
  };
}

function getDb() {
  if (db) return Promise.resolve(db);
  if (dbReady) return dbReady;
  if (isVercel) {
    dbReady = initDbVercel().then(d => { db = d; return d; });
    return dbReady;
  }
  db = initDbLocal();
  return Promise.resolve(db);
}

// Inicializar DB al arranque (local ya está listo)
if (!isVercel) {
  db = initDbLocal();
}

function calcularCompletitud(c) {
  const campos = [c.email, c.telefono, c.categoria, c.area, c.job_title, c.skills, c.video_link, c.reel_link, c.portfolio_link, c.linkedin_link, c.experiencia, c.educacion, c.notas];
  return campos.filter(x => x && String(x).trim() !== '').length / campos.length;
}

app.get('/api/candidatos-por-categoria', async (req, res) => {
  try {
    const database = await getDb();
    const all = database.prepare(`
      SELECT * FROM candidatos WHERE (score IS NULL OR score <= 10)
      ORDER BY CASE WHEN score IS NULL THEN 1 ELSE 0 END, score DESC, fecha_aplicacion DESC
    `).all();
    const withComp = all.map(c => ({ ...c, completitud: calcularCompletitud(c) }));
    withComp.sort((a, b) => {
      const sa = a.score != null ? a.score : -1, sb = b.score != null ? b.score : -1;
      if (sa !== sb) return sb - sa;
      return b.completitud - a.completitud;
    });
    const top50 = withComp.slice(0, 50);
    const normalize = (c) => {
      const t = (c.categoria || c.area || c.job_title || '').toLowerCase();
      if (/editor|edición|edicion|video edit/.test(t)) return 'Editores';
      if (/animación|animacion|motion|after effects|2d|3d/.test(t)) return 'Animación';
      if (c.categoria && c.categoria.trim()) return c.categoria.trim();
      if (c.area && c.area.trim()) return c.area.trim();
      return 'Otros';
    };
    const byCat = {};
    top50.forEach(c => {
      const k = normalize(c);
      if (!byCat[k]) byCat[k] = [];
      byCat[k].push({ ...c, skills: c.skills ? c.skills.split(',').map(s => s.trim()) : [] });
    });
    const order = ['Editores', 'Animación'];
    const rest = Object.keys(byCat).filter(k => !order.includes(k)).sort();
    const cats = [...order.filter(k => byCat[k]?.length), ...rest].map(nombre => ({ nombre, candidatos: byCat[nombre] || [] }));
    res.json({ categorias: cats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/candidatos', async (req, res) => {
  try {
    const database = await getDb();
    const { categoria, area, job_title, skills, search } = req.query;
    let q = 'SELECT * FROM candidatos WHERE 1=1 AND (score IS NULL OR score <= 10)';
    const p = [];
    if (categoria) { q += ' AND categoria = ?'; p.push(categoria); }
    if (area) { q += ' AND area = ?'; p.push(area); }
    if (job_title) { q += ' AND job_title = ?'; p.push(job_title); }
    if (skills) { q += ' AND skills LIKE ?'; p.push(`%${skills}%`); }
    if (search) {
      q += ' AND (nombre LIKE ? OR email LIKE ? OR skills LIKE ? OR job_title LIKE ?)';
      const s = `%${search}%`;
      p.push(s, s, s, s);
    }
    q += ' ORDER BY CASE WHEN score IS NULL THEN 1 ELSE 0 END, score DESC, fecha_aplicacion DESC';
    const rows = database.prepare(q).all(...p);
    const withComp = rows.map(c => ({ ...c, completitud: calcularCompletitud(c) }));
    withComp.sort((a, b) => {
      const sa = a.score != null ? a.score : -1, sb = b.score != null ? b.score : -1;
      if (sa !== sb) return sb - sa;
      return b.completitud - a.completitud;
    });
    const out = withComp.map(c => {
      const { completitud, ...r } = c;
      return { ...r, skills: r.skills ? r.skills.split(',').map(s => s.trim()) : [] };
    });
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/candidatos/:id', async (req, res) => {
  try {
    const database = await getDb();
    const c = database.prepare('SELECT * FROM candidatos WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ error: 'No encontrado' });
    c.skills = c.skills ? c.skills.split(',').map(s => s.trim()) : [];
    res.json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/filtros', async (req, res) => {
  try {
    const database = await getDb();
    const categorias = database.prepare("SELECT DISTINCT categoria FROM candidatos WHERE categoria IS NOT NULL AND TRIM(categoria) != ''").all().map(r => r.categoria);
    const areas = database.prepare("SELECT DISTINCT area FROM candidatos WHERE area IS NOT NULL AND TRIM(area) != ''").all().map(r => r.area);
    const jobTitles = database.prepare("SELECT DISTINCT job_title FROM candidatos WHERE job_title IS NOT NULL AND TRIM(job_title) != ''").all().map(r => r.job_title);
    const allSkills = database.prepare("SELECT DISTINCT skills FROM candidatos WHERE skills IS NOT NULL AND TRIM(skills) != ''").all();
    const skillsSet = new Set();
    allSkills.forEach(row => { if (row.skills) row.skills.split(',').forEach(s => skillsSet.add(s.trim())); });
    res.json({ categorias: categorias.sort(), areas: areas.sort(), jobTitles: jobTitles.sort(), skills: Array.from(skillsSet).sort() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Frontend estático
const distPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

module.exports = app;

if (!isVercel) {
  app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
}
