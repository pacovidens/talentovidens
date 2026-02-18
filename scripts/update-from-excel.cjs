/**
 * Actualiza public/candidatos.json desde tu Excel.
 * Uso: node scripts/update-from-excel.cjs "ruta/a/tu/archivo.xlsx"
 * Si no pasas ruta, usa la del NAS por defecto.
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DEFAULT_EXCEL = '/Volumes/Videns_NAS/Administración/RH/2026/Julius/consolidated_candidates_for_google_sheets_v5.xlsx';
const excelPath = process.argv[2] || DEFAULT_EXCEL;
const outPath = path.join(__dirname, '..', 'public', 'candidatos.json');

const COLUMNS = {
  nombre: ['name', 'nombre', 'candidato'],
  email: ['email', 'correo'],
  telefono: ['phone', 'telefono', 'teléfono', 'celular'],
  categoria: ['category', 'categoria', 'categoría'],
  area: ['area', 'área', 'location', 'department'],
  job_title: ['job title', 'job titles', 'puesto', 'position'],
  skills: ['skills', 'habilidades'],
  video_link: ['video link', 'video', 'link video'],
  reel_link: ['reel', 'reel link', 'instagram'],
  portfolio_link: ['portfolio', 'portafolio', 'resume', 'cv'],
  linkedin_link: ['linkdedin', 'linkedin'],
  score: ['score', 'puntuación', 'rating'],
  notas: ['comments', 'notas', 'comentarios']
};

function normalize(s) {
  if (typeof s !== 'string') return '';
  return s.toLowerCase().trim();
}

function findColumnIndex(headers, keys) {
  for (let i = 0; i < headers.length; i++) {
    const h = normalize(headers[i]);
    if (keys.some(k => h.includes(normalize(k)) || normalize(k).includes(h)))
      return i;
  }
  return -1;
}

function get(row, i) {
  if (i < 0 || !row[i]) return '';
  const v = row[i];
  return (v != null && String(v).trim() !== '') ? String(v).trim() : '';
}

function getNum(row, i) {
  const s = get(row, i);
  if (!s) return null;
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

if (!fs.existsSync(excelPath)) {
  console.error('❌ No se encontró el archivo:', excelPath);
  console.log('   Uso: node scripts/update-from-excel.cjs "ruta/a/tu/archivo.xlsx"');
  process.exit(1);
}

console.log('📂 Leyendo:', excelPath);
const wb = XLSX.readFile(excelPath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

if (!data.length) {
  console.error('❌ La hoja está vacía');
  process.exit(1);
}

const headers = data[0].map(h => (h != null ? String(h) : ''));
const idx = {};
for (const [key, keys] of Object.entries(COLUMNS)) {
  idx[key] = findColumnIndex(headers, keys);
}

const candidatos = [];
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  const nombre = get(row, idx.nombre);
  if (!nombre) continue;

  const score = getNum(row, idx.score);
  if (score != null && score > 10) continue; // solo score <= 10

  const skillsStr = get(row, idx.skills);
  const skills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  candidatos.push({
    id: candidatos.length + 1,
    nombre,
    email: get(row, idx.email) || null,
    telefono: get(row, idx.telefono) || null,
    categoria: get(row, idx.categoria) || null,
    area: get(row, idx.area) || null,
    job_title: get(row, idx.job_title) || null,
    skills,
    video_link: get(row, idx.video_link) || null,
    reel_link: get(row, idx.reel_link) || null,
    portfolio_link: get(row, idx.portfolio_link) || null,
    linkedin_link: get(row, idx.linkedin_link) || null,
    score: score != null ? score : null,
    notas: get(row, idx.notas) || null
  });
}

fs.writeFileSync(outPath, JSON.stringify(candidatos), 'utf8');
console.log('✅ Guardados', candidatos.length, 'candidatos en public/candidatos.json');
console.log('');
console.log('Siguiente paso: sube los cambios a GitHub para que Vercel actualice la web.');
console.log('   git add public/candidatos.json');
console.log('   git commit -m "Actualizar candidatos"');
console.log('   git push');
