# Cómo actualizar los candidatos en la web

Cuando tengas un Excel nuevo (o el mismo actualizado) con candidatos, sigue estos pasos.

## Paso 1: Ejecutar el script desde tu Mac

Abre la **terminal** y ve a la carpeta del proyecto:

```bash
cd /Users/juanariasflores/Desktop/Cursor_TalentoVidens
```

Instala la herramienta para leer Excel (solo la primera vez):

```bash
npm install
```

Luego ejecuta el script pasando la **ruta de tu archivo Excel**:

**Si el Excel está en el NAS (ruta por defecto):**
```bash
npm run update-data
```

**Si el Excel está en otra carpeta**, pásala entre comillas:
```bash
node scripts/update-from-excel.cjs "/ruta/completa/a/tu/archivo.xlsx"
```

Ejemplo si lo tienes en el Escritorio:
```bash
node scripts/update-from-excel.cjs "/Users/juanariasflores/Desktop/consolidated_candidates_v6.xlsx"
```

Verás algo como: `✅ Guardados 1200 candidatos en public/candidatos.json`.

## Paso 2: Subir los cambios a GitHub

En la misma terminal:

```bash
git add public/candidatos.json
git commit -m "Actualizar candidatos"
git push
```

## Paso 3: Listo

Vercel detectará el cambio y volverá a desplegar la web en unos minutos. Al abrir tu dominio verás los datos nuevos.

---

**Resumen:**  
1) `npm run update-data` (o con la ruta de tu Excel)  
2) `git add public/candidatos.json` → `git commit -m "Actualizar candidatos"` → `git push`
