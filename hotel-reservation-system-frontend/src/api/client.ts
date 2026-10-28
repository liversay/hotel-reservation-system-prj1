export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const TOKEN_KEY = 'hotel.token'

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  const token = tokenStore.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    let message = res.statusText
    try {
      message = (await res.json()).message ?? message
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    throw new ApiError(res.status, message)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}
