import { useEffect, useState } from 'react'
import { courseApi, usersApi } from '../services/api'

export default function CourseManager() {
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }
  
  // Form State
  const [editingId, setEditingId] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [credits, setCredits] = useState(3)
  const [schedule, setSchedule] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [academicProgram, setAcademicProgram] = useState('')
  const [selectedPrereqs, setSelectedPrereqs] = useState([])
  const [originalPrereqs, setOriginalPrereqs] = useState([])

  const [courseToDelete, setCourseToDelete] = useState(null)

  useEffect(() => {
    loadCourses()
    loadTeachers()
  }, [])

  const loadCourses = async () => {
    try {
      const res = await courseApi.getAll()
      setCourses(res.data)
    } catch (err) {
      setError('Error al cargar materias.')
    }
  }

  const loadTeachers = async () => {
    try {
      const res = await usersApi.getAll()
      const data = res.data.value || res.data
      if (Array.isArray(data)) {
        setTeachers(data.filter(u => u.role === 'docente'))
      }
    } catch {
      // Ignore
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        name,
        description,
        credits: parseInt(credits),
        schedule,
        teacher_id: teacherId ? parseInt(teacherId) : null,
        academic_program: academicProgram || null
      }

      if (editingId) {
        await courseApi.update(editingId, payload)
        
        // Diffing para actualizar prerrequisitos
        const toAdd = selectedPrereqs.filter(id => !originalPrereqs.includes(id))
        const toRemove = originalPrereqs.filter(id => !selectedPrereqs.includes(id))
        
        for (const pid of toAdd) {
          await courseApi.addPrerequisite(editingId, pid)
        }
        for (const pid of toRemove) {
          await courseApi.removePrerequisite(editingId, pid)
        }
        showSuccess('Materia modificada correctamente.')
      } else {
        const res = await courseApi.create(payload)
        const newCourseId = res.data.id
        for (const pid of selectedPrereqs) {
          await courseApi.addPrerequisite(newCourseId, pid)
        }
        showSuccess('Materia creada correctamente.')
      }
      resetForm()
      loadCourses()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al guardar la materia'
      setError(msg)
    }
  }

  const handleEdit = async (c) => {
    try {
      const res = await courseApi.getById(c.id)
      const detail = res.data
      setEditingId(detail.id)
      setName(detail.name)
      setDescription(detail.description || '')
      setCredits(detail.credits)
      setSchedule(detail.schedule || '')
      setTeacherId(detail.teacher_id || '')
      setAcademicProgram(detail.academic_program || '')
      
      const prereqIds = detail.prerequisites.map(p => p.id)
      setSelectedPrereqs(prereqIds)
      setOriginalPrereqs(prereqIds)

      // Smooth scroll hacia la parte superior (formulario)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError('Error al cargar detalles de la materia.')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setCredits(3)
    setSchedule('')
    setTeacherId('')
    setAcademicProgram('')
    setSelectedPrereqs([])
    setOriginalPrereqs([])
    setError('')
  }

  const handleDelete = async () => {
    if (!courseToDelete) return
    try {
      setError('')
      await courseApi.remove(courseToDelete.id)
      setCourseToDelete(null)
      loadCourses()
      showSuccess('Materia eliminada correctamente.')
    } catch {
      setError('Error al eliminar materia.')
      setCourseToDelete(null)
    }
  }

  return (
    <div className="course-manager">
      {error && <p className="error" style={{ marginBottom: '20px' }}>{error}</p>}
      {successMsg && <p className="success" style={{ marginBottom: '20px', padding: '12px', background: '#ecfdf5', color: '#059669', border: '1px solid #10b981', borderRadius: '8px', fontWeight: '500' }}>{successMsg}</p>}

      <div className="form-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: '#eef4ff', color: '#1a4fa3', padding: '8px', borderRadius: '8px' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 style={{ margin: 0 }}>{editingId ? 'Editar Materia' : 'Nueva Materia'}</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid" style={{ gridTemplateColumns: '1.5fr 0.5fr 1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', color: '#5f7288', fontWeight: '600' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Nombre de la Materia
              </label>
              <input 
                required 
                placeholder="Ej. Programación III"
                value={name} 
                onChange={e => setName(e.target.value)} 
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', color: '#5f7288', fontWeight: '600' }}>
                Créditos
              </label>
              <input 
                type="number" 
                min="1" 
                max="10"
                required 
                value={credits} 
                onChange={e => setCredits(e.target.value)} 
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', color: '#5f7288', fontWeight: '600' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Horario
              </label>
              <input 
                placeholder="L - M 08:00 - 10:00" 
                value={schedule} 
                onChange={e => setSchedule(e.target.value)} 
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', color: '#5f7288', fontWeight: '600' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Docente Asignado
              </label>
              <select value={teacherId} onChange={e => setTeacherId(e.target.value)} style={{ width: '100%' }}>
                <option value="">-- Sin asignar --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                ))}
              </select>
            </div>

            {/* Programa Académico */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', color: '#5f7288', fontWeight: '600' }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Programa Académico
              </label>
              <select
                value={academicProgram}
                onChange={e => setAcademicProgram(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- Todos los programas --</option>
                <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
                <option value="Derecho">Derecho</option>
                <option value="Psicología">Psicología</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '13px', color: '#5f7288', fontWeight: '600' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Prerrequisitos Académicos
            </label>
            <div className="prereqs-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '10px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              {courses.filter(c => c.id !== editingId).length === 0 ? (
                <span style={{color: '#94a3b8', fontSize: '0.85rem', gridColumn: '1/-1', textAlign: 'center'}}>No hay otras materias para seleccionar como prerrequisito.</span>
              ) : (
                courses.filter(c => c.id !== editingId).map(c => {
                  const isChecked = selectedPrereqs.includes(c.id);
                  return (
                    <label key={c.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px 14px',
                      background: isChecked ? '#eef4ff' : 'white',
                      border: `1px solid ${isChecked ? '#1e67c6' : '#e2e8f0'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '13px',
                      color: isChecked ? '#1a4fa3' : '#475569',
                      fontWeight: isChecked ? '600' : '400'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={(e) => {
                          if(e.target.checked) setSelectedPrereqs(prev => [...prev, c.id])
                          else setSelectedPrereqs(prev => prev.filter(id => id !== c.id))
                        }} 
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      {c.name}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', color: '#5f7288', fontWeight: '600' }}>
              Descripción de la Materia
            </label>
            <textarea 
              rows="3" 
              placeholder="Escribe una breve descripción del contenido de la materia..."
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cdd9e8', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            {editingId && (
              <button type="button" className="secondary" onClick={resetForm} style={{ padding: '12px 24px' }}>
                Descartar Cambios
              </button>
            )}
            <button type="submit" style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {editingId ? 'Guardar Cambios' : 'Registrar Materia'}
            </button>
          </div>
        </form>
      </div>

      <div className="table-card" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '0 8px' }}>
          <svg width="18" height="18" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <h3 style={{ margin: 0, color: '#334155' }}>Listado Académico</h3>
        </div>
        
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Materia</th>
                <th style={{ width: '100px' }}>Créditos</th>
                <th>Horario</th>
                <th>Programa</th>
                <th>Docente</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr><td colSpan="6" className="empty">No hay materias registradas en el sistema.</td></tr>
              ) : (
                courses.map(c => {
                  const doc = teachers.find(t => t.id === c.teacher_id)
                  return (
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
                      <td style={{ fontSize: '13px', color: '#475569' }}>{c.schedule || '-'}</td>
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
                        {doc ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#eef4ff', color: '#1a4fa3', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                              {doc.first_name[0]}{doc.last_name[0]}
                            </div>
                            <span style={{ fontSize: '13px' }}>{doc.first_name} {doc.last_name}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No asignado</span>
                        )}
                      </td>
                      <td>
                        <div className="actions" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            type="button" 
                            className="small" 
                            onClick={() => handleEdit(c)}
                            style={{ padding: '6px 12px', background: '#f8fafc', color: '#1e67c6', border: '1px solid #e2e8f0' }}
                          >
                            Editar
                          </button>
                          <button 
                            type="button" 
                            className="secondary small" 
                            onClick={() => {
                              setCourseToDelete(c)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            style={{ padding: '6px 12px' }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {courseToDelete && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>Confirmar eliminación</h2>
            <p className="modal-text">¿Deseas eliminar la materia <strong>{courseToDelete.name}</strong>?</p>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setCourseToDelete(null)}>Cancelar</button>
              <button type="button" className="danger" onClick={handleDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
