# Guía de Deployment - Talento Videns

## Cómo está hecho

- **Una sola app Express** en la raíz (`index.js`) que:
  - Sirve la API en `/api/*`
  - Sirve el frontend estático desde `client/dist` (tras el build)
- **Vercel** ejecuta `npm run build` (genera `client/dist`) y usa `index.js` como función serverless.

## Desplegar en Vercel

### Prerequisitos
1. Cuenta en [Vercel](https://vercel.com)
2. Cuenta en [GitHub](https://github.com)
3. Git instalado localmente

### Paso 1: Subir a GitHub

1. **Inicializar repositorio Git** (si no lo has hecho):
```bash
cd /Users/juanariasflores/Desktop/Cursor_TalentoVidens
git init
git add .
git commit -m "Initial commit: Talento Videns platform"
```

2. **Crear repositorio en GitHub**:
   - Ve a https://github.com/new
   - Crea un nuevo repositorio (ej: `talento-videns`)
   - **NO** inicialices con README, .gitignore o licencia

3. **Conectar y subir**:
```bash
git remote add origin https://github.com/TU_USUARIO/talento-videns.git
git branch -M main
git push -u origin main
```

### Paso 2: Desplegar en Vercel

1. **Conectar con GitHub**:
   - Ve a https://vercel.com
   - Inicia sesión con GitHub
   - Click en "Add New Project"
   - Selecciona el repositorio `talento-videns`

2. **Configuración del proyecto**:
   - **Root Directory**: déjalo vacío (raíz del repo)
   - **Framework Preset**: Other (o Vite, no importa)
   - **Build Command**: `npm run build` (ya está en vercel.json)
   - **Output Directory**: no configurar (la app Express sirve todo)
   - **Install Command**: `npm install` (por defecto)

3. **Variables de entorno** (opcional):
   - No necesitas variables de entorno para el deployment básico

4. **Deploy**:
   - Click en "Deploy"
   - Espera a que termine el build (2-3 minutos)

### Paso 3: Configurar la base de datos

**IMPORTANTE**: La base de datos SQLite debe estar incluida en el repositorio para que funcione en Vercel.

1. **Asegúrate de que `server/database.db` esté en el repositorio**:
```bash
# Verificar que no esté en .gitignore (debe estar comentado o removido)
# El archivo server/database.db debe estar trackeado por git
git add server/database.db
git commit -m "Add database file"
git push
```

2. **Nota sobre la base de datos**:
   - En Vercel, la base de datos se copia a `/tmp` en cada función serverless
   - Los cambios NO persisten entre requests (solo lectura)
   - Para escritura persistente, considera usar un servicio externo (PostgreSQL, MongoDB, etc.)

### Paso 4: Verificar el deployment

1. Una vez desplegado, Vercel te dará una URL como: `https://talento-videns.vercel.app`
2. Visita la URL y verifica que la app funcione
3. Prueba los endpoints:
   - `https://tu-app.vercel.app/api/candidatos-por-categoria`
   - `https://tu-app.vercel.app/api/filtros`

### Estructura del proyecto para Vercel

```
talento-videns/
├── api/
│   ├── index.js          # Serverless function para Vercel
│   └── package.json      # Dependencias del API
├── client/
│   ├── src/              # Código React
│   ├── dist/             # Build output (generado)
│   └── package.json
├── server/
│   ├── database.db       # Base de datos (debe estar en git)
│   └── index.js          # Servidor local (no usado en Vercel)
├── vercel.json           # Configuración de Vercel
└── package.json          # Scripts principales
```

### Troubleshooting

**Problema**: La base de datos no se encuentra
- **Solución**: Asegúrate de que `server/database.db` esté en el repositorio y no en `.gitignore`

**Problema**: Error 500 en los endpoints
- **Solución**: Revisa los logs en Vercel Dashboard > Deployments > [tu deployment] > Functions

**Problema**: Build falla
- **Solución**: Verifica que todas las dependencias estén en `package.json` y que el build command sea correcto

### Actualizar la base de datos

Para actualizar la base de datos en producción:

1. **Localmente**:
```bash
cd server
node import-xlsx.js "ruta/al/archivo.xlsx"
```

2. **Commit y push**:
```bash
git add server/database.db
git commit -m "Update database"
git push
```

3. **Vercel redeploy automático**:
   - Vercel detectará el cambio y redeployará automáticamente
   - O puedes hacer redeploy manual desde el dashboard

### Dominio personalizado

1. En Vercel Dashboard > Settings > Domains
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar DNS
