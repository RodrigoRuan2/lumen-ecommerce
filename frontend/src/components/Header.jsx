import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import Icon from './Icon'
import '../styles/Header.css'

function LumenLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="38" r="26" fill="#FFF9AA" stroke="#3B9FD4" strokeWidth="5"/>
      <path d="M38 64 Q38 72 42 74 L58 74 Q62 72 62 64 Z" fill="#FFF9AA" stroke="#3B9FD4" strokeWidth="4"/>
      <rect x="40" y="74" width="20" height="5" rx="2" fill="#3B9FD4"/>
      <rect x="41" y="80" width="18" height="5" rx="2" fill="#3B9FD4"/>
      <rect x="43" y="86" width="14" height="4" rx="2" fill="#3B9FD4"/>
      <line x1="44" y1="55" x2="42" y2="64" stroke="#3B9FD4" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="50" y1="55" x2="50" y2="64" stroke="#3B9FD4" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="56" y1="55" x2="58" y2="64" stroke="#3B9FD4" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M68 24 Q76 20 80 24" stroke="#FCD34D" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M70 30 Q80 26 84 31" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export default function Header() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'))
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)

  const isAdmin = user?.role === 'admin'
  const isSeller = user?.role === 'seller'

  // Reage a login/logout em qualquer parte do app (dispara via 'auth-change')
  useEffect(() => {
    const refresh = () => {
      try {
        setUser(JSON.parse(localStorage.getItem('user') || 'null'))
      } catch {
        setUser(null)
      }
      setIsLoggedIn(!!localStorage.getItem('token'))
    }
    window.addEventListener('auth-change', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('auth-change', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-dark')
    document.body.classList.add(`theme-${theme}`)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    setMenuOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('auth-change'))
    window.location.href = '/'
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`)
      setMenuOpen(false)
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      <header className="header">
        <div className="header-content">

          <Link to="/" className="logo">
            <LumenLogo />
            <span className="logo-text">LUMEN</span>
          </Link>

          <form className="search-bar" onSubmit={handleSearch}>
            <span className="search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <nav className="nav">
            {isAdmin && (
              <Link to="/admin" className={`nav-link nav-role ${isActive('/admin') ? 'nav-active' : ''}`}>
                Painel Admin
              </Link>
            )}
            {isSeller && (
              <Link to="/vendedor" className={`nav-link nav-role ${isActive('/vendedor') ? 'nav-active' : ''}`}>
                Minha Loja
              </Link>
            )}

            <Link to="/carrinho" className={`nav-cart ${isActive('/carrinho') ? 'nav-active' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>

            {isLoggedIn ? (
              <div className="user-dropdown" ref={dropdownRef}>
                <button className="user-trigger" onClick={() => setDropdownOpen(o => !o)}>
                  <span className="user-avatar">{(user?.name || 'U')[0].toUpperCase()}</span>
                  <span className="user-name">{user?.name?.split(' ')[0] || 'Perfil'}</span>
                  <svg className={`chevron ${dropdownOpen ? 'chevron-open' : ''}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <Link to="/perfil" className="dropdown-item">Meu Perfil</Link>
                    <Link to="/perfil?tab=pedidos" className="dropdown-item">Meus Pedidos</Link>
                    <div className="dropdown-divider"/>
                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>Sair</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-auth">
                <Link to="/login" className={`nav-link ${isActive('/login') ? 'nav-active' : ''}`}>Entrar</Link>
                <Link to="/register" className="btn-register">Cadastrar</Link>
              </div>
            )}

            <button className="btn-theme" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} aria-label="Alternar tema">
              {theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>

            <button
              className={`btn-hamburger ${menuOpen ? 'hamburger-open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
            >
              <span/><span/><span/>
            </button>
          </nav>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">Menu</span>
              <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
                <Icon name="x" size={20} />
              </button>
            </div>

            <form className="mobile-search" onSubmit={handleSearch}>
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </form>

            <nav className="mobile-nav">
              <Link to="/" onClick={() => setMenuOpen(false)}>
                <Icon name="home" size={18} /> Início
              </Link>
              <Link to="/carrinho" onClick={() => setMenuOpen(false)}>
                <Icon name="cart" size={18} /> Carrinho
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}>
                  <Icon name="shield" size={18} /> Painel Admin
                </Link>
              )}
              {isSeller && (
                <Link to="/vendedor" onClick={() => setMenuOpen(false)}>
                  <Icon name="storeFront" size={18} /> Minha Loja
                </Link>
              )}
              {isLoggedIn ? (
                <>
                  <Link to="/perfil" onClick={() => setMenuOpen(false)}>
                    <Icon name="user" size={18} /> Meu Perfil
                  </Link>
                  <Link to="/perfil?tab=pedidos" onClick={() => setMenuOpen(false)}>
                    <Icon name="package" size={18} /> Meus Pedidos
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    <Icon name="user" size={18} /> Entrar
                  </Link>
                </>
              )}
            </nav>

            <div className="mobile-menu-footer">
              <button className="mobile-theme-toggle" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
                <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
                {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
              </button>
              {isLoggedIn ? (
                <button className="mobile-logout" onClick={handleLogout}>Sair</button>
              ) : (
                <Link to="/register" className="btn-register" onClick={() => setMenuOpen(false)}>Cadastrar</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
