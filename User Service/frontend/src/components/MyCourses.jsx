import { useEffect, useState } from 'react'
import { courseApi, enrollmentApi, usersApi } from '../services/api'

export default function MyCourses() {
  const [courses, setCourses] = useState([])
  const [myEnrollments, setMyEnrollments] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cancelData, setCancelData] = useState(null)
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [resCourses, resEnrollments, resUsers] = await Promise.all([
        courseApi.getAll(),
        enrollmentApi.getMyEnrollments(),
        usersApi.getAll().catch(() => ({ data: [] }))
      ])
      
      setCourses(resCourses.data)
      const usersData = resUsers.data?.value || resUsers.data || []
      if (Array.isArray(usersData)) {
        setTeachers(usersData)
      }

      const activeEnrollments = resEnrollments.data.filter(
        e => e.status === 'ENROLLED' || e.status === 'PENDING'
      )
      setMyEnrollments(activeEnrollments)
    } catch (err) {
      setError('Error al cargar mis cursos.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelData) return
    setError('')
    setSuccess('')
    try {
      await enrollmentApi.cancel(cancelData.enrollmentId)
      setSuccess(`✅ Has cancelado exitosamente la materia ${cancelData.courseName}.`)
      setCancelData(null)
      loadData()
    } catch (err) {
      const detail = err.response?.data?.detail || 'Error al cancelar la materia.'
      setError(`⚠️ ${detail}`)
      setCancelData(null)
    }
  }

  if (loading) return <div style={{ padding: '20px', color: '#64748b' }}>Cargando mis cursos...</div>

  // Cruzamos información para mostrar en la tabla
  const enrichedEnrollments = myEnrollments.map(e => {
    const c = courses.find(course => course.id === e.course_id)
    let tName = 'No asignado'
    if (c && c.teacher_id) {
       const t = teachers.find(u => u.id === c.teacher_id)
       if (t) tName = `${t.first_name} ${t.last_name}`
    }
    return { ...e, courseDetails: { ...c, calculated_teacher_name: tName } }
  })

  return (
    <div className="payment-manager">
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '24px' }}>Mis Cursos</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
          Aquí puedes visualizar las materias en las que te encuentras inscrito actualmente. Si lo deseas, puedes cancelar tu inscripción (ten en cuenta las implicaciones financieras).
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#991b1b', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>Error:</strong> {error}</span>
          <button style={{background:'transparent', border:'none', cursor:'pointer', color:'#991b1b', fontWeight:'bold', fontSize:'16px'}} onClick={() => setError('')}>✕</button>
        </div>
      )}
      
      {success && (
        <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '10px', color: '#065f46', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{success}</span>
          <button style={{background:'transparent', border:'none', cursor:'pointer', color:'#065f46', fontWeight:'bold', fontSize:'16px'}} onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Modal de confirmación */}
      {cancelData && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)', animation: 'fadeIn .2s ease'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#1e293b', fontSize: '20px' }}>Confirmar Cancelación</h3>
            <p style={{ margin: '0 0 24px', color: '#475569', lineHeight: '1.5', fontSize: '15px' }}>
              ¿Estás seguro de cancelar la materia <strong>{cancelData.courseName}</strong>?<br/><br/>
              Esta acción es irreversible y anulará tu cupo y el recargo asociado (si aún no lo has pagado).
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={() => setCancelData(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer', fontWeight: '500' }}
              >
                No, mantener
              </button>
              <button 
                type="button"
                onClick={handleCancel}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '500' }}
              >
                Sí, cancelar curso
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '600px' }}>
            <thead>
              <tr>
                <th>Nombre de la Materia</th>
                <th>Créditos</th>
                <th>Horario</th>
                <th>Profesor</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {enrichedEnrollments.length === 0 ? (
                <tr><td colSpan="6" className="empty">No tienes materias activas en este momento.</td></tr>
              ) : (
                enrichedEnrollments.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: '500' }}>{e.courseDetails?.name || 'Cargando...'}</td>
                    <td>{e.courseDetails?.credits || '?'}</td>
                    <td><span style={{color: '#475569', fontSize: '13px'}}>{e.courseDetails?.schedule || 'Por asignar'}</span></td>
                    <td><span style={{color: '#475569', fontSize: '13px'}}>{e.courseDetails?.calculated_teacher_name || 'No asignado'}</span></td>
                    <td>
                      {e.status === 'ENROLLED' ? (
                        <span style={{ color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Inscrito</span>
                      ) : (
                        <span style={{ color: '#b45309', background: '#fffbeb', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Esperando Pago</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        type="button" 
                        title="Cancelar curso"
                        onClick={() => setCancelData({ enrollmentId: e.id, courseName: e.courseDetails?.name || `Materia #${e.course_id}` })}
                        style={{
                          background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444',
                          padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                        }}
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
