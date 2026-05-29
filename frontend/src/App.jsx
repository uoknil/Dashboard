
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import ProtectedRoute    from './components/ProtectedRoute';
import Dashboard         from './pages/Dashboard';
import Meldeformular     from './pages/Meldeformular';
import Hintergrund       from './pages/Hintergrund';
import Login             from './pages/Login';
import Admin             from './pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"       element={<Dashboard />} />
          <Route path="/meldung" element={<Meldeformular />} />
          <Route path="/info"    element={<Hintergrund />} />
          <Route path="/login"   element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}