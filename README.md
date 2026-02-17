# Talento Videns - Plataforma de Gestión de Talento Humano

Plataforma web para gestionar y buscar candidatos que han aplicado para trabajar en tu empresa. Incluye funcionalidades de búsqueda avanzada con múltiples filtros y visualización de links de video, reel y portafolio.

## Características

- 🔍 **Búsqueda avanzada**: Busca por nombre, email, skills o puesto
- 🎯 **Filtros múltiples**: Filtra por categoría, área, puesto y skills
- 📹 **Links desplegables**: Visualiza videos, reels, portafolios y LinkedIn de cada candidato
- 📱 **Diseño responsive**: Funciona perfectamente en desktop y móvil
- ⚡ **Rápido y eficiente**: Búsquedas instantáneas con base de datos SQLite
- ⭐ **Priorización por score**: Muestra los 50 mejores candidatos ordenados por score y completitud

## Tecnologías

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Base de datos**: SQLite (better-sqlite3)
- **Deployment**: Vercel (Serverless Functions)

## Instalación Local

1. Instala las dependencias de todos los módulos:
```bash
npm run install-all
```

2. Si tienes una base de datos existente, cópiala a `server/database.db` o actualiza la ruta en `server/.env`

3. Si no tienes una base de datos, la aplicación creará una automáticamente con la estructura necesaria.

## Uso Local

1. Inicia el servidor de desarrollo (frontend + backend):
```bash
npm run dev
```

2. Abre tu navegador en `http://localhost:3000`

3. El backend estará corriendo en `http://localhost:3001`

## Estructura de la Base de Datos

La tabla `candidatos` incluye los siguientes campos:
- `id`: ID único del candidato
- `nombre`: Nombre completo
- `email`: Correo electrónico
- `telefono`: Número de teléfono
- `categoria`: Categoría del candidato
- `area`: Área de trabajo / Location
- `job_title`: Puesto de trabajo
- `skills`: Skills separadas por comas
- `video_link`: Link al video del candidato
- `reel_link`: Link al reel del candidato
- `portfolio_link`: Link al portafolio / Resume
- `linkedin_link`: Link al perfil de LinkedIn
- `experiencia`: Información de experiencia
- `educacion`: Información educativa
- `fecha_aplicacion`: Fecha de aplicación
- `notas`: Notas adicionales / Comments
- `score`: Score del candidato (0-10)

## Importar desde Excel

Para cargar los candidatos desde tu archivo Excel:

```bash
cd server
node import-xlsx.js "ruta/a/tu/archivo.xlsx"
```

El script detecta automáticamente columnas como:
- Name → nombre
- Email → email
- Category → categoria
- Job Titles → job_title
- Skills → skills
- Video Link → video_link
- Resume → portfolio_link
- Location → area
- Linkdedin → linkedin_link
- Score → score
- Comments → notas

## Scripts Disponibles

- `npm run dev`: Inicia frontend y backend en modo desarrollo
- `npm run server`: Solo inicia el backend
- `npm run client`: Solo inicia el frontend
- `npm run build`: Construye el frontend para producción
- `npm run seed`: (en `server`) Inserta candidatos de ejemplo
- `npm run import-xlsx`: (en `server`) Importa desde el Excel consolidado

## Deployment

Para desplegar en Vercel, consulta [DEPLOY.md](./DEPLOY.md) para instrucciones detalladas.

### Resumen rápido:

1. Sube el código a GitHub
2. Conecta el repositorio en Vercel
3. Configura el build:
   - Build Command: `cd client && npm install && npm run build`
   - Output Directory: `client/dist`
4. Deploy!

## Personalización

Puedes personalizar:
- Los colores en `client/tailwind.config.js`
- Los endpoints de la API en `server/index.js` o `api/index.js`
- Los componentes en `client/src/components/`

## Notas Importantes

- **Score**: Solo se consideran candidatos con score ≤ 10
- **Límite**: La página inicial muestra máximo 50 candidatos (mejores por score y completitud)
- **Base de datos**: En producción (Vercel), la DB se copia a `/tmp` en cada función serverless. Los cambios no persisten entre requests.
