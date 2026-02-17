#!/bin/bash
# Script para inicializar Git y preparar para GitHub/Vercel

echo "🚀 Configurando Git para Talento Videns..."

# Inicializar git si no existe
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio Git..."
    git init
    git branch -M main
fi

# Verificar que la base de datos existe
if [ ! -f "server/database.db" ]; then
    echo "⚠️  ADVERTENCIA: server/database.db no existe"
    echo "   Ejecuta primero: cd server && npm run seed"
    exit 1
fi

# Agregar todos los archivos
echo "📝 Agregando archivos..."
git add .

# Crear commit inicial
echo "💾 Creando commit inicial..."
git commit -m "Initial commit: Talento Videns platform

- Frontend React + Vite + Tailwind CSS
- Backend Express + SQLite
- API Serverless para Vercel
- Base de datos con 1215 candidatos
- Sistema de filtros y búsqueda avanzada
- Priorización por score y completitud"

echo ""
echo "✅ Repositorio Git inicializado!"
echo ""
echo "📤 Próximos pasos:"
echo "   1. Crea un repositorio en GitHub: https://github.com/new"
echo "   2. Ejecuta estos comandos:"
echo ""
echo "      git remote add origin https://github.com/TU_USUARIO/talento-videns.git"
echo "      git push -u origin main"
echo ""
echo "   3. Luego despliega en Vercel siguiendo DEPLOY.md"
