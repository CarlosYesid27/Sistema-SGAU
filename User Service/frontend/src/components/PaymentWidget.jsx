import { useEffect, useState } from 'react'
import { paymentApi, enrollmentApi, courseApi } from '../services/api'

export default function PaymentWidget() {
  const [payments, setPayments] = useState([])
  const [courses, setCourses] = useState([])
  const [myEnrollments, setMyEnrollments] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [info, setInfo] = useState('')
  const [loadingId, setLoadingId] = useState(null)
  
  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      const [resPayments, resCourses, resEnrollments] = await Promise.all([
        enrollmentApi.getMyPayments(),
        courseApi.getAll().catch(() => ({ data: [] })),
        enrollmentApi.getMyEnrollments().catch(() => ({ data: [] }))
      ])
      const sorted = resPayments.data.sort((a, b) => b.id - a.id)
      setPayments(sorted)
      setCourses(resCourses.data)
      setMyEnrollments(resEnrollments.data)
    } catch (err) {
      setError('Error al cargar compromisos de pago. Verifica que el servicio esté activo.')
    }
  }

  const getCourseName = (payment) => {
    const enrollment = myEnrollments.find(e => e.id === payment.enrollment_id)
    if (!enrollment) return 'Aporte Académico'
    const course = courses.find(c => c.id === enrollment.course_id)
    return course ? course.name : 'Aporte Académico'
  }

  const handlePay = async (payment) => {
    setLoadingId(payment.id)
    setError('')
    setSuccess('')
    setInfo('')

    try {
      const { data } = await paymentApi.checkout({
        payment_commitment_id: payment.id,
        amount: payment.amount,
        course_name: getCourseName(payment)
      })
      
      if (data.init_point) {
        // Guardamos en sessionStorage que tenemos un pago en proceso para este compromiso
        sessionStorage.setItem(`pending_mp_${payment.id}`, "true")
        window.open(data.init_point, '_blank')
        
        // Al darle click de pagar y abrir la ventana nueva, refrescamos el listado
        setTimeout(() => loadPayments(), 1000)
        setLoadingId(null)
      } else {
        setError('No se pudo generar el enlace de pago de MercadoPago.')
        setLoadingId(null)
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Error desconocido'
      setError(`Error al contactar el servicio de pagos: ${detail}`)
      setLoadingId(null)
    }
  }

  const verifyPayment = async (paymentCommitmentId) => {
    setLoadingId('verifying_' + paymentCommitmentId)
    setError('')
    setSuccess('')
    setInfo('')
    try {
      const res = await paymentApi.verify(paymentCommitmentId)
      if (res.data.status === 'APPROVED') {
        setSuccess('✅ Pago aprobado con MercadoPago. Tu inscripción ha sido confirmada.')
        sessionStorage.removeItem(`pending_mp_${paymentCommitmentId}`)
      } else {
        setInfo(`⚠️ El pago aún NO ha sido aprobado en MercadoPago. Intenta verificar más tarde.`)
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Error verificando el pago con nuestro servidor.'
      setError(`⚠️ ${detail}`)
    } finally {
      setLoadingId(null)
      loadPayments()
    }
  }

  return (
    <div className="payment-manager">
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

      {info && (
        <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', color: '#92400e', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{info}</span>
          <button style={{background:'transparent', border:'none', cursor:'pointer', color:'#92400e', fontWeight:'bold', fontSize:'16px'}} onClick={() => setInfo('')}>✕</button>
        </div>
      )}

      <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', color: '#1e40af', fontSize: '14px' }}>
        <strong>ℹ️ Nota:</strong> Después de realizar el proceso de pago en MercadoPago, regresa a esta página y dale clic en "Validar Pago" para confirmar tu transacción.
      </div>

      <div className="table-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 8px' }}>
          <h3 style={{ margin: 0, color: '#334155' }}>Mis Compromisos Financieros (MercadoPago)</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', display: 'inline-block' }}></span>
            Checkout Pro Activo
          </div>
        </div>
        
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '600px' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Concepto</th>
                <th>Monto (COP)</th>
                <th>Fecha Límite</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="6" className="empty">No tienes pagos pendientes.</td></tr>
              ) : (
                payments.map(p => {
                  const isPendingInSession = sessionStorage.getItem(`pending_mp_${p.id}`) === "true"
                  return (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td>{getCourseName(p)}</td>
                      <td style={{ fontWeight: 'bold' }}>$ {p.amount.toLocaleString('es-CO')}</td>
                      <td>{new Date(p.due_date).toLocaleDateString('es-CO')}</td>
                      <td>
                        {p.status === 'PAID' ? (
                          <span style={{ color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #10b981' }}>✓ Pagado</span>
                        ) : p.status === 'CANCELLED' ? (
                          <span style={{ color: '#ef4444', background: '#fef2f2', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #fca5a5' }}>Cancelado</span>
                        ) : (
                          <span style={{ color: '#b45309', background: '#fffbeb', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #fcd34d' }}>Pendiente</span>
                        )}
                      </td>
                      <td>
                        <div className="actions" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                          {p.status === 'PENDING_PAYMENT' ? (
                            <>
                              <button
                                type="button"
                                style={{
                                  background: loadingId === p.id ? '#94a3b8' : '#009ee3', // Color azul MercadoPago
                                  color: 'white',
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  cursor: loadingId === p.id ? 'not-allowed' : 'pointer',
                                  fontWeight: '600',
                                  fontSize: '13px'
                                }}
                                onClick={() => handlePay(p)}
                                disabled={loadingId === p.id || loadingId === `verifying_${p.id}`}
                              >
                                {loadingId === p.id ? '⏳ Iniciando...' : '💳 Pagar'}
                              </button>
                              <button
                                type="button"
                                style={{
                                  background: loadingId === `verifying_${p.id}` ? '#94a3b8' : '#fbbf24',
                                  color: '#78350f',
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  cursor: loadingId === `verifying_${p.id}` ? 'not-allowed' : 'pointer',
                                  fontWeight: '600',
                                  fontSize: '13px'
                                }}
                                onClick={() => verifyPayment(p.id)}
                                disabled={loadingId === `verifying_${p.id}`}
                              >
                                {loadingId === `verifying_${p.id}` ? '⏳ Validando...' : '↻ Validar Pago'}
                              </button>
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Sin acción requerida</span>
                          )}
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
    </div>
  )
}
