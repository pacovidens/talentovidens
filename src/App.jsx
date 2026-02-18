import { useState, useEffect, useMemo } from 'react'
import SearchBar from './components/SearchBar'
import Filters from './components/Filters'
import CandidateCard from './components/CandidateCard'
import CategoryCards from './components/CategoryCards'
import { Search } from 'lucide-react'

const DATA_URL = (import.meta.env.BASE_URL || '/') + 'candidatos.json'

function completitud(c) {
  const campos = [c.email, c.telefono, c.categoria, c.area, c.job_title, c.skills, c.video_link, c.reel_link, c.portfolio_link, c.linkedin_link, c.experiencia, c.educacion, c.notas]
  return campos.filter(x => x && String(x).trim() !== '').length / campos.length
}

function normalizeCategory(c) {
  const t = (c.categoria || c.area || c.job_title || '').toString().toLowerCase()
  if (/editor|edición|edicion|video edit/.test(t)) return 'Editores'
  if (/animación|animacion|motion|after effects|2d|3d/.test(t)) return 'Animación'
  if (c.categoria && c.categoria.trim()) return c.categoria.trim()
  if (c.area && c.area.trim()) return c.area.trim()
  return 'Otros'
}

export default function App() {
  const [raw, setRaw] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filtrosAplicados, setFiltrosAplicados] = useState({ categoria: '', area: '', job_title: '', skills: '' })
  const [selected, setSelected] = useState(null)

  const loadData = () => {
    setError(null)
    setLoading(true)
    fetch(DATA_URL)
      .then(r => {
        if (!r.ok) throw new Error('No se pudo cargar los datos')
        return r.json()
      })
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setRaw(list.map((c, i) => ({
          ...c,
          id: c.id ?? i + 1,
          skills: Array.isArray(c.skills) ? c.skills : (c.skills ? String(c.skills).split(',').map(s => s.trim()).filter(Boolean) : [])
        })))
      })
      .catch(err => {
        setError(err.message || 'Error al cargar')
        setRaw([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const sorted = useMemo(() => {
    const withComp = raw.map(c => ({ ...c, completitud: completitud(c) }))
    withComp.sort((a, b) => {
      const sa = a.score != null ? Number(a.score) : -1
      const sb = b.score != null ? Number(b.score) : -1
      if (sa !== sb) return sb - sa
      return b.completitud - a.completitud
    })
    return withComp
  }, [raw])

  const filtros = useMemo(() => {
    const categorias = [...new Set(raw.map(c => c.categoria).filter(Boolean))].sort()
    const areas = [...new Set(raw.map(c => c.area).filter(Boolean))].sort()
    const jobTitles = [...new Set(raw.map(c => c.job_title).filter(Boolean))].sort()
    const skillsSet = new Set()
    raw.forEach(c => (c.skills || []).forEach(s => { if (s && String(s).trim()) skillsSet.add(String(s).trim()) }))
    return { categorias, areas, jobTitles, skills: [...skillsSet].sort() }
  }, [raw])

  const top30 = useMemo(() => sorted.slice(0, 30), [sorted])
  const top50 = useMemo(() => sorted.slice(0, 50), [sorted])

  const categoriasParaSeccion = useMemo(() => {
    const byCat = {}
    top50.forEach(c => {
      const k = normalizeCategory(c)
      if (!byCat[k]) byCat[k] = []
      byCat[k].push(c)
    })
    const order = ['Editores', 'Animación']
    const rest = Object.keys(byCat).filter(k => !order.includes(k)).sort()
    return [...order.filter(k => byCat[k]?.length), ...rest].map(nombre => ({ nombre, candidatos: byCat[nombre] || [] }))
  }, [top50])

  const filtered = useMemo(() => {
    let list = [...sorted]
    const { categoria, area, job_title, skills } = filtrosAplicados || {}
    if (categoria) list = list.filter(c => String(c.categoria || '').trim() === String(categoria).trim())
    if (area) list = list.filter(c => String(c.area || '').trim() === String(area).trim())
    if (job_title) list = list.filter(c => String(c.job_title || '').trim() === String(job_title).trim())
    if (skills) {
      const skillLower = String(skills).toLowerCase().trim()
      list = list.filter(c => (c.skills || []).some(s => s && String(s).toLowerCase().includes(skillLower)))
    }
    const q = (search || '').toLowerCase().trim()
    if (q) {
      list = list.filter(c => {
        const nombre = String(c.nombre || '').toLowerCase()
        const email = String(c.email || '').toLowerCase()
        const cat = String(c.categoria || '').toLowerCase()
        const areaStr = String(c.area || '').toLowerCase()
        const job = String(c.job_title || '').toLowerCase()
        const skillsStr = (c.skills || []).map(s => String(s || '').toLowerCase()).join(' ')
        return nombre.includes(q) || email.includes(q) || cat.includes(q) || areaStr.includes(q) || job.includes(q) || skillsStr.includes(q)
      })
    }
    return list
  }, [sorted, filtrosAplicados, search])

  const handleFiltro = (key, value) => setFiltrosAplicados(prev => ({ ...prev, [key]: value }))
  const clearFiltros = () => setFiltrosAplicados({ categoria: '', area: '', job_title: '', skills: '' })
  const hasFiltros = Object.values(filtrosAplicados).some(Boolean)

  if (loading && raw.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-gray-600">Cargando candidatos...</p>
      </div>
    )
  }

  if (error && raw.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-gray-600 text-sm text-center">Si la app está en Vercel, comprueba que el archivo public/candidatos.json esté en el repositorio.</p>
        <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Reintentar</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Talento Videns</h1>
          <p className="mt-2 text-sm text-gray-600">Plataforma de talento humano</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <SearchBar value={search ?? ''} onChange={setSearch} />
          <Filters
            filtros={filtros}
            filtrosAplicados={filtrosAplicados}
            onChange={handleFiltro}
            onClear={clearFiltros}
            tieneFiltrosActivos={hasFiltros}
          />
        </div>

        {/* Top 30 por score: con video embebido */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top 30 por score</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {top30.map((c, i) => (
              <CandidateCard
                key={c.id ?? i}
                candidato={c}
                showScore
                embedVideo
                isSelected={selected?.id === c.id}
                onSelect={() => setSelected(selected?.id === c.id ? null : c)}
              />
            ))}
          </div>
        </div>

        {/* Resultados de búsqueda/filtros */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {filtered.length} candidato{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </h2>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center mb-8">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No hay candidatos con esos filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {filtered.map((c, i) => (
              <CandidateCard
                key={c.id ?? i}
                candidato={c}
                showScore
                isSelected={selected?.id === c.id}
                onSelect={() => setSelected(selected?.id === c.id ? null : c)}
              />
            ))}
          </div>
        )}

        {/* Tarjetas por categoría (top 50): más abajo */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Candidatos por categoría (top 50)</h2>
          <CategoryCards categorias={categoriasParaSeccion} selected={selected} onSelect={setSelected} />
        </div>
      </div>
    </div>
  )
}
