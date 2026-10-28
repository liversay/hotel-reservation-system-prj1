import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, tokenStore } from '../api/client'

interface AuthResponse {
  token: string
  username: string
  role: string
}

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await api<AuthResponse>(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) })
      tokenStore.set(res.token)
      navigate(params.get('next') ?? (res.role === 'ADMIN' ? '/admin' : '/'))
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
      <h1 className="mb-4 text-2xl font-bold">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
      <form onSubmit={submit} className="space-y-3">
        {field('username', 'Usuario')}
        {mode === 'register' && field('email', 'Email', 'email')}
        {field('password', 'Contraseña (mín. 8)', 'password')}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-blue-600 py-2 text-white">{mode === 'login' ? 'Entrar' : 'Registrarme'}</button>
      </form>
      <button className="mt-3 text-sm text-blue-700 underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo cuenta'}
      </button>
    </main>
  )
}
