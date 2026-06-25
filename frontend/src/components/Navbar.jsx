import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, username, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Admin-Bereich = /admin oder /login. Überall sonst = öffentlich.
  const isAdminArea = location.pathname.startsWith('/admin')
    || location.pathname.startsWith('/login');

  // Body-Scroll sperren, solange das mobile Menü offen ist
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar" role="navigation" aria-label="Hauptnavigation">
      <div className="navbar-brand" onClick={() => navigate('/')}>
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
          <circle cx="12" cy="12" r="8"    stroke="#9bb8d4" strokeWidth="1.5"/>
          <circle cx="12" cy="9"  r="2.2"  stroke="#9bb8d4" strokeWidth="1.3"/>
          <circle cx="7.5"  cy="15" r="1.6" stroke="#9bb8d4" strokeWidth="1.1"/>
          <circle cx="16.5" cy="15" r="1.6" stroke="#9bb8d4" strokeWidth="1.1"/>
          <line x1="12" y1="11.2" x2="8.8"  y2="13.8" stroke="#9bb8d4" strokeWidth=".9"/>
          <line x1="12" y1="11.2" x2="15.2" y2="13.8" stroke="#9bb8d4" strokeWidth=".9"/>
        </svg>
        <span className="navbar-title">C. auris Dashboard</span>
      </div>

      {/* Hamburger (nur mobil sichtbar) — öffnet das Panel */}
      <button
        className="navbar-hamburger"
        onClick={() => setMenuOpen(true)}
        aria-label={t('nav_menu_open')}
        aria-expanded={menuOpen}
      >
        <span /><span /><span />
      </button>

      {/* Abgedunkelter Hintergrund (nur mobil, wenn offen) */}
      <div
        className={`navbar-overlay${menuOpen ? ' open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Navigationslinks: Desktop = Reihe, Mobil = Panel von rechts */}
      <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
        {/* Panel-Kopf mit X — nur mobil sichtbar */}
        <div className="navbar-panel-header">
          <button
            className="navbar-close"
            onClick={closeMenu}
            aria-label={t('nav_menu_close')}
          >
            ×
          </button>
        </div>

        <NavLink to="/" end
          className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          onClick={closeMenu}>
          {t('nav_dashboard')}
        </NavLink>
        <NavLink to="/meldung"
          className={({ isActive }) =>
            `navbar-link${isActive ? ' active' : ''}${isAdminArea ? '' : ' navbar-cta'}`}
          onClick={closeMenu}>
          {t('nav_report')}
        </NavLink>
        <NavLink to="/info"
          className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          onClick={closeMenu}>
          {t('nav_info')}
        </NavLink>
        <NavLink to="/about"
          className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          onClick={closeMenu}>
          {t('nav_about')}
        </NavLink>

        {isAuthenticated && (
          <NavLink to="/admin"
            className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
            onClick={closeMenu}>
            {t('nav_admin')}
          </NavLink>
        )}

        {isAuthenticated && (
          <div className="navbar-right">
            <span className="navbar-user">{username}</span>
            <button className="navbar-logout" onClick={handleLogout}>
              {t('nav_logout')}
            </button>
          </div>
        )}

        <button
          className="navbar-lang"
          onClick={() => i18n.changeLanguage(i18n.language === 'de' ? 'en' : 'de')}
          aria-label="Sprache wechseln"
        >
          {i18n.language === 'de' ? 'EN' : 'DE'}
        </button>
      </div>
    </nav>
  );
}
