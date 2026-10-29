import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, tokenStore } from '../api/client'
import { safeNext, type AuthResponse } from './Login'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    try {
      const res = await api<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(form) })
      tokenStore.set(res.token)
      navigate(safeNext(next) ?? '/')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const field = (name: 'username' | 'email' | 'password', label: string, type = 'text') => (
    <label className="block text-sm">
      {label}
      <input
        type={type}
        required
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="mt-1 w-full rounded border p-2"
      />
    </label>
  )

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-bold">Crear cuenta</h1>
      <form onSubmit={submit} noValidate className="space-y-3">
        {field('username', 'Usuario')}
        {field('email', 'Email', 'email')}
        {field('password', 'Contraseña (mín. 8 caracteres)', 'password')}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-blue-600 py-2 text-white">Registrarme</button>
      </form>
      <Link className="mt-3 inline-block text-sm text-blue-700 underline" to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>
        Ya tengo cuenta
      </Link>
    </main>
  )
}
