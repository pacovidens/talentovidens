import { X } from 'lucide-react'

export default function Filters({ filtros, filtrosAplicados, onChange, onClear, tieneFiltrosActivos }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            value={filtrosAplicados?.categoria ?? ''}
            onChange={(e) => onChange('categoria', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {filtros.categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
          <select
            value={filtrosAplicados?.area ?? ''}
            onChange={(e) => onChange('area', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {filtros.areas.map(area => <option key={area} value={area}>{area}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Puesto</label>
          <select
            value={filtrosAplicados?.job_title ?? ''}
            onChange={(e) => onChange('job_title', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {filtros.jobTitles.map(job => <option key={job} value={job}>{job}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
          <select
            value={filtrosAplicados?.skills ?? ''}
            onChange={(e) => onChange('skills', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {filtros.skills.map(skill => <option key={skill} value={skill}>{skill}</option>)}
          </select>
        </div>
      </div>
      {tieneFiltrosActivos && (
        <div className="flex justify-end">
          <button onClick={onClear} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <X className="h-4 w-4 mr-2" /> Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}
