import { useEffect, useState } from 'react'
import UserForm from './components/UserForm'
import UserTable from './components/UserTable'
import ProfileView from './components/ProfileView'
import LoginScreen from './components/LoginScreen'
import RegisterScreen from './components/RegisterScreen'
import CourseManager from './components/CourseManager'
import EnrollmentManager from './components/EnrollmentManager'
import GradesView from './components/GradesView'
import TeacherGradesView from './components/TeacherGradesView'
import StudentHistoryView from './components/StudentHistoryView'
import OfferManager from './components/OfferManager'
import PaymentWidget from './components/PaymentWidget'
import { authApi, authStorage, usersApi } from './services/api'

export default function App() {
  const [users, setUsers] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [error, setError] = useState('')
  const [authMessageType, setAuthMessageType] = useState('error')
  const [token, setToken] = useState(authStorage.getToken())
  const [userRole, setUserRole] = useState(authStorage.getRole())
  const [authView, setAuthView] = useState('login')
  const [adminTab, setAdminTab] = useState('users')
  const [studentTab, setStudentTab] = useState('enrollments')
  const [teacherTab, setTeacherTab] = useState('grades')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerData, setRegisterData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    document_type: 'C.C',
    document_number: '',
    role: 'estudiante',
    academic_program: ''
  })
  const [userToDelete, setUserToDelete] = useState(null)
  const [me, setMe] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const loadUsers = async () => {
    try {
      const response = await usersApi.getAll()
      setUsers(response.data.value || response.data)
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout()
      } else {
        setError('No se pudo cargar la lista de usuarios.')
      }
    }
  }

  const loadMe = async () => {
    try {
      setLoadingProfile(true)
      const response = await authApi.getMe()
      setMe(response.data)
    } catch {
      setError('No se pudo cargar tu perfil personal.')
    } finally {
      setLoadingProfile(false)
    }
  }

  useEffect(() => {
    if (token) {
      if (userRole === 'admin') {
        loadUsers()
      } else {
        loadMe()
      }
    }
  }, [token, userRole])

  const handleLogin = async (event) => {
    event.preventDefault()
    try {
      setError('')
      setAuthMessageType('error')
      const response = await authApi.login({ email: loginEmail, password: loginPassword })
      authStorage.setToken(response.data.access_token)
      authStorage.setRole(response.data.role)
      setToken(response.data.access_token)
      setUserRole(response.data.role)
    } catch {
      setAuthMessageType('error')
      setError('No se pudo iniciar sesión. Verifica correo y contraseña.')
    }
  }

  const handleRegisterChange = (field, value) => {
    setRegisterData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogout = () => {
    authStorage.clearToken()
    setToken('')
    setUserRole(null)
    setMe(null)
    setUsers([])
    setEditingUser(null)
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    try {
      setError('')
      setAuthMessageType('error')
      await authApi.register(registerData)
      setLoginEmail(registerData.email)
      setLoginPassword(registerData.password)
      setAuthView('login')
      setAuthMessageType('success')
      setError('Registro exitoso. Ahora inicia sesión.')
      setRegisterData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
        document_type: 'C.C',
        document_number: '',
        role: 'estudiante',
        academic_program: ''
      })
    } catch (err) {
      const message = err.response?.data?.detail || 'No se pudo registrar el usuario.'
      setAuthMessageType('error')
      setError(message)
    }
  }

  const handleSubmit = async (payload) => {
    if (!editingUser) return
    try {
      setError('')
      await usersApi.update(editingUser.id, payload)
      setEditingUser(null)
      await loadUsers()
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Tu sesión expiró o no está autenticada. Inicia sesión nuevamente.')
        return
      }
      const message = err.response?.data?.detail || 'No se pudo guardar el usuario.'
      setError(message)
    }
  }

  const requestDeleteUser = (user) => {
    setUserToDelete(user)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    try {
      setError('')
      await usersApi.remove(userToDelete.id)
      setUserToDelete(null)
      await loadUsers()
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Tu sesión expiró o no está autenticada. Inicia sesión nuevamente.')
        return
      }
      setError('No se pudo eliminar el usuario.')
    }
  }

  if (!token) {
    if (authView === 'register') {
      return (
        <RegisterScreen
          form={registerData}
          onChange={handleRegisterChange}
          onSubmit={handleRegister}
          onGoLogin={() => {
            setError('')
            setAuthMessageType('error')
            setAuthView('login')
          }}
          messageType={authMessageType}
          error={error}
        />
      )
    }

    return (
      <LoginScreen
        email={loginEmail}
        password={loginPassword}
        onEmailChange={setLoginEmail}
        onPasswordChange={setLoginPassword}
        onSubmit={handleLogin}
        onGoRegister={() => {
          setError('')
          setAuthMessageType('error')
          setAuthView('register')
        }}
        messageType={authMessageType}
        error={error}
      />
    )
  }

  return (
    <div className={(userRole === 'admin' || userRole === 'estudiante' || userRole === 'docente') ? "admin-layout" : "container"}>
      {(userRole === 'admin' || userRole === 'estudiante' || userRole === 'docente') && (
        <aside className="admin-sidebar">
          <div className="sidebar-brand">
            <h2>SGAU {userRole === 'admin' ? 'Admin' : userRole === 'docente' ? 'Docente' : 'Estudiante'}</h2>
          </div>
          <nav className="nav-tabs vertical">
            {userRole === 'admin' ? (
              <>
                <button 
                  type="button"
                  className={adminTab === 'users' ? 'tab-btn active' : 'tab-btn'} 
                  onClick={() => setAdminTab('users')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M128,120a56,56,0,1,0-56-56A56.06,56.06,0,0,0,128,120Zm0-96a40,40,0,1,1-40,40A40,40,0,0,1,128,24ZM231.88,206a111.45,111.45,0,0,0-52-47.53,8,8,0,0,0-6.17,14.61,95.53,95.53,0,0,1,44.75,40.71c6.51,11,1.52,18.23-8.46,18.23H46c-10,0-15-7.24-8.46-18.23A95.43,95.43,0,0,1,82.26,173.1a8,8,0,0,0-6.17-14.61A111.41,111.41,0,0,0,24.12,206c-16.14,27.35,3.61,42,35.48,42H196.4C228.27,248,248,233.33,231.88,206Z"></path>
                  </svg>
                  <span>Usuarios</span>
                </button>
                <button 
                  type="button"
                  className={adminTab === 'courses' ? 'tab-btn active' : 'tab-btn'} 
                  onClick={() => setAdminTab('courses')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM184,80H72a8,8,0,0,0,0,16H184a8,8,0,0,0,0-16Zm0,40H72a8,8,0,0,0,0,16H184a8,8,0,0,0,0-16Zm-64,40H72a8,8,0,0,0,0,16H120a8,8,0,0,0,0-16Z"></path>
                  </svg>
                  <span>Materias</span>
                </button>
                <button 
                  type="button"
                  className={adminTab === 'offers' ? 'tab-btn active' : 'tab-btn'} 
                  onClick={() => setAdminTab('offers')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200Zm-24-40a8,8,0,0,1-8,8H72a8,8,0,0,1,0-16H184A8,8,0,0,1,192,160Zm0-40a8,8,0,0,1-8,8H72a8,8,0,0,1,0-16H184A8,8,0,0,1,192,120Zm0-40a8,8,0,0,1-8,8H72a8,8,0,0,1,0-16H184A8,8,0,0,1,192,80Z"></path>
                  </svg>
                  <span>Oferta Académica</span>
                </button>
              </>
            ) : userRole === 'docente' ? (
              <>
                <button
                  type="button"
                  className={teacherTab === 'grades' ? 'tab-btn active' : 'tab-btn'}
                  onClick={() => setTeacherTab('grades')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-45.54-48.85a36.05,36.05,0,1,0-11.31,11.31l11.19,11.2a8,8,0,0,0,11.32-11.31ZM96,164a20,20,0,1,1,20,20A20,20,0,0,1,96,164Z"></path>
                  </svg>
                  <span>Calificaciones</span>
                </button>
                <button
                  type="button"
                  className={teacherTab === 'profile' ? 'tab-btn active' : 'tab-btn'}
                  onClick={() => setTeacherTab('profile')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-59.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,131.52,0Z"></path>
                  </svg>
                  <span>Mi Perfil</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  type="button"
                  className={studentTab === 'enrollments' ? 'tab-btn active' : 'tab-btn'} 
                  onClick={() => setStudentTab('enrollments')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M224,115.55V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H136a8,8,0,0,1,0,16H48V208H208V115.55a8,8,0,0,1,16,0Zm-50.34-84.9a8,8,0,0,0-11.32,0L72,121.08V152a8,8,0,0,0,8,8h30.92l90.43-90.43a8,8,0,0,0,0-11.31ZM97.08,144H88v-9.08l76-76,9.08,9.08Zm101-101-9.08-9.08L205.08,18l9.08,9.08Z"></path>
                  </svg>
                  <span>Inscripciones</span>
                </button>
                <button 
                  type="button"
                  className={studentTab === 'grades' ? 'tab-btn active' : 'tab-btn'} 
                  onClick={() => setStudentTab('grades')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-45.54-48.85a36.05,36.05,0,1,0-11.31,11.31l11.19,11.2a8,8,0,0,0,11.32-11.31ZM96,164a20,20,0,1,1,20,20A20,20,0,0,1,96,164Z"></path>
                  </svg>
                  <span>Mis Notas</span>
                </button>
                <button 
                  type="button"
                  className={studentTab === 'history' ? 'tab-btn active' : 'tab-btn'} 
                  onClick={() => setStudentTab('history')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M224,120v64a8,8,0,0,1-16,0V120a16,16,0,0,0-16-16H54.34L77.66,127.34a8,8,0,0,1-11.32,11.32l-32-32a8,8,0,0,1,0-11.32l32-32a8,8,0,0,1,11.32,11.32L54.34,88H192A32,32,0,0,1,224,120Z"></path>
                  </svg>
                  <span>Historial Académico</span>
                </button>
                <button 
                  type="button"
                  className={studentTab === 'profile' ? 'tab-btn active' : 'tab-btn'} 
                  onClick={() => setStudentTab('profile')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-59.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,131.52,0Z"></path>
                  </svg>
                  <span>Mi Perfil</span>
                </button>
                <button 
                  type="button"
                  className={studentTab === 'payments' ? 'tab-btn active' : 'tab-btn'} 
                  onClick={() => setStudentTab('payments')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,144h-8a8,8,0,0,1,0-16h8a24,24,0,0,0,0-48h-8V88a8,8,0,0,0-16,0v16h-8a8,8,0,0,0,0,16h8a8,8,0,0,1,0,16h-8a24,24,0,0,0,0,48h8v16a8,8,0,0,0,16,0V184h8A8,8,0,0,0,136,168Z"></path>
                  </svg>
                  <span>Mis Pagos</span>
                </button>
              </>
            )}
            
            <div style={{ flexGrow: 1 }} />
            <button type="button" className="tab-btn danger-text" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                <path d="M120,216a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H56V208h56A8,8,0,0,1,120,216Zm110.15-93.15-40-40a8,8,0,0,0-11.3,11.3L204.69,120H104a8,8,0,0,0,0,16H204.69l-25.84,25.85a8,8,0,0,0,11.3,11.3l40-40A8,8,0,0,0,230.15,122.85Z"></path>
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </nav>
        </aside>
      )}

      <main className={(userRole === 'admin' || userRole === 'estudiante' || userRole === 'docente') ? "admin-content" : "container"}>
        <header className="page-header">
          <div>
            <h1>
              SGAU · {userRole === 'admin'
                ? (adminTab === 'users' ? 'Gestión de Usuarios' : adminTab === 'courses' ? 'Catálogo de Materias' : 'Oferta Académica')
                : userRole === 'docente'
                ? (teacherTab === 'grades' ? 'Calificaciones' : 'Mi Perfil')
                : (studentTab === 'enrollments' ? 'Proceso de Inscripción' : studentTab === 'grades' ? 'Mis Calificaciones' : studentTab === 'history' ? 'Historial Académico' : studentTab === 'payments' ? 'Centro de Pagos' : 'Mi Perfil Estudiantil')}
            </h1>
            <p className="subtitle">
              {userRole === 'admin' 
                ? (adminTab === 'users' ? 'Usuarios registrados en sistema activo (solo listar, editar y eliminar).' : adminTab === 'courses' ? 'Administra inscripciones, prerrequisitos y docentes académicos.' : 'Gestiona la disponibilidad y el momento de oferta de las materias.')
                : userRole === 'docente'
                ? (teacherTab === 'grades' ? 'Ingresa y gestiona las calificaciones de tus estudiantes.' : 'Información personal y credenciales.')
                : (studentTab === 'enrollments' ? 'Inscríbete en las materias ofertadas para este semestre.' : studentTab === 'grades' ? 'Consulta tus notas y promedio acumulado.' : studentTab === 'history' ? 'Revisa tu progreso académico y nivel de aprobación histórico.' : studentTab === 'payments' ? 'Paga tus liquidaciones y recargos con Wompi.' : 'Información personal y credenciales.')}
            </p>
          </div>
          <div className="actions">
            {userRole === 'admin' && adminTab === 'users' && <span className="badge">Total: {users.length}</span>}
            {userRole !== 'admin' && userRole !== 'estudiante' && <button type="button" className="secondary" onClick={handleLogout}>Salir</button>}
          </div>
        </header>
        {error && <p className="error">{error}</p>}
        {userRole === 'admin' ? (
          <>
            {adminTab === 'users' ? (
              <>
                {editingUser && <UserForm editingUser={editingUser} onSubmit={handleSubmit} onCancel={() => setEditingUser(null)} />}
                <UserTable users={users} onEdit={setEditingUser} onDelete={requestDeleteUser} userRole={userRole} />
              </>
            ) : adminTab === 'courses' ? (
              <CourseManager />
            ) : (
              <OfferManager />
            )}
          </>
        ) : userRole === 'docente' ? (
          <>
            {teacherTab === 'grades' ? <TeacherGradesView user={me} /> : <ProfileView user={me} />}
          </>
        ) : userRole === 'estudiante' ? (
          <>
            {studentTab === 'enrollments'
              ? <EnrollmentManager user={me} />
              : studentTab === 'grades'
              ? <GradesView />
              : studentTab === 'history'
              ? <StudentHistoryView user={me} />
              : studentTab === 'payments'
              ? <PaymentWidget />
              : <ProfileView user={me} />}
          </>
        ) : (
          <ProfileView user={me} />
        )}
      </main>

      {userToDelete && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
          <div className="modal-card">
            <h2 id="delete-user-title">Confirmar eliminación</h2>
            <p className="modal-text">
              ¿Deseas eliminar a <strong>{userToDelete.first_name} {userToDelete.last_name}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setUserToDelete(null)}>
                Cancelar
              </button>
              <button type="button" className="danger" onClick={handleConfirmDelete}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
