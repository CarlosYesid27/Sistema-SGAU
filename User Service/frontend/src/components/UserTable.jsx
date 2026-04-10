export default function UserTable({ users, onEdit, onDelete, userRole }) {
  const isAdmin = userRole === 'admin'

  return (
    <div className="table-card">
      <h2>Usuarios</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Programa</th>
            <th>Correo</th>
            <th>Rol</th>
            {isAdmin && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? "7" : "6"} className="empty">No hay usuarios registrados.</td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.first_name} {user.last_name}</td>
                <td><small style={{ color: '#64748b' }}>{user.document_type}:</small> {user.document_number}</td>
                <td>{user.academic_program || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>N/A</span>}</td>
                <td>{user.email}</td>
                <td><span className="badge" style={{ fontSize: '11px' }}>{user.role}</span></td>
                {isAdmin && (
                  <td>
                    <button onClick={() => onEdit(user)}>Editar</button>
                    <button className="danger" onClick={() => onDelete(user)}>Eliminar</button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
