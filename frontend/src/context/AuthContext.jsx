// Check ob ein User eingeloggt ist oder nicht

import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// Schlüsselnamen definieren
const TOKEN_KEY    = 'cauris_token';
const USERNAME_KEY = 'cauris_username';

export function AuthProvider({ children }) {

  // Beim Starten schauen ob schon ein Token da ist  
  const [token,    setToken]    = useState(() => localStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState(() => localStorage.getItem(USERNAME_KEY) || '');
  
  // Eingeloggt oder nicht?
  const isAuthenticated = !!token;

  // Die login()-Funktion.
  // Wenn der Admin sich einloggt, wird diese Funktion aufgerufen
  // Sie speichert Token und Username an 2 Orten
  // 1. im localStorage (damit es den Browser-Refresh überlebt)
  // 2. im React-State (damit die App sofort reagiert)
  const login = useCallback((jwtToken, user) => {
    localStorage.setItem(TOKEN_KEY,    jwtToken);
    localStorage.setItem(USERNAME_KEY, user);
    setToken(jwtToken);
    setUsername(user);
  }, []);

  // Die logout()-Funktion
  // Räumt beides auf:
  // 1. Löscht aus localStorage
  // 2. setzt den State auf leer
  // Danach ist isAuthenticated sofort false
  // Admin wird zur Login-Seite weitergeleitet
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    setToken(null);
    setUsername('');
  }, []);

  // Die gesamte App wird zurückgegeben
  return (
    <AuthContext.Provider value={{ isAuthenticated, token, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Jede Seite, die wissen will, ob jemand eingeloggt ist
// ruft einfach const { isAuthenticated } = useAuth() auf.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}