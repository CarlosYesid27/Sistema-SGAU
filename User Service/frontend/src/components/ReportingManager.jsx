import { useState } from 'react'
import { courseApi } from '../services/api'
import { api } from '../services/api'

// Helper para descargar un blob
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

const reportCards = [
  {
    id: 'academic',
    title: 'Reporte Académico General',
    description: 'Lista completa de estudiantes con sus materias inscritas, estado académico y notas finales.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
      </svg>
    ),
    color: '#3b82f6',
    bg: '#eff6ff',
    endpoints: { pdf: '/reports/academic/pdf', csv: '/reports/academic/csv' },
    filenames: { pdf: 'reporte_academico.pdf', csv: 'reporte_academico.csv' },
    hasCourseSelect: false,
  },
  {
    id: 'financial',
    title: 'Reporte Financiero General',
    description: 'Estado de todos los compromisos de pago: pendientes, pagados y cancelados.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
    color: '#059669',
    bg: '#ecfdf5',
    endpoints: { pdf: '/reports/financial/pdf', csv: '/reports/financial/csv' },
    filenames: { pdf: 'reporte_financiero.pdf', csv: 'reporte_financiero.csv' },
    hasCourseSelect: false,
  },
  {
    id: 'course',
    title: 'Reporte por Materia',
    description: 'Exporta el listado de estudiantes inscritos en una materia específica junto con sus notas.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: '#7c3aed',
    bg: '#f5f3ff',
    hasCourseSelect: true,
  },
]

export default function ReportingManager({ courses: propCourses }) {
  const [loading, setLoading] = useState({})
  const [notification, setNotification] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState('')

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleDownload = async (fmt, card) => {
    const key = `${card.id}_${fmt}`
    setLoading(prev => ({ ...prev, [key]: true }))
    try {
      let endpoint, filename
      if (card.hasCourseSelect) {
        if (!selectedCourse) { notify('Selecciona una materia primero.', 'error'); return }
        endpoint = `/reports/course/${selectedCourse}/${fmt}`
        const c = (propCourses || []).find(x => String(x.id) === String(selectedCourse))
        filename = `reporte_${(c?.name || 'materia').replace(/\s+/g, '_')}.${fmt}`
      } else {
        endpoint = card.endpoints[fmt]
        filename = card.filenames[fmt]
      }

      const res = await api.get(endpoint, { responseType: 'blob' })
      downloadBlob(res.data, filename)
      notify(`✅ ${card.title} descargado correctamente.`)
    } catch (err) {
      const detail = err.response?.status === 403 ? 'No tienes permisos.' : 'Error al generar el reporte.'
      notify(`⚠️ ${detail}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Notificación */}
      {notification && (
        <div style={{
          marginBottom: '20px', padding: '14px 16px', borderRadius: '10px', fontSize: '14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: notification.type === 'error' ? '#fef2f2' : '#ecfdf5',
          border: `1px solid ${notification.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
          color: notification.type === 'error' ? '#991b1b' : '#065f46',
        }}>
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* Tarjetas de reporte */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {reportCards.map(card => (
          <div key={card.id} style={{
            background: '#fff', borderRadius: '16px', padding: '28px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0', display: 'flex', gap: '20px', alignItems: 'flex-start'
          }}>
            {/* Ícono */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px', background: card.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: card.color
            }}>
              {card.icon}
            </div>

            {/* Contenido */}
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: '16px', fontWeight: '700' }}>{card.title}</h4>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>{card.description}</p>

              {/* Selector de materia */}
              {card.hasCourseSelect && (
                <select
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  style={{
                    display: 'block', width: '100%', maxWidth: '360px', marginBottom: '14px',
                    padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    fontSize: '14px', color: '#334155', background: '#f8fafc', cursor: 'pointer'
                  }}
                >
                  <option value="">— Selecciona una materia —</option>
                  {(propCourses || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}

              {/* Botones de descarga */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['pdf', 'csv'].map(fmt => {
                  const key = `${card.id}_${fmt}`
                  const isLoading = loading[key]
                  const isPdf = fmt === 'pdf'
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => handleDownload(fmt, card)}
                      disabled={isLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: isLoading ? 'wait' : 'pointer',
                        background: isPdf ? card.color : '#f1f5f9',
                        color: isPdf ? '#fff' : '#475569',
                        fontWeight: '600', fontSize: '13px',
                        opacity: isLoading ? 0.7 : 1,
                        transition: 'opacity 0.2s, transform 0.1s',
                      }}
                    >
                      {isPdf ? (
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      ) : (
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M3 9h18M9 21V9"/>
                        </svg>
                      )}
                      {isLoading ? 'Generando...' : `Descargar ${fmt.toUpperCase()}`}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
