export default function LoginScreen({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoRegister,
  messageType,
  error
}) {
  return (
    <main className="auth-layout">
      <section className="auth-shell">
        <article className="auth-hero">
          <p className="auth-kicker">Sistema SGAU</p>
          <h1>Bienvenido de nuevo</h1>
          <p className="auth-hero-text">
            Gestiona usuarios de forma segura, centralizada y rápida.
            Inicia sesión para continuar con la administración del sistema académico.
          </p>
        </article>

        <div className="auth-card">
          <div className="auth-header">
            <h2>Iniciar sesión</h2>
            <p>Ingresa tus credenciales para acceder</p>
          </div>

          {error && <p className={messageType === 'success' ? 'success' : 'error'}>{error}</p>}

          <form onSubmit={onSubmit} className="auth-form">
            <label>
              Correo electrónico
              <input
                type="email"
                placeholder="usuario@correo.com"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                required
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                required
              />
            </label>

            <button type="submit" className="auth-submit">Iniciar sesión</button>
          </form>

          <p className="auth-footer">
            ¿No tienes cuenta?{' '}
            <button type="button" className="auth-link" onClick={onGoRegister}>
              Regístrate
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}
