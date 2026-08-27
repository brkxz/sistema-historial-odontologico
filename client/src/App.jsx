import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/UI/Toast';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import PatientsPage from './pages/PatientsPage';
import TreatmentPage from './pages/TreatmentPage';
import HistoryPage from './pages/HistoryPage';
import OdontogramPage from './pages/OdontogramPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente para redirigir si ya está autenticado
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Ruta pública: Login */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Rutas protegidas con Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="buscar" element={<SearchPage />} />
              <Route path="pacientes" element={<PatientsPage />} />
              <Route path="pacientes/nuevo" element={<PatientsPage />} />
              <Route path="nueva-atencion" element={<TreatmentPage />} />
              <Route path="historial" element={<HistoryPage />} />
              <Route path="historial/:patientId" element={<HistoryPage />} />
              <Route path="odontograma" element={<OdontogramPage />} />
              <Route path="reportes" element={<ReportsPage />} />
              <Route path="usuarios" element={<UsersPage />} />
            </Route>

            {/* Ruta 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
