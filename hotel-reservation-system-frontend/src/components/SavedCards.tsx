import { useState, type FormEvent } from 'react'
import { api } from '../api/client'

export interface PaymentMethod {
  id: number
  brand: string
  last4: string
  holderName: string
  expMonth: number
  expYear: number
  defaultMethod: boolean
}

interface Props {
  methods: PaymentMethod[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  onAdded: (m: PaymentMethod) => void
}

export default function SavedCards({ methods, selectedId, onSelect, onAdded }: Props) {
  const [adding, setAdding] = useState(methods.length === 0)
  const [form, setForm] = useState({ cardNumber: '', holderName: '', expMonth: '', expYear: '' })
  const [error, setError] = useState<string | null>(null)

  const add = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const created = await api<PaymentMethod>('/api/payment-methods', {
        method: 'POST',
        body: JSON.stringify({ ...form, expMonth: Number(form.expMonth), expYear: Number(form.expYear) }),
      })
      // El numero completo no se conserva en el estado de la UI tras enviarlo.
      setForm({ cardNumber: '', holderName: '', expMonth: '', expYear: '' })
      setAdding(false)
      onAdded(created)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section aria-label="Métodos de pago" className="space-y-2 rounded border p-4">
      <h2 className="font-semibold">Pago</h2>
      {methods.map((m) => (
        <label key={m.id} className="flex items-center gap-2">
          <input type="radio" name="card" checked={selectedId === m.id} onChange={() => onSelect(m.id)} />
          {m.brand} •••• {m.last4} <span className="text-sm text-gray-500">({String(m.expMonth).padStart(2, '0')}/{m.expYear})</span>
          {m.defaultMethod && <span className="rounded bg-blue-100 px-1 text-xs">predeterminada</span>}
        </label>
      ))}
      {!adding && <button type="button" className="text-sm text-blue-700 underline" onClick={() => setAdding(true)}>Usar otra tarjeta</button>}
      {adding && (
        <form onSubmit={add} className="grid gap-2">
          <input aria-label="Número de tarjeta" inputMode="numeric" autoComplete="cc-number" required className="rounded border p-2"
            value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} placeholder="Número de tarjeta" />
          <input aria-label="Titular" autoComplete="cc-name" required className="rounded border p-2"
            value={form.holderName} onChange={(e) => setForm({ ...form, holderName: e.target.value })} placeholder="Titular" />
          <div className="flex gap-2">
            <input aria-label="Mes" required className="w-20 rounded border p-2" placeholder="MM"
              value={form.expMonth} onChange={(e) => setForm({ ...form, expMonth: e.target.value })} />
            <input aria-label="Año" required className="w-24 rounded border p-2" placeholder="AAAA"
              value={form.expYear} onChange={(e) => setForm({ ...form, expYear: e.target.value })} />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button className="rounded border px-3 py-1">Guardar tarjeta</button>
        </form>
      )}
    </section>
  )
}
