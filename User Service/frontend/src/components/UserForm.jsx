import { useEffect, useState } from 'react'

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  document_type: 'C.C',
  document_number: '',
  role: 'estudiante',
  academic_program: ''
}

const ACADEMIC_PROGRAMS = [
  'Ingeniería de Sistemas',
  'Derecho',
  'Psicología'
]

export default function UserForm({ editingUser, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (editingUser) {
      setForm({
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        email: editingUser.email,
        phone: editingUser.phone || '',
        document_type: editingUser.document_type || 'C.C',
        document_number: editingUser.document_number || '',
        role: editingUser.role,
        academic_program: editingUser.academic_program || ''
      })
    } else {
      setForm(emptyForm)
    }
  }, [editingUser])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h2>Editar usuario</h2>

      <div className="grid">
        <input name="first_name" placeholder="Nombre" value={form.first_name} onChange={handleChange} required />
        <input name="last_name" placeholder="Apellido" value={form.last_name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Correo" value={form.email} onChange={handleChange} required />
        <input name="phone" placeholder="Teléfono" value={form.phone} onChange={handleChange} />
        
        <select name="document_type" value={form.document_type} onChange={handleChange}>
          <option value="C.C">C.C (Cédula)</option>
          <option value="T.I">T.I (Identidad)</option>
        </select>
        <input name="document_number" placeholder="Número de Documento" value={form.document_number} onChange={handleChange} required />

        <select name="role" value={form.role} onChange={handleChange}>
          <option value="admin">Admin</option>
          <option value="docente">Docente</option>
          <option value="estudiante">Estudiante</option>
        </select>

        {form.role === 'estudiante' && (
          <select name="academic_program" value={form.academic_program} onChange={handleChange} required>
            <option value="">-- Selecciona Programa --</option>
            {ACADEMIC_PROGRAMS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      <div className="actions">
        <button type="submit">Actualizar</button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
