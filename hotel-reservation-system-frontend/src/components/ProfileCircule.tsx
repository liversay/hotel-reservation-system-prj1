import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tokenStore } from '../api/client'

export default function ProfileCircule() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const logout = () => {
    tokenStore.clear()
    setIsOpen(false)
    navigate('/')
  }

  const itemClass = 'flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900'

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Menú de perfil"
          aria-expanded={isOpen}
          className="flex items-center focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-gray-300 bg-gray-100 text-gray-500">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" />
            </svg>
          </div>
          <svg
            className={`ml-2 h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <Link to="/" className={itemClass} role="menuitem">Ir al sitio</Link>
            <button type="button" onClick={logout} className={itemClass} role="menuitem">Cerrar sesión</button>
          </div>
        </div>
      )}
    </div>
  )
}
