import { useEffect, useState } from 'react'
import { gradesApi, courseApi } from '../services/api'

const STATUS_CONFIG = {
  IN_PROGRESS: { label: 'En Curso', bg: '#eff6ff', color: '#1d4ed8', dot: '🔵' },
  PASSED:      { label: 'Aprobado', bg: '#f0fdf4', color: '#15803d', dot: '🟢' },
  FAILED:      { label: 'Reprobado', bg: '#fef2f2', color: '#dc2626', dot: '🔴' },
}

const fmt = (n) =>
  n !== null && n !== undefined
    ? Number(n).toFixed(1)
    : '—'

export default function GradesView() {
  const [grades, setGrades] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [gradesRes, coursesRes] = await Promise.all([
        gradesApi.getMyGrades(),
        courseApi.getAll()
      ])
      setGrades(gradesRes.data)
      setCourses(coursesRes.data)
    } catch {
      setError('No se pudieron cargar las calificaciones.')
    } finally {
      setLoading(false)
    }
  }

  const getCourseName = (courseId) => {
    const c = courses.find(c => c.id === courseId)
    return c ? c.name : `Materia #${courseId}`
  }

  const getCourseCredits = (courseId) => {
    const c = courses.find(c => c.id === courseId)
    return c ? c.credits : '—'
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
      Cargando calificaciones...
    </div>
  )

  // Calcular promedio acumulado (solo materias con promedio)
  const gradedItems = grades.filter(g => g.average !== null)
  const gpa = gradedItems.length > 0
    ? (gradedItems.reduce((s, g) => s + g.average, 0) / gradedItems.length).toFixed(2)
    : null

  return (
    <div>
      {/* Resumen estadístico */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Materias Cursadas', value: grades.length, color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Aprobadas', value: grades.filter(g => g.status === 'PASSED').length, color: '#15803d', bg: '#f0fdf4' },
          { label: 'Reprobadas', value: grades.filter(g => g.status === 'FAILED').length, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Promedio Acum.', value: gpa ?? '—', color: '#7c3aed', bg: '#f5f3ff' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: stat.bg, borderRadius: '12px', padding: '16px 20px',
            border: `1px solid ${stat.color}22`
          }}>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: stat.color }}>{stat.value}</p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {error && <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>}

      {grades.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: '16px', opacity: .5 }}>
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Aún no tienes calificaciones registradas.</p>
          <p style={{ fontSize: '13px' }}>Las notas aparecerán aquí cuando el docente las ingrese.</p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '700px' }}>
              <thead>
                <tr>
                  <th>Materia</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>CR</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Parcial 1<br/><span style={{ fontWeight: 400, fontSize: '11px' }}>30%</span></th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Parcial 2<br/><span style={{ fontWeight: 400, fontSize: '11px' }}>30%</span></th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Final<br/><span style={{ fontWeight: 400, fontSize: '11px' }}>40%</span></th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Promedio</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(grade => {
                  const cfg = STATUS_CONFIG[grade.status] || STATUS_CONFIG.IN_PROGRESS
                  return (
                    <tr key={grade.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{getCourseName(grade.course_id)}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                          {getCourseCredits(grade.course_id)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: '600', color: grade.partial1 !== null ? '#1e293b' : '#94a3b8' }}>
                        {fmt(grade.partial1)}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: '600', color: grade.partial2 !== null ? '#1e293b' : '#94a3b8' }}>
                        {fmt(grade.partial2)}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: '600', color: grade.final_exam !== null ? '#1e293b' : '#94a3b8' }}>
                        {fmt(grade.final_exam)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {grade.average !== null ? (
                          <span style={{
                            fontSize: '18px', fontWeight: '800',
                            color: grade.average >= 3.0 ? '#15803d' : '#dc2626'
                          }}>
                            {fmt(grade.average)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Pendiente</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          background: cfg.bg, color: cfg.color,
                          padding: '4px 12px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap'
                        }}>
                          {cfg.dot} {cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
