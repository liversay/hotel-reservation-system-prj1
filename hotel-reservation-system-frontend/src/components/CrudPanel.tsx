import { useCallback, useEffect, useState, type FormEvent } from 'react'

export interface Column<T> {
  label: string
  render: (item: T) => React.ReactNode
}

export interface Field {
  name: string
  label: string
  type?: 'text' | 'number' | 'email' | 'password' | 'select'
  options?: Array<{ value: string; label: string }>
  required?: boolean
  /** Solo editable al crear (p. ej. username). */
  createOnly?: boolean
  /** Obligatorio solo al crear (p. ej. contraseña). */
  requiredOnCreate?: boolean
}

type Values = Record<string, string>

interface Props<T extends { id: number }> {
  title: string
  columns: Column<T>[]
  fields: Field[]
  load: () => Promise<T[]>
  create: (v: Values) => Promise<unknown>
  update: (item: T, v: Values) => Promise<unknown>
  remove: (item: T) => Promise<unknown>
  toValues: (item: T) => Values
}

export default function CrudPanel<T extends { id: number }>(p: Props<T>) {
  const { title, columns, fields, load, create, update, remove, toValues } = p
  const [items, setItems] = useState<T[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ item: T | null; values: Values } | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const refresh = useCallback(() => {
    load().then(setItems).catch((e: Error) => setError(e.message))
  }, [load])

  useEffect(refresh, [refresh])

  const openNew = () => {
    setError(null)
    setEditing({ item: null, values: Object.fromEntries(fields.map((f) => [f.name, f.type === 'select' ? f.options?.[0]?.value ?? '' : ''])) })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setError(null)
    try {
      if (editing.item) await update(editing.item, editing.values)
      else await create(editing.values)
      setEditing(null)
      refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const doDelete = async (item: T) => {
    setError(null)
    try {
      await remove(item)
      setConfirmId(null)
      refresh()
    } catch (err) {
      setConfirmId(null)
      setError((err as Error).message)
    }
  }

  const isNew = !editing?.item

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={openNew} className="rounded bg-blue-600 px-3 py-1 text-white">+ Nuevo</button>
      </div>
      {error && <p role="alert" className="px-4 pb-2 text-red-600">{error}</p>}

      {editing && (
        <form onSubmit={submit} aria-label={isNew ? `Crear ${title}` : `Editar ${title}`} className="grid gap-3 border-y bg-gray-50 p-4 sm:grid-cols-2">
          {fields.filter((f) => isNew || !f.createOnly).map((f) => (
            <label key={f.name} className="text-sm">
              {f.label}
              {f.type === 'select' ? (
                <select value={editing.values[f.name]} className="mt-1 w-full rounded border p-2"
                  onChange={(e) => setEditing({ ...editing, values: { ...editing.values, [f.name]: e.target.value } })}>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={f.type ?? 'text'} step={f.type === 'number' ? 'any' : undefined} className="mt-1 w-full rounded border p-2"
                  required={f.required || (isNew && f.requiredOnCreate)}
                  value={editing.values[f.name]}
                  onChange={(e) => setEditing({ ...editing, values: { ...editing.values, [f.name]: e.target.value } })} />
              )}
            </label>
          ))}
          <div className="flex gap-2 sm:col-span-2">
            <button className="rounded bg-blue-600 px-3 py-1 text-white">Guardar</button>
            <button type="button" onClick={() => setEditing(null)} className="rounded border px-3 py-1">Cancelar</button>
          </div>
        </form>
      )}

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => <th key={c.label} className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">{c.label}</th>)}
            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items?.length === 0 && <tr><td className="px-4 py-3 text-gray-500" colSpan={columns.length + 1}>Sin registros.</td></tr>}
          {items?.map((item) => (
            <tr key={item.id}>
              {columns.map((c) => <td key={c.label} className="whitespace-nowrap px-4 py-2">{c.render(item)}</td>)}
              <td className="whitespace-nowrap px-4 py-2">
                {confirmId === item.id ? (
                  <span>
                    ¿Eliminar?{' '}
                    <button onClick={() => doDelete(item)} className="text-red-700 underline">Sí</button>{' '}
                    <button onClick={() => setConfirmId(null)} className="underline">No</button>
                  </span>
                ) : (
                  <span className="space-x-3">
                    <button onClick={() => { setError(null); setEditing({ item, values: toValues(item) }) }} className="text-blue-700 underline">Editar</button>
                    <button onClick={() => setConfirmId(item.id)} className="text-red-700 underline">Eliminar</button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
