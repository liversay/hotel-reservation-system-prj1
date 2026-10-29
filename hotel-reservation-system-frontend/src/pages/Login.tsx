import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, tokenStore } from '../api/client'

export interface AuthResponse {
  token: string
  username: string
  role: string
}

/** Solo rutas internas: empieza con una sola '/' (rechaza '//host', '/\\host' y esquemas). */
export function safeNext(next: string | null): string | null {
  return next && /^\/(?![/\\])/.test(next) ? next : null
}

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await api<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(form) })
      tokenStore.set(res.token)
      navigate(safeNext(next) ?? (res.role === 'ADMIN' ? '/admin' : '/'))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-bold">Iniciar sesión</h1>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          Usuario
          <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="block text-sm">
          Contraseña
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded border p-2" />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-blue-600 py-2 text-white">Entrar</button>
      </form>
      <Link className="mt-3 inline-block text-sm text-blue-700 underline" to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}>
        ¿No tienes cuenta? Regístrate
      </Link>
    </main>
  )
}
