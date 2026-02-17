import { useState } from 'react'
import { User, Mail, Phone, Briefcase, MapPin, Calendar, Video, Film, Link as LinkIcon, Linkedin, ChevronDown, ChevronUp } from 'lucide-react'

function CandidateCard({ candidato, isSelected, onSelect, showScore = false }) {
  const [mostrarLinks, setMostrarLinks] = useState(false)

  const tieneLinks = candidato.video_link || candidato.reel_link || candidato.portfolio_link || candidato.linkedin_link
  const score = candidato.score != null && candidato.score !== '' ? Number(candidato.score) : null
  const hasHighScore = showScore && score != null && score >= 7

  return (
    <div
      className={`rounded-lg shadow-sm border-2 transition-all cursor-pointer ${
        isSelected ? 'border-blue-500 shadow-md bg-blue-50/30' : 'border-gray-200 bg-white hover:border-gray-300'
      } ${hasHighScore ? 'ring-1 ring-amber-200' : ''}`}
      onClick={onSelect}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-semibold text-gray-900">
                {candidato.nombre}
              </h3>
              {showScore && score != null && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  score >= 8 ? 'bg-emerald-100 text-emerald-800' :
                  score >= 6 ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  Score {score}
                </span>
              )}
            </div>
            {candidato.job_title && (
              <div className="flex items-center text-sm text-gray-600 mt-1 mb-2">
                <Briefcase className="h-4 w-4 mr-1" />
                {candidato.job_title}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full shrink-0">
            <User className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Información básica */}
        <div className="space-y-2 mb-4">
          {candidato.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <a href={`mailto:${candidato.email}`} className="hover:text-blue-600" onClick={(e) => e.stopPropagation()}>
                {candidato.email}
              </a>
            </div>
          )}
          {candidato.telefono && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              <a href={`tel:${candidato.telefono}`} className="hover:text-blue-600" onClick={(e) => e.stopPropagation()}>
                {candidato.telefono}
              </a>
            </div>
          )}
          {candidato.area && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              {candidato.area}
            </div>
          )}
          {candidato.categoria && (
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {candidato.categoria}
            </div>
          )}
        </div>

        {/* Skills */}
        {candidato.skills && candidato.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {candidato.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botón para mostrar/ocultar links */}
        {tieneLinks && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMostrarLinks(!mostrarLinks)
            }}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <span className="flex items-center">
              <LinkIcon className="h-4 w-4 mr-2" />
              Ver links (video, reel, portafolio, LinkedIn)
            </span>
            {mostrarLinks ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Links desplegables */}
        {mostrarLinks && tieneLinks && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3" onClick={(e) => e.stopPropagation()}>
            {candidato.video_link && (
              <a
                href={candidato.video_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group"
              >
                <Video className="h-5 w-5 mr-3 text-red-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Video</div>
                  <div className="text-xs text-gray-600 truncate">{candidato.video_link}</div>
                </div>
              </a>
            )}
            {candidato.reel_link && (
              <a
                href={candidato.reel_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
              >
                <Film className="h-5 w-5 mr-3 text-purple-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Reel</div>
                  <div className="text-xs text-gray-600 truncate">{candidato.reel_link}</div>
                </div>
              </a>
            )}
            {candidato.portfolio_link && (
              <a
                href={candidato.portfolio_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
              >
                <LinkIcon className="h-5 w-5 mr-3 text-green-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Portafolio / Resume</div>
                  <div className="text-xs text-gray-600 truncate">{candidato.portfolio_link}</div>
                </div>
              </a>
            )}
            {candidato.linkedin_link && (
              <a
                href={candidato.linkedin_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
              >
                <Linkedin className="h-5 w-5 mr-3 text-blue-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">LinkedIn</div>
                  <div className="text-xs text-gray-600 truncate">{candidato.linkedin_link}</div>
                </div>
              </a>
            )}
          </div>
        )}

        {/* Fecha de aplicación */}
        {candidato.fecha_aplicacion && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              Aplicó el {new Date(candidato.fecha_aplicacion).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CandidateCard
