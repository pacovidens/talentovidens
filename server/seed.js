const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

// Datos de ejemplo (Editores y Animación con score para prioridad)
const candidatosEjemplo = [
  {
    nombre: 'María González',
    email: 'maria.gonzalez@email.com',
    telefono: '+34 600 123 456',
    categoria: 'Editores',
    area: 'Postproducción',
    job_title: 'Editora de video',
    skills: 'Premiere, DaVinci, After Effects, color grading',
    video_link: 'https://www.youtube.com/watch?v=ejemplo1',
    reel_link: 'https://www.instagram.com/reel/ejemplo1',
    portfolio_link: 'https://mariagonzalez.dev',
    experiencia: '5 años de experiencia en edición',
    educacion: 'Comunicación Audiovisual',
    notas: 'Excelente candidata con gran portfolio',
    score: 9.2
  },
  {
    nombre: 'Juan Pérez',
    email: 'juan.perez@email.com',
    telefono: '+34 600 234 567',
    categoria: 'Animación',
    area: 'Creatividad',
    job_title: 'Animador 2D / Motion',
    skills: 'After Effects, Motion, Illustrator, animación 2D',
    video_link: 'https://www.youtube.com/watch?v=ejemplo2',
    reel_link: null,
    portfolio_link: 'https://juanperez.design',
    experiencia: '3 años en motion graphics',
    educacion: 'Diseño Gráfico',
    notas: 'Portfolio muy creativo',
    score: 8.8
  },
  {
    nombre: 'Ana Martínez',
    email: 'ana.martinez@email.com',
    telefono: '+34 600 345 678',
    categoria: 'Editores',
    area: 'Comunicación',
    job_title: 'Editora de contenido',
    skills: 'Premiere, edición rápida, subtítulos, multicámara',
    video_link: null,
    reel_link: 'https://www.instagram.com/reel/ejemplo3',
    portfolio_link: 'https://anamartinez.marketing',
    experiencia: '4 años en edición digital',
    educacion: 'Marketing y Publicidad',
    notas: 'Gran experiencia en redes sociales',
    score: 7.5
  },
  {
    nombre: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@email.com',
    telefono: '+34 600 456 789',
    categoria: 'Animación',
    area: 'Tecnología',
    job_title: 'Animador 3D',
    skills: 'Cinema 4D, Blender, 3D, VFX',
    video_link: 'https://www.youtube.com/watch?v=ejemplo4',
    reel_link: null,
    portfolio_link: 'https://carlosrodriguez.dev',
    experiencia: '6 años en animación 3D',
    educacion: 'Animación Digital',
    notas: 'Experto en motion y VFX',
    score: 9.0
  },
  {
    nombre: 'Laura Sánchez',
    email: 'laura.sanchez@email.com',
    telefono: '+34 600 567 890',
    categoria: 'Diseño',
    area: 'Creatividad',
    job_title: 'Diseñadora Gráfica',
    skills: 'Illustrator, Photoshop, InDesign, Branding',
    video_link: null,
    reel_link: 'https://www.instagram.com/reel/ejemplo5',
    portfolio_link: 'https://laurasanchez.design',
    experiencia: '2 años en diseño gráfico',
    educacion: 'Diseño Gráfico',
    notas: 'Especializada en branding',
    score: 8.0
  }
];

// Limpiar tabla si existe
db.exec('DELETE FROM candidatos');

// Añadir columna score si no existe
try { db.prepare('ALTER TABLE candidatos ADD COLUMN score REAL').run(); } catch (e) { if (!e.message.includes('duplicate column')) throw e; }

// Insertar candidatos de ejemplo
const stmt = db.prepare(`
  INSERT INTO candidatos (
    nombre, email, telefono, categoria, area, job_title, skills,
    video_link, reel_link, portfolio_link, experiencia, educacion, notas, score
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((candidatos) => {
  for (const candidato of candidatos) {
    stmt.run(
      candidato.nombre,
      candidato.email,
      candidato.telefono,
      candidato.categoria,
      candidato.area,
      candidato.job_title,
      candidato.skills,
      candidato.video_link,
      candidato.reel_link,
      candidato.portfolio_link,
      candidato.experiencia,
      candidato.educacion,
      candidato.notas,
      candidato.score != null ? candidato.score : null
    );
  }
});

insertMany(candidatosEjemplo);

console.log(`✅ Se insertaron ${candidatosEjemplo.length} candidatos de ejemplo`);
db.close();
