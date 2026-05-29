import React from 'react';
import { Navigate } from 'react-router-dom';

// useAuth gibt uns Zugriff auf isAuthenticated
// damit überprüft werden kann
// ob gerade jemand eingeloggt ist
import { useAuth } from '../context/AuthContext';

// children: Die Adminseite
// useAuth gibt uns true, wenn eingeloggt, ansonsten false
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  // Wenn nicht eingeloggt, zur Login-Seite weiterleiten
  // replace löscht die admin-URL aus der Browser-History
  // Nutzer kann mit dem "Zurück-Button" nicht zurück zur Admin-Seite
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Eingeloggt -> die Seite zeigen
  return children;
}