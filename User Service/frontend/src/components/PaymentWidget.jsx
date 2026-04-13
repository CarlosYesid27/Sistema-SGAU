import { useEffect, useState } from 'react'
import { paymentApi, enrollmentApi } from '../services/api'

export default function PaymentWidget() {
  const [payments, setPayments] = useState([])
  const [error, setError] = useState('')
  const [loadingId, setLoadingId] = useState(null)
  const [verifyingId, setVerifyingId] = useState(null)
  
  useEffect(() => {
    loadPayments()
    
    // Inject script required by Wompi SDK
    const script = document.createElement('script')
    script.src = 'https://checkout.wompi.co/widget.js'
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])
  
  const loadPayments = async () => {
    try {
      const res = await enrollmentApi.getMyPayments()
      // Filter out only active payments or leave all as history
      const sorted = res.data.sort((a,b) => b.id - a.id)
      setPayments(sorted)
    } catch {
      setError('Error al cargar compromisos de pago')
    }
  }

  const handlePay = async (payment) => {
    setLoadingId(payment.id)
    setError('')
    try {
      const { data } = await paymentApi.checkout({
        payment_commitment_id: payment.id,
        amount: payment.amount
      })
      
      const checkout = new window.WidgetCheckout({
        currency: data.currency,
        amountInCents: data.amount_in_cents,
        reference: data.reference,
        publicKey: data.public_key,
        redirectUrl: '' // Not using redirection, using callback
      })
      
      checkout.open((result) => {
        const tx = result.transaction
        verifyPayment(tx.id, payment.id)
      })
    } catch {
      setError('Error al inicializar la pasarela de pago. Asegúrate que payment service esté activo.')
    } finally {
      setLoadingId(null)
    }
  }

  const verifyPayment = async (wompiTxId, paymentId) => {
    setVerifyingId(paymentId)
    try {
      const res = await paymentApi.verify(wompiTxId)
      if (res.data.status === 'APPROVED') {
        alert('Pago procesado correctamente. Tu inscripción ha sido aprobada.')
        loadPayments()
      } else {
        alert(`Transacción ${res.data.status}. Por favor verifica en tu banco o vuelve a intentar.`)
      }
    } catch {
      alert('Hubo un error verificando el pago con la pasarela. Si te cobraron, por favor contacta soporte.')
    } finally {
      setVerifyingId(null)
      loadPayments() // Reload anyway
    }
  }

  return (
    <div className="payment-manager">
      {error && <p className="error" style={{ marginBottom: '20px' }}>{error}</p>}
      <div className="table-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '0 8px' }}>
          <h3 style={{ margin: 0, color: '#334155' }}>Mis Compromisos Financieros (Wompi)</h3>
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
                payments.map(p => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>Aportes o Matrícula Ext.</td>
                    <td style={{ fontWeight: 'bold' }}>$ {p.amount.toLocaleString()}</td>
                    <td>{new Date(p.due_date).toLocaleDateString()}</td>
                    <td>
                      {p.status === 'PAID' ? (
                        <span style={{ color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Pagado</span>
                      ) : p.status === 'CANCELLED' ? (
                        <span style={{ color: '#ef4444', background: '#fef2f2', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Cancelado</span>
                      ) : (
                        <span style={{ color: '#b45309', background: '#fffbeb', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Pendiente</span>
                      )}
                    </td>
                    <td>
                      <div className="actions" style={{ justifyContent: 'flex-end' }}>
                        {p.status === 'PENDING_PAYMENT' ? (
                          <button 
                            type="button" 
                            style={{ background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                            onClick={() => handlePay(p)}
                            disabled={loadingId === p.id || verifyingId === p.id}
                          >
                            {loadingId === p.id ? 'Cargando Wompi...' : verifyingId === p.id ? 'Verificando...' : 'Pagar con Wompi'}
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Sin acción requerida</span>
                        )}
                      </div>
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
