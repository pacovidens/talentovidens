import { useState, useEffect } from 'react'
import axios from 'axios'
import SearchBar from './components/SearchBar'
import Filters from './components/Filters'
import CandidateCard from './components/CandidateCard'
import CategoryCards from './components/CategoryCards'
import { Search } from 'lucide-react'

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'

function App() {
  const [candidatos, setCandidatos] = useState([])
  const [filtros, setFiltros] = useState({
    categorias: [],
    areas: [],
    jobTitles: [],
    skills: []
  })
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    categoria: '',
    area: '',
    job_title: '',
    skills: '',
    search: ''
  })
  const [loading, setLoading] = useState(true)
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null)

  useEffect(() => {
    cargarFiltros()
    cargarCandidatos()
  }, [])

  useEffect(() => {
    cargarCandidatos()
  }, [filtrosAplicados])

  const cargarFiltros = async () => {
    try {
      const response = await axios.get(`${API_URL}/filtros`)
      setFiltros(response.data)
    } catch (error) {
      console.error('Error al cargar filtros:', error)
    }
  }

  const cargarCandidatos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.keys(filtrosAplicados).forEach(key => {
        if (filtrosAplicados[key]) {
          params.append(key, filtrosAplicados[key])
        }
      })

      const response = await axios.get(`${API_URL}/candidatos?${params.toString()}`)
      setCandidatos(response.data)
    } catch (error) {
      console.error('Error al cargar candidatos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltroChange = (key, value) => {
    setFiltrosAplicados(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const limpiarFiltros = () => {
    setFiltrosAplicados({
      categoria: '',
      area: '',
      job_title: '',
      skills: '',
      search: ''
    })
  }

  const tieneFiltrosActivos = Object.values(filtrosAplicados).some(val => val !== '')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Talento Videns</h1>
          <p className="mt-2 text-sm text-gray-600">Plataforma de gestión de talento humano</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de búsqueda y filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <SearchBar
            value={filtrosAplicados.search}
            onChange={(value) => handleFiltroChange('search', value)}
          />
          
          <Filters
            filtros={filtros}
            filtrosAplicados={filtrosAplicados}
            onChange={handleFiltroChange}
            onClear={limpiarFiltros}
            tieneFiltrosActivos={tieneFiltrosActivos}
          />
        </div>

        {/* Tarjetas por categoría (Editores, Animación, etc.) — prioridad por score */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Candidatos por categoría</h2>
          <CategoryCards
            onSelectCandidate={setCandidatoSeleccionado}
            candidatoSeleccionado={candidatoSeleccionado}
          />
        </div>

        {/* Resultados de búsqueda */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {loading ? 'Cargando...' : `${candidatos.length} candidato${candidatos.length !== 1 ? 's' : ''} encontrado${candidatos.length !== 1 ? 's' : ''}`}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : candidatos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron candidatos</h3>
            <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidatos.map(candidato => (
              <CandidateCard
                key={candidato.id}
                candidato={candidato}
                showScore
                isSelected={candidatoSeleccionado?.id === candidato.id}
                onSelect={() => setCandidatoSeleccionado(
                  candidatoSeleccionado?.id === candidato.id ? null : candidato
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
