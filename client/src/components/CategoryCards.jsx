import { useState, useEffect } from 'react'
import axios from 'axios'
import CandidateCard from './CandidateCard'
import { Film, Scissors, FolderOpen, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'

const CATEGORY_ICONS = {
  'Editores': Scissors,
  'Animación': Film,
  'Otros': FolderOpen
}

function CategoryCards({ onSelectCandidate, candidatoSeleccionado }) {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    axios.get(`${API_URL}/candidatos-por-categoria`)
      .then(res => { if (!cancelled) setCategorias(res.data.categorias || []) })
      .catch(() => { if (!cancelled) setCategorias([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!categorias.length) return null

  return (
    <div className="space-y-10">
      {categorias.map(({ nombre, candidatos }) => {
        const Icon = CATEGORY_ICONS[nombre] || FolderOpen
        if (!candidatos.length) return null
        return (
          <section key={nombre} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Icon className="h-5 w-5 text-blue-600" />
                {nombre}
                <span className="text-sm font-normal text-gray-500">({candidatos.length})</span>
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {candidatos.map(candidato => (
                  <CandidateCard
                    key={candidato.id}
                    candidato={candidato}
                    showScore
                    isSelected={candidatoSeleccionado?.id === candidato.id}
                    onSelect={() => onSelectCandidate(
                      candidatoSeleccionado?.id === candidato.id ? null : candidato
                    )}
                  />
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default CategoryCards
