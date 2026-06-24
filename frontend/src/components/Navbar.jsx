import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, username, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
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

      <button
        className={`navbar-hamburger${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menü öffnen"
        aria-expanded={menuOpen}
      >
        <span /><span /><span />
      </button>

      <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
        <NavLink to="/" end
          className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          onClick={() => setMenuOpen(false)}>
          Dashboard
        </NavLink>
        <NavLink to="/meldung"
          className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          onClick={() => setMenuOpen(false)}>
          Fallmeldung
        </NavLink>
        <NavLink to="/info"
          className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          onClick={() => setMenuOpen(false)}>
          Informationen
        </NavLink>
        <NavLink to="/about"
          className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          onClick={() => setMenuOpen(false)}>
          Über uns
        </NavLink>

        {isAuthenticated && (
          <NavLink to="/admin"
            className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
            onClick={() => setMenuOpen(false)}>
            Admin
          </NavLink>
        )}

        {isAuthenticated && (
          <div className="navbar-right">
            <span className="navbar-user">{username}</span>
            <button className="navbar-logout" onClick={handleLogout}>
              Abmelden
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}