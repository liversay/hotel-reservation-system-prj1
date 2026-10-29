import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import ButtonSecondary from './ButtonSecondary';
import { isAdmin, isAuthenticated, logout } from '../auth/session';

export default function Header() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const admin = loggedIn && isAdmin();

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    setMenuOpen(false);
    navigate('/');
  };

  const mobileLink = 'block rounded px-3 py-2 text-gray-700 hover:bg-orange-50';

  return (
    <header className="absolute top-0 left-0 right-0 z-10 bg-[rgba(255,255,255,0)]">
    <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8">
      <Link className="block text-orange-600 flex justify-center text-orange-600 lg:justify-start" to="/">
        <span className="sr-only">Inicio</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-buildings-fill" viewBox="0 0 16 16">
          <path d="M15 .5a.5.5 0 0 0-.724-.447l-8 4A.5.5 0 0 0 6 4.5v3.14L.342 9.526A.5.5 0 0 0 0 10v5.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V14h1v1.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5zM2 11h1v1H2zm2 0h1v1H4zm-1 2v1H2v-1zm1 0h1v1H4zm9-10v1h-1V3zM8 5h1v1H8zm1 2v1H8V7zM8 9h1v1H8zm2 0h1v1h-1zm-1 2v1H8v-1zm1 0h1v1h-1zm3-2v1h-1V9zm-1 2h1v1h-1zm-2-4h1v1h-1zm3 0v1h-1V7zm-2-2v1h-1V5zm1 0h1v1h-1z"/>
        </svg>
        <p className="font-bold  text-1xl">HOTEL MN</p>
      </Link>

    <div className="flex flex-1 items-center justify-end md:justify-between">
      <nav aria-label="Global" className="hidden md:block">
        <ul className="flex items-center gap-6 text-sm">
          <li>
            <Link to="/" className="text-gray-200 transition hover:text-gray-300/75">
              Inicio
            </Link>
          </li>

          <li>
            <Link to="/products" className="text-gray-200 transition hover:text-gray-300/75">
             Habitaciones
            </Link>
          </li>
          <li>
            <Link to="/about" className="text-gray-200 transition hover:text-gray-300/75">
             Nosotros
            </Link>
          </li>
          {loggedIn && (
            <li>
              <Link to="/my-reservations" className="text-gray-200 transition hover:text-gray-300/75">
                Mis reservas
              </Link>
            </li>
          )}
          {admin && (
            <li>
              <Link to="/admin" className="text-gray-200 transition hover:text-gray-300/75">
                Administración
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className="flex items-center gap-4">
        <div className="sm:flex sm:gap-4">
          {loggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-block rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700 focus:outline-none focus:ring focus:ring-orange-400"
            >
              Salir
            </button>
          ) : (
            <>
              <Button to="/login" content="Iniciar sesión" className={''} />
              <ButtonSecondary to="/register" content="Registrarse" className={'hidden sm:block'}/>
            </>
          )}
        </div>
        
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
          className="block rounded bg-gray-100 p-2.5 text-gray-600 transition hover:text-gray-600/75 md:hidden"
        >
          <span className="sr-only">{menuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
  {menuOpen && (
    <nav id="mobile-menu" aria-label="Menú móvil" className="mx-4 rounded-lg bg-white p-2 shadow md:hidden">
      <Link to="/" className={mobileLink} onClick={() => setMenuOpen(false)}>Inicio</Link>
      <Link to="/products" className={mobileLink} onClick={() => setMenuOpen(false)}>Habitaciones</Link>
      <Link to="/about" className={mobileLink} onClick={() => setMenuOpen(false)}>Nosotros</Link>
      {loggedIn && <Link to="/my-reservations" className={mobileLink} onClick={() => setMenuOpen(false)}>Mis reservas</Link>}
      {admin && <Link to="/admin" className={mobileLink} onClick={() => setMenuOpen(false)}>Administración</Link>}
      {!loggedIn && <Link to="/register" className={mobileLink} onClick={() => setMenuOpen(false)}>Registrarse</Link>}
    </nav>
  )}
</header>
  )
}
