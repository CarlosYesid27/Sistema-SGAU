import { useEffect, useState } from 'react'
import { courseApi } from '../services/api'

export default function OfferManager() {
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [courseToToggle, setCourseToToggle] = useState(null)

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const res = await courseApi.getAll()
      setCourses(res.data)
    } catch (err) {
      setError('Error al cargar materias.')
    }
  }

  const handleToggleOffer = async () => {
    if (!courseToToggle) return;
    try {
      setError('')
      const newStatus = !courseToToggle.is_offered;
      await courseApi.update(courseToToggle.id, { is_offered: newStatus })
      showSuccess(`Materia ${courseToToggle.name} ha sido ${newStatus ? 'ofertada' : 'ocultada'} exitosamente.`)
      setCourseToToggle(null)
      loadCourses()
    } catch (err) {
      setError('Error al actualizar el estado de oferta de la materia.')
      setCourseToToggle(null)
    }
  }

  return (
    <div className="offer-manager">
      {error && <p className="error" style={{ marginBottom: '20px' }}>{error}</p>}
      {successMsg && <p className="success" style={{ marginBottom: '20px', padding: '12px', background: '#ecfdf5', color: '#059669', border: '1px solid #10b981', borderRadius: '8px', fontWeight: '500' }}>{successMsg}</p>}

      <div className="table-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '0 8px' }}>
          <svg width="22" height="22" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <h3 style={{ margin: 0, color: '#334155' }}>Materias Disponibles para Oferta</h3>
        </div>
        
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Materia</th>
                <th style={{ width: '100px' }}>Créditos</th>
                <th>Programa</th>
                <th>Estado Actual</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr><td colSpan="6" className="empty">No hay materias en el sistema.</td></tr>
              ) : (
                courses.map(c => (
                  <tr key={c.id}>
                    <td style={{ color: '#94a3b8', fontSize: '13px' }}>#{c.id}</td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{c.name}</div>
                      {c.description && <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>{c.description}</div>}
                    </td>
                    <td>
                      <span style={{ 
                        padding: '4px 10px', 
                        background: '#f1f5f9', 
                        borderRadius: '6px', 
                        fontSize: '12px', 
                        fontWeight: '700',
                        color: '#475569'
                      }}>
                        {c.credits} CR
                      </span>
                    </td>
                    <td>
                      {c.academic_program ? (
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background:
                            c.academic_program === 'Ingeniería de Sistemas' ? '#eff6ff' :
                            c.academic_program === 'Derecho' ? '#fef9ec' : '#f5f3ff',
                          color:
                            c.academic_program === 'Ingeniería de Sistemas' ? '#1e40af' :
                            c.academic_program === 'Derecho' ? '#92400e' : '#6d28d9',
                          whiteSpace: 'nowrap'
                        }}>
                          {c.academic_program}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>General</span>
                      )}
                    </td>
                    <td>
                      {c.is_offered ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#ecfdf5', color: '#059669', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #10b981' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }}></span>
                          Ofertada
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#f8fafc', color: '#64748b', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: '1px solid #cbd5e1' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }}></span>
                          Oculta (No Ofertada)
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="actions" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          type="button" 
                          className={c.is_offered ? "secondary small" : "small"} 
                          onClick={() => setCourseToToggle(c)}
                          style={{ 
                            padding: '6px 14px', 
                            background: c.is_offered ? '#fdf2f8' : '#eef2ff', 
                            color: c.is_offered ? '#be185d' : '#4338ca', 
                            border: `1px solid ${c.is_offered ? '#fbcfe8' : '#c7d2fe'}`,
                            cursor: 'pointer',
                            borderRadius: '8px',
                            fontWeight: '600'
                          }}
                        >
                          {c.is_offered ? 'Retirar Oferta' : 'Ofertar Materia'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {courseToToggle && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>Confirmar Acción</h2>
            <p className="modal-text">
              ¿Estás seguro de que deseas {courseToToggle.is_offered ? 'ocultar (retirar oferta)' : 'ofertar'} la materia <strong>{courseToToggle.name}</strong>?
            </p>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setCourseToToggle(null)}>Cancelar</button>
              <button type="button" style={{ background: '#1e67c6', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleToggleOffer}>Sí, confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
