import { useEffect, useState } from 'react'
import { courseApi, enrollmentApi, usersApi } from '../services/api'

// Modal de Compromiso de Pago
function PaymentModal({ payment, courseName, onClose }) {
  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  const fmtDate = (d) => new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)', animation: 'fadeIn .2s ease'
      }}>
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <svg width="32" height="32" fill="none" stroke="#059669" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>¡Inscripción Exitosa!</h3>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
            Quedaste matriculado en <strong>{courseName}</strong>
          </p>
        </div>

        {/* Cuerpo del Compromiso */}
        <div style={{
          background: '#f8fafc', borderRadius: '12px', padding: '20px',
          border: '1px solid #e2e8f0', marginBottom: '24px'
        }}>
          <p style={{ margin: '0 0 16px', fontWeight: 'bold', color: '#1e293b', fontSize: '15px' }}>
            📄 Compromiso de Pago #{payment.id}
          </p>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#64748b' }}>Monto a pagar:</span>
              <strong style={{ color: '#059669', fontSize: '16px' }}>{fmt(payment.amount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#64748b' }}>Fecha límite:</span>
              <strong style={{ color: '#dc2626' }}>{fmtDate(payment.due_date)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#64748b' }}>Estado:</span>
              <span style={{
                background: '#fefce8', color: '#854d0e', padding: '2px 10px',
                borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'
              }}>PAGO PENDIENTE</span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginBottom: '20px' }}>
          Tienes 15 días hábiles para realizar el pago en caja o a través del portal financiero institucional.
        </p>

        <button onClick={onClose} style={{
          width: '100%', padding: '12px', background: '#2563eb', color: '#fff',
          border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer'
        }}>
          Entendido
        </button>
      </div>
    </div>
  )
}

// Componente principal
export default function EnrollmentManager({ user }) {
  const [courses, setCourses] = useState([])
  const [myEnrollments, setMyEnrollments] = useState([])
  const [myPayments, setMyPayments] = useState([])
  const [teachers, setTeachers] = useState([])
  const [slots, setSlots] = useState({})           // { "course_id": cupos_disponibles }
  const [confirmModal, setConfirmModal] = useState(null) // course object
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('catalog') // 'catalog' | 'payments'
  const [paymentModal, setPaymentModal] = useState(null) // { payment, courseName }

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [resCourses, resEnrollments, resPayments, resSlots, resUsers] = await Promise.all([
        courseApi.getAll(),
        enrollmentApi.getMyEnrollments(),
        enrollmentApi.getMyPayments(),
        enrollmentApi.getSlots(),
        usersApi.getAll().catch(() => ({ data: [] }))
      ])
      setCourses(resCourses.data)
      setMyEnrollments(resEnrollments.data)
      setMyPayments(resPayments.data)
      setSlots(resSlots.data)
      const usersData = resUsers.data.value || resUsers.data
      if (Array.isArray(usersData)) setTeachers(usersData.filter(u => u.role === 'docente'))
    } catch { setError('Error al cargar la oferta académica.') }
  }

  const handleEnroll = async (course) => {
    setError('')
    try {
      const res = await enrollmentApi.enroll(course.id)
      const enrollment = res.data
      if (enrollment.payment) {
        setPaymentModal({ payment: enrollment.payment, courseName: course.name })
      }
      await loadData()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al procesar la inscripción.'
      setError(`No se pudo inscribir en ${course.name}: ${msg}`)
    }
  }

  const requestEnroll = (course) => {
    setConfirmModal(course)
  }

  const confirmEnroll = async () => {
    const course = confirmModal
    setConfirmModal(null)
    await handleEnroll(course)
  }

  const getTeacherName = (tId) => {
    const doc = teachers.find(t => t.id === tId)
    return doc ? `${doc.first_name} ${doc.last_name}` : 'Sin asignar'
  }

  const getPrerequisitesText = (course) => {
    if (!course.prerequisites || course.prerequisites.length === 0) return 'Ninguno'
    return course.prerequisites.map(p => p.name).join(', ')
  }

  // Filtrar cursos por el programa académico del estudiante.
  // Se incluyen los cursos sin programa asignado ("General") para todos los estudiantes.
  const studentProgram = user?.academic_program
  const visibleCourses = courses.filter(c =>
    !c.academic_program ||                        // sin programa = General (visible para todos)
    !studentProgram ||                            // si el estudiante no tiene programa, ve todo
    c.academic_program === studentProgram          // coincide con su programa
  )

  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  const fmtDate = (d) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const paymentStatusStyle = (s) => ({
    PENDING_PAYMENT: { bg: '#fefce8', color: '#854d0e', label: '⏳ Pendiente' },
    PAID: { bg: '#ecfdf5', color: '#065f46', label: '✅ Pagado' },
    CANCELLED: { bg: '#fef2f2', color: '#991b1b', label: '❌ Cancelado' }
  }[s] || { bg: '#f1f5f9', color: '#475569', label: s })

  const pendingCount = myPayments.filter(p => p.status === 'PENDING_PAYMENT').length

  return (
    <div className="enrollment-manager">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>SGAU · Proceso de Inscripción</h2>
          <p className="subtitle">Inscríbete en las materias ofertadas para este semestre.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="badge">{myEnrollments.filter(e => e.status === 'ENROLLED').length} Materias Inscritas</div>
          {pendingCount > 0 && (
            <div className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
              {pendingCount} Pago{pendingCount > 1 ? 's' : ''} Pendiente{pendingCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {error && <p className="error" style={{ marginBottom: '20px' }}>{error}</p>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#f1f5f9', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[
          { id: 'catalog', label: '📚 Oferta Académica' },
          { id: 'payments', label: `💳 Compromisos de Pago${pendingCount > 0 ? ` (${pendingCount})` : ''}` }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '8px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            background: activeTab === tab.id ? '#fff' : 'transparent',
            color: activeTab === tab.id ? '#1e293b' : '#64748b',
            boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            transition: 'all .15s'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Catálogo */}
      {activeTab === 'catalog' && (
        <div>
          {/* Banner del programa académico */}
          {studentProgram && (
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              color: '#1e40af'
            }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Mostrando materias del programa: <strong>{studentProgram}</strong>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#3b82f6' }}>
                {visibleCourses.length} materia{visibleCourses.length !== 1 ? 's' : ''} disponible{visibleCourses.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {visibleCourses.map(course => {
            const enrollment = myEnrollments.find(e => e.course_id === course.id)
            const isEnrolled = enrollment?.status === 'ENROLLED'
            const isPassed = enrollment?.status === 'PASSED'
            const isFailed = enrollment?.status === 'FAILED'
            const coursePayment = myPayments.find(p => p.enrollment_id === enrollment?.id)
            const available = slots[String(course.id)] ?? 20
            const isFull = available <= 0

            return (
              <div key={course.id} className="form-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                {isPassed && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }} />}
                {isEnrolled && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#3b82f6' }} />}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px' }}>{course.name}</h4>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {/* Badge cupos */}
                    <span style={{
                      background: isFull ? '#fef2f2' : available <= 5 ? '#fef3c7' : '#ecfdf5',
                      color: isFull ? '#dc2626' : available <= 5 ? '#92400e' : '#065f46',
                      padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap'
                    }}>
                      {isFull ? '🔴 Sin cupos' : `🟢 ${available}/20 cupos`}
                    </span>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                      {course.credits} CR
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', flexGrow: 1 }}>
                  {course.description || 'Sin descripción detallada.'}
                </div>

                <div style={{ display: 'grid', gap: '7px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '13px', color: '#475569' }}>
                    <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span><strong>Horario:</strong> {course.schedule || 'Por definir'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '13px', color: '#475569' }}>
                    <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span><strong>Docente:</strong> {getTeacherName(course.teacher_id)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '13px', color: '#475569' }}>
                    <svg style={{ marginTop: '2px' }} width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span><strong>Prerrequisitos:</strong> <span style={{ color: '#ef4444' }}>{getPrerequisitesText(course)}</span></span>
                  </div>
                  {/* Monto estimado */}
                  <div style={{ display: 'flex', gap: '6px', fontSize: '13px', color: '#475569' }}>
                    <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span><strong>Costo materia:</strong> {fmt((course.credits || 3) * 125000)}</span>
                  </div>
                </div>

                {/* Pago pendiente badge */}
                {isEnrolled && coursePayment?.status === 'PENDING_PAYMENT' && (
                  <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', color: '#854d0e', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Pago pendiente: <strong>{fmt(coursePayment.amount)}</strong> — vence {fmtDate(coursePayment.due_date)}
                  </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                  {isPassed ? (
                    <div style={{ textAlign: 'center', color: '#059669', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Materia Aprobada
                    </div>
                  ) : isEnrolled ? (
                    <div style={{ textAlign: 'center', color: '#2563eb', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Inscrito Actual
                    </div>
                  ) : isFailed ? (
                    <div style={{ textAlign: 'center', color: '#dc2626', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      No Aprobada (Puedes Reinscribir)
                    </div>
                  ) : (
                    <button
                      onClick={() => requestEnroll(course)}
                      disabled={isFull}
                      style={{ width: '100%', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: isFull ? 0.5 : 1, cursor: isFull ? 'not-allowed' : 'pointer' }}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {isFull ? 'Sin cupos disponibles' : 'Inscribirme'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {visibleCourses.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
              {studentProgram
                ? `No hay materias ofertadas para ${studentProgram} actualmente.`
                : 'No hay materias ofertadas actualmente.'}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Tab: Compromisos de Pago */}
      {activeTab === 'payments' && (
        <div>
          {myPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: '16px', opacity: .5 }}>
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>No tienes compromisos de pago registrados aún.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {myPayments.map(payment => {
                const enrollment = myEnrollments.find(e => e.id === payment.enrollment_id)
                const course = courses.find(c => c.id === enrollment?.course_id)
                const ps = paymentStatusStyle(payment.status)
                return (
                  <div key={payment.id} className="form-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#1e293b', fontSize: '15px' }}>
                        {course?.name || `Materia #${enrollment?.course_id}`}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                        Compromiso #{payment.id} · Inscripción #{payment.enrollment_id}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 2px', fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{fmt(payment.amount)}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Monto total</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '600', color: payment.status === 'PENDING_PAYMENT' ? '#dc2626' : '#64748b' }}>
                        {fmtDate(payment.due_date)}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Fecha límite</p>
                    </div>
                    <span style={{ background: ps.bg, color: ps.color, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {ps.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Compromiso de Pago */}
      {paymentModal && (
        <PaymentModal
          payment={paymentModal.payment}
          courseName={paymentModal.courseName}
          onClose={() => setPaymentModal(null)}
        />
      )}

      {/* Modal de Confirmación de Inscripción */}
      {confirmModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'
              }}>
                <svg width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '18px' }}>¿Confirmar Inscripción?</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                Estás a punto de inscribirte en<br/>
                <strong style={{ color: '#1e293b', fontSize: '15px' }}>{confirmModal.name}</strong>
              </p>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', marginBottom: '22px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Créditos:</span>
                <strong>{confirmModal.credits} CR</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Costo estimado:</span>
                <strong style={{ color: '#059669' }}>{fmt((confirmModal.credits || 3) * 125000)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Cupos disponibles:</span>
                <strong>{slots[String(confirmModal.id)] ?? 20}/20</strong>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginBottom: '20px' }}>
              Al confirmar, se generará un compromiso de pago con vencimiento de 15 días hábiles.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{ flex: 1, padding: '11px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmEnroll}
                style={{ flex: 1, padding: '11px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Sí, inscribirme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
