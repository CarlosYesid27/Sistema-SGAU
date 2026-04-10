const ACADEMIC_PROGRAMS = [
  'Ingeniería de Sistemas',
  'Derecho',
  'Psicología'
]

export default function RegisterScreen({
  form,
  onChange,
  onSubmit,
  onGoLogin,
  messageType,
  error
}) {
  return (
    <main className="auth-layout">
      <section className="auth-shell">
        <article className="auth-hero">
          <p className="auth-kicker">Registro seguro</p>
          <h1>Crea tu cuenta en minutos</h1>
          <p className="auth-hero-text">
            Registra usuarios con sus datos básicos, documento y rol.
          </p>
          <ul className="auth-points">
            <li>Registro con información completa del usuario</li>
            <li>Ingreso inmediato mediante login</li>
            <li>Gestión posterior de usuarios y permisos</li>
          </ul>
        </article>

        <div className="auth-card auth-card-register">
          <div className="auth-header">
            <h2>Crear cuenta</h2>
            <p>Completa los datos para registrar un nuevo usuario</p>
          </div>

          {error && <p className={messageType === 'success' ? 'success' : 'error'}>{error}</p>}

          <form onSubmit={onSubmit} className="auth-form auth-grid-form">
            <label>
              Nombre
              <input
                value={form.first_name}
                onChange={(e) => onChange('first_name', e.target.value)}
                required
              />
            </label>

            <label>
              Apellido
              <input
                value={form.last_name}
                onChange={(e) => onChange('last_name', e.target.value)}
                required
              />
            </label>

            <label>
              Correo
              <input
                type="email"
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                required
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
                required
              />
            </label>

            <label>
              Teléfono
              <input
                value={form.phone}
                onChange={(e) => onChange('phone', e.target.value)}
              />
            </label>

            <label>
              Tipo de documento
              <select
                value={form.document_type}
                onChange={(e) => onChange('document_type', e.target.value)}
              >
                <option value="C.C">C.C</option>
                <option value="T.I">T.I</option>
              </select>
            </label>

            <label>
              Número de documento
              <input
                value={form.document_number}
                onChange={(e) => onChange('document_number', e.target.value)}
                required
              />
            </label>

            <label>
              Rol
              <select
                value={form.role}
                onChange={(e) => onChange('role', e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="docente">Docente</option>
                <option value="estudiante">Estudiante</option>
              </select>
            </label>

            {/* Programa académico: solo visible cuando el rol es Estudiante */}
            {form.role === 'estudiante' && (
              <label style={{ gridColumn: '1 / -1' }}>
                Programa Académico
                <select
                  value={form.academic_program || ''}
                  onChange={(e) => onChange('academic_program', e.target.value)}
                  required
                  style={{ borderColor: !form.academic_program ? '#ef4444' : undefined }}
                >
                  <option value="">— Selecciona un programa —</option>
                  {ACADEMIC_PROGRAMS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
            )}

            <button type="submit" className="auth-submit">Registrar usuario</button>
          </form>

          <p className="auth-footer">
            ¿Ya tienes cuenta?{' '}
            <button type="button" className="auth-link" onClick={onGoLogin}>
              Iniciar sesión
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}
