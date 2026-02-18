# Talento Videns

Plataforma de talento humano (solo frontend). Los datos se cargan desde `public/candidatos.json`. Listo para Vercel.

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy en Vercel

El proyecto está preparado para Vercel: solo frontend, sin backend. Build: `npm run build`, output: `dist`.

## Actualizar datos

Exporta desde tu base de datos o Excel a `public/candidatos.json` (array de candidatos con campos: nombre, email, categoria, area, job_title, skills, video_link, reel_link, portfolio_link, linkedin_link, score, etc.).
