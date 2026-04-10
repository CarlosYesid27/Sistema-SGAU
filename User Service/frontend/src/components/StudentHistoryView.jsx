import React, { useState, useEffect } from 'react'
import { studentApi } from '../services/api'

export default function StudentHistoryView({ user }) {
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const res = await studentApi.getMyHistory()
      setRecord(res.data)
    } catch (err) {
      setError('No se pudo cargar el historial académico.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando historial...</div>
  if (error) return <div style={{ padding: '20px', color: '#ef4444' }}>{error}</div>

  const hasHistory = record && record.history && record.history.length > 0;

  return (
    <div className="student-history-view" style={{ maxWidth: '1000px', margin: '0 auto', gap: '20px', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Mi Historial Académico</h2>
          <p className="subtitle">Consulta tus calificaciones históricas y progreso del programa.</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: '24px', borderRadius: '16px', color: '#fff' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Promedio General Acumulado</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{record.cumulative_gpa.toFixed(2)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '16px' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Créditos Aprobados</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>{record.total_credits_earned}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '16px' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Estado Actual</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginTop: '10px' }}>
            {record.academic_status === 'ACTIVE' ? '🟢 Activo' : record.academic_status === 'GRADUATED' ? '🎓 Graduado' : '🔴 Suspendido'}
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '20px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Materias Cursadas</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '13px' }}>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Materia</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Periodo</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Créditos</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Nota Final</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {!hasHistory ? (
              <tr>
                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  Aún no tienes materias aprobadas o reprobadas definitivamente en tu historial.
                </td>
              </tr>
            ) : (
              record.history.map((h, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                  <td style={{ padding: '16px 20px', fontWeight: '500', color: '#1e293b' }}>{h.course_name}</td>
                  <td style={{ padding: '16px 20px', color: '#64748b' }}>{h.term_name || 'N/A'}</td>
                  <td style={{ padding: '16px 20px', color: '#64748b' }}>{h.credits}</td>
                  <td style={{ padding: '16px 20px', fontWeight: 'bold', color: '#1e293b' }}>{h.final_grade.toFixed(1)}</td>
                  <td style={{ padding: '16px 20px' }}>
                    {h.passed ? (
                      <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Aprobada</span>
                    ) : (
                      <span style={{ background: '#fef2f2', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Reprobada</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
