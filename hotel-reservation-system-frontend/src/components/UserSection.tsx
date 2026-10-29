import CrudPanel from './CrudPanel'
import { api } from '../api/client'

interface User {
  id: number
  username: string
  email: string
  role: string
}

const ROLES = [{ value: 'USER', label: 'USER' }, { value: 'ADMIN', label: 'ADMIN' }]

const load = () => api<User[]>('/api/admin/users')
const create = (v: Record<string, string>) => api('/api/admin/users', { method: 'POST', body: JSON.stringify(v) })
// En edición, la contraseña vacía significa "no cambiar" (el backend la ignora).
const update = (u: User, v: Record<string, string>) =>
  api(`/api/admin/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ email: v.email, role: v.role, password: v.password }) })
const remove = (u: User) => api(`/api/admin/users/${u.id}`, { method: 'DELETE' })

export default function UserSection() {
  return (
    <CrudPanel<User>
      title="Usuarios"
      columns={[
        { label: 'ID', render: (u) => u.id },
        { label: 'Usuario', render: (u) => u.username },
        { label: 'Email', render: (u) => u.email },
        { label: 'Rol', render: (u) => u.role },
      ]}
      fields={[
        { name: 'username', label: 'Usuario', required: true, createOnly: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Contraseña (mín. 8; vacío = no cambiar)', type: 'password', requiredOnCreate: true },
        { name: 'role', label: 'Rol', type: 'select', options: ROLES },
      ]}
      load={load}
      create={create}
      update={update}
      remove={remove}
      toValues={(u) => ({ username: u.username, email: u.email, password: '', role: u.role })}
    />
  )
}
