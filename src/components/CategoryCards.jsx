import CandidateCard from './CandidateCard'
import { Film, Scissors, FolderOpen } from 'lucide-react'

const ICONS = { 'Editores': Scissors, 'Animación': Film }

export default function CategoryCards({ categorias, selected, onSelect }) {
  if (!categorias?.length) return null
  return (
    <div className="space-y-10">
      {categorias.map(({ nombre, candidatos }) => {
        const Icon = ICONS[nombre] || FolderOpen
        if (!candidatos?.length) return null
        return (
          <section key={nombre} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/80">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Icon className="h-5 w-5 text-blue-600" />
                {nombre}
                <span className="text-sm font-normal text-gray-500">({candidatos.length})</span>
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {candidatos.map(c => (
                <CandidateCard
                  key={c.id}
                  candidato={c}
                  showScore
                  isSelected={selected?.id === c.id}
                  onSelect={() => onSelect(selected?.id === c.id ? null : c)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
