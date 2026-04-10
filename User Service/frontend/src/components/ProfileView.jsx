export default function ProfileView({ user }) {
  if (!user) return <div className="loading">Cargando perfil...</div>

  return (
    <div className="form-card profile-view">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #1e67c6 0%, #1553a5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '32px',
          fontWeight: 'bold',
          boxShadow: '0 8px 16px rgba(21, 83, 165, 0.2)'
        }}>
          {user.first_name?.[0] || '?'}{user.last_name?.[0] || '?'}
        </div>
        <div>
          <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>{user.first_name || 'Usuario'} {user.last_name || ''}</h2>
          <span className="badge" style={{ background: '#f0f4f8', color: '#1a4fa3' }}>{user.role?.toUpperCase() || 'ROL'}</span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="profile-group">
          <label style={{ color: '#5f7288', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correo Electrónico</label>
          <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '500' }}>{user.email}</p>
        </div>

        <div className="profile-group">
          <label style={{ color: '#5f7288', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono / Contacto</label>
          <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '500' }}>{user.phone || 'No registrado'}</p>
        </div>

        <div className="profile-group">
          <label style={{ color: '#5f7288', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documento</label>
          <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '500' }}>{user.document_type} - {user.document_number}</p>
        </div>

        <div className="profile-group">
          <label style={{ color: '#5f7288', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado de Cuenta</label>
          <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '500' }}>
            <span style={{ color: user.is_active ? '#146c2e' : '#a51024' }}>
              ● {user.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </p>
        </div>

        {user.academic_program && (
          <div className="profile-group" style={{ gridColumn: '1 / -1' }}>
            <label style={{ color: '#5f7288', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Programa Académico</label>
            <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '600', color: '#1a4fa3' }}>{user.academic_program}</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e8eef7' }}>
        <p style={{ fontSize: '14px', color: '#6b7785', margin: 0 }}>
          Si necesitas actualizar tus datos personales, por favor póngase en contacto con el departamento de soporte o coordinación.
        </p>
      </div>
    </div>
  )
}
