/** Pestañas del panel de administración: clave interna (no cambiar) y etiqueta visible. */
export const ADMIN_TABS = [
  { key: 'dashboard', label: 'Panel' },
  { key: 'hotel', label: 'Hoteles' },
  { key: 'rooms', label: 'Habitaciones' },
  { key: 'users', label: 'Usuarios' },
] as const

export const adminTabLabel = (key: string) => ADMIN_TABS.find((t) => t.key === key)?.label ?? key
