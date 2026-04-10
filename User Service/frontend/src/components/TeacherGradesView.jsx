import { useEffect, useState } from 'react'
import { gradesApi, courseApi, enrollmentApi, usersApi } from '../services/api'

const fmt = (n) => (n !== null && n !== undefined ? Number(n).toFixed(1) : '—')

const STATUS_BADGE = {
  IN_PROGRESS: { label: 'En Curso',  bg: '#eff6ff', color: '#1d4ed8' },
  PASSED:      { label: 'Aprobado',  bg: '#f0fdf4', color: '#15803d' },
  FAILED:      { label: 'Reprobado', bg: '#fef2f2', color: '#dc2626' },
}

export default function TeacherGradesView({ user }) {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [grades, setGrades] = useState([])        // { enrollment_id: gradeObj }
  const [users, setUsers] = useState([])
  const [edits, setEdits] = useState({})          // { gradeId: { partial1, partial2, final_exam } }
  const [saving, setSaving] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Cargar cursos donde el docente está asignado
  useEffect(() => {
    loadCourses()
    loadUsers()
  }, [])

  const loadCourses = async () => {
    try {
      const res = await courseApi.getAll()
      const all = res.data
      // Filtrar por teacher_id si el usuario es docente
      const myCourses = user?.role === 'admin'
        ? all
        : all.filter(c => c.teacher_id === user?.id)
      setCourses(myCourses)
    } catch {
      setError('Error al cargar materias.')
    }
  }

  const loadUsers = async () => {
    try {
      const res = await usersApi.getAll()
      const data = res.data.value || res.data
      if (Array.isArray(data)) setUsers(data)
    } catch { /* ignore */ }
  }

  const loadCourseGrades = async (courseId) => {
    setError('')
    setSuccess('')
    try {
      const [enrollRes, gradesRes] = await Promise.all([
        enrollmentApi.getCourseEnrollments(courseId),
        gradesApi.getCourseGrades(courseId)
      ])
      setEnrollments(enrollRes.data.filter(e => ['ENROLLED', 'PASSED', 'FAILED'].includes(e.status)))
      // Indexar por enrollment_id
      const gradeMap = {}
      gradesRes.data.forEach(g => { gradeMap[g.enrollment_id] = g })
      setGrades(gradeMap)
      setEdits({})
    } catch {
      setError('Error al cargar las calificaciones de la materia.')
    }
  }

  const handleSelectCourse = (courseId) => {
    const course = courses.find(c => c.id === Number(courseId))
    setSelectedCourse(course)
    if (course) loadCourseGrades(course.id)
  }

  const getStudentName = (studentId) => {
    const u = users.find(u => u.id === studentId)
    return u ? `${u.first_name} ${u.last_name}` : `Estudiante #${studentId}`
  }

  const handleEdit = (gradeId, field, value) => {
    setEdits(prev => ({
      ...prev,
      [gradeId]: { ...prev[gradeId], [field]: value }
    }))
  }

  const handleSave = async (grade) => {
    setSaving(prev => ({ ...prev, [grade.id]: true }))
    setError('')
    setSuccess('')
    try {
      const editData = edits[grade.id] || {}
      const payload = {}
      if (editData.partial1 !== undefined && editData.partial1 !== '')
        payload.partial1 = parseFloat(editData.partial1)
      if (editData.partial2 !== undefined && editData.partial2 !== '')
        payload.partial2 = parseFloat(editData.partial2)
      if (editData.final_exam !== undefined && editData.final_exam !== '')
        payload.final_exam = parseFloat(editData.final_exam)

      await gradesApi.updateGrade(grade.id, payload)
      setSuccess(`Nota guardada correctamente.`)
      await loadCourseGrades(selectedCourse.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar la nota.')
    } finally {
      setSaving(prev => ({ ...prev, [grade.id]: false }))
    }
  }

  const handleCreateGrade = async (enrollment) => {
    try {
      await gradesApi.createGrade({
        enrollment_id: enrollment.id,
        student_id: enrollment.student_id,
        course_id: enrollment.course_id
      })
      await loadCourseGrades(selectedCourse.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear registro de nota.')
    }
  }

  return (
    <div>
      {/* Selector de materia */}
      <div className="form-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5f7288', fontWeight: '600', marginBottom: '10px' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Selecciona una materia
        </label>
        <select
          onChange={e => handleSelectCourse(e.target.value)}
          style={{ width: '100%', maxWidth: '480px' }}
          defaultValue=""
        >
          <option value="" disabled>— Elige una materia —</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.credits} CR)</option>
          ))}
        </select>
        {courses.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>
            No tienes materias asignadas actualmente.
          </p>
        )}
      </div>

      {error && <p style={{ color: '#dc2626', marginBottom: '12px' }}>{error}</p>}
      {success && <p style={{ color: '#15803d', marginBottom: '12px', fontWeight: '600' }}>✓ {success}</p>}

      {selectedCourse && (
        <div className="table-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 style={{ margin: 0, color: '#334155' }}>
              Acta de Calificaciones — {selectedCourse.name}
            </h3>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b' }}>
              {enrollments.length} estudiante{enrollments.length !== 1 ? 's' : ''} inscrito{enrollments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {enrollments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              No hay estudiantes inscritos en esta materia.
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '750px' }}>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Parcial 1<br/><span style={{ fontWeight: 400, fontSize: '11px' }}>30% (0–5)</span></th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Parcial 2<br/><span style={{ fontWeight: 400, fontSize: '11px' }}>30% (0–5)</span></th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Final<br/><span style={{ fontWeight: 400, fontSize: '11px' }}>40% (0–5)</span></th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Promedio</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Estado</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(enrollment => {
                    const grade = grades[enrollment.id]
                    const cfg = grade ? (STATUS_BADGE[grade.status] || STATUS_BADGE.IN_PROGRESS) : null
                    const editRow = edits[grade?.id] || {}
                    const isSaving = saving[grade?.id]

                    if (!grade) {
                      return (
                        <tr key={enrollment.id}>
                          <td style={{ fontWeight: '600' }}>{getStudentName(enrollment.student_id)}</td>
                          <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>
                            Sin registro de nota
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="small"
                              onClick={() => handleCreateGrade(enrollment)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              + Abrir acta
                            </button>
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <tr key={enrollment.id}>
                        <td style={{ fontWeight: '600', color: '#1e293b' }}>
                          {getStudentName(enrollment.student_id)}
                        </td>
                        {/* Parcial 1 */}
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number" min="0" max="5" step="0.1"
                            defaultValue={grade.partial1 ?? ''}
                            placeholder="—"
                            onChange={e => handleEdit(grade.id, 'partial1', e.target.value)}
                            style={{ width: '70px', textAlign: 'center', padding: '6px 8px', borderRadius: '8px', border: '1px solid #cdd9e8', fontSize: '14px' }}
                          />
                        </td>
                        {/* Parcial 2 */}
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number" min="0" max="5" step="0.1"
                            defaultValue={grade.partial2 ?? ''}
                            placeholder="—"
                            onChange={e => handleEdit(grade.id, 'partial2', e.target.value)}
                            style={{ width: '70px', textAlign: 'center', padding: '6px 8px', borderRadius: '8px', border: '1px solid #cdd9e8', fontSize: '14px' }}
                          />
                        </td>
                        {/* Final */}
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number" min="0" max="5" step="0.1"
                            defaultValue={grade.final_exam ?? ''}
                            placeholder="—"
                            onChange={e => handleEdit(grade.id, 'final_exam', e.target.value)}
                            style={{ width: '70px', textAlign: 'center', padding: '6px 8px', borderRadius: '8px', border: '1px solid #cdd9e8', fontSize: '14px' }}
                          />
                        </td>
                        {/* Promedio calculado */}
                        <td style={{ textAlign: 'center' }}>
                          {grade.average !== null ? (
                            <span style={{
                              fontSize: '17px', fontWeight: '800',
                              color: grade.average >= 3.0 ? '#15803d' : '#dc2626'
                            }}>
                              {fmt(grade.average)}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Pend.</span>
                          )}
                        </td>
                        {/* Estado */}
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            background: cfg.bg, color: cfg.color,
                            padding: '3px 10px', borderRadius: '20px',
                            fontSize: '11px', fontWeight: '700'
                          }}>
                            {cfg.label}
                          </span>
                        </td>
                        {/* Botón guardar */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleSave(grade)}
                            disabled={isSaving || Object.keys(edits[grade.id] || {}).length === 0}
                            style={{
                              padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                              background: isSaving ? '#e2e8f0' : '#1e67c6',
                              color: isSaving ? '#94a3b8' : '#fff',
                              border: 'none', borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {isSaving ? '...' : 'Guardar'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
