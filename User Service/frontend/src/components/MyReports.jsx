import { useState } from 'react'
import { reportApi, authApi } from '../services/api'

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

const STUDENT_CARDS = [
  {
    id: 'academic',
    title: 'Mi Reporte Académico',
    description: 'Descarga un informe con todas tus materias inscritas, su estado actual y tu nota final.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
      </svg>
    ),
    color: '#3b82f6',
    bg: '#eff6ff',
    pdfFn: () => reportApi.myAcademicPdf(),
    csvFn: () => reportApi.myAcademicCsv(),
    pdfFile: 'mi_reporte_academico.pdf',
    csvFile: 'mi_reporte_academico.csv',
  },
  {
    id: 'financial',
    title: 'Mi Reporte Financiero',
    description: 'Genera un comprobante con tus compromisos de pago, montos, y su estado financiero actualizado.',
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    color: '#059669',
    bg: '#ecfdf5',
    pdfFn: () => reportApi.myFinancialPdf(),
    csvFn: () => reportApi.myFinancialCsv(),
    pdfFile: 'mi_reporte_financiero.pdf',
    csvFile: 'mi_reporte_financiero.csv',
  },
]

const TEACHER_CARDS = [
  {
    id: 'my_courses',
    title: 'Reporte de Mis Cursos',
    description: 'Exporta el listado completo de estudiantes inscritos en todas tus materias junto con sus notas.',
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
    pdfFn: () => reportApi.myCoursesPdf(),
    csvFn: () => reportApi.myCoursesCsv(),
    pdfFile: 'reporte_mis_cursos.pdf',
    csvFile: 'reporte_mis_cursos.csv',
  },
]

export default function MyReports({ role }) {
  const [loading, setLoading] = useState({})
  const [notification, setNotification] = useState(null)

  const cards = role === 'estudiante' ? STUDENT_CARDS : TEACHER_CARDS

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleDownload = async (fmt, card) => {
    const key = `${card.id}_${fmt}`
    setLoading(prev => ({ ...prev, [key]: true }))
    try {
      const fn = fmt === 'pdf' ? card.pdfFn : card.csvFn
      let filename = fmt === 'pdf' ? card.pdfFile : card.csvFile
      
      if (card.id === 'financial') {
        try {
          const meRes = await authApi.getMe()
          const docNum = meRes.data.document_number || '000'
          filename = filename.replace('.pdf', `_${docNum}.pdf`).replace('.csv', `_${docNum}.csv`)
        } catch (e) {}
      }
      
      const res = await fn()
      downloadBlob(res.data, filename)
      notify(`✅ ${card.title} descargado correctamente.`)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Error al generar el reporte.'
      notify(`⚠️ ${detail}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>

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

      <div style={{ display: 'grid', gap: '20px' }}>
        {cards.map(card => (
          <div key={card.id} style={{
            background: '#fff', borderRadius: '16px', padding: '28px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0', display: 'flex', gap: '20px', alignItems: 'flex-start'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px', background: card.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: card.color
            }}>
              {card.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: '16px', fontWeight: '700' }}>{card.title}</h4>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>{card.description}</p>
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
                        padding: '9px 18px', borderRadius: '8px', border: 'none',
                        cursor: isLoading ? 'wait' : 'pointer',
                        background: isPdf ? card.color : '#f1f5f9',
                        color: isPdf ? '#fff' : '#475569',
                        fontWeight: '600', fontSize: '13px', opacity: isLoading ? 0.7 : 1,
                        transition: 'opacity 0.2s',
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
