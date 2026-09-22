import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AIProvider } from './context/AIContext';
import { ToastProvider } from './components/UI/Toast';
import ErrorBoundary from './components/UI/ErrorBoundary';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';

// =============================================
// Code Splitting: Lazy load todas las páginas
// Solo LoginPage y Layout se cargan inmediatamente
// =============================================
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const PatientsPage = lazy(() => import('./pages/PatientsPage'));
const TreatmentPage = lazy(() => import('./pages/TreatmentPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const OdontogramPage = lazy(() => import('./pages/OdontogramPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));

// Fallback mínimo para Suspense (dentro de Layout ya hay estructura)
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '40vh',
    }}>
      <div className="spinner" />
    </div>
  );
}

// Ocultar el loader del HTML al montar React
function HideAppLoader() {
  useEffect(() => {
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 500);
    }
  }, []);
  return null;
}

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // No mostramos nada — el loader del HTML ya está visible
    return null;
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
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AIProvider>
            <HideAppLoader />
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
              <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
              <Route path="buscar" element={<Suspense fallback={<PageLoader />}><SearchPage /></Suspense>} />
              <Route path="pacientes" element={<Suspense fallback={<PageLoader />}><PatientsPage /></Suspense>} />
              <Route path="pacientes/nuevo" element={<Suspense fallback={<PageLoader />}><PatientsPage /></Suspense>} />
              <Route path="nueva-atencion" element={<Suspense fallback={<PageLoader />}><TreatmentPage /></Suspense>} />
              <Route path="historial" element={<Suspense fallback={<PageLoader />}><HistoryPage /></Suspense>} />
              <Route path="historial/:patientId" element={<Suspense fallback={<PageLoader />}><HistoryPage /></Suspense>} />
              <Route path="odontograma" element={<Suspense fallback={<PageLoader />}><OdontogramPage /></Suspense>} />
              <Route path="reportes" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
              <Route path="usuarios" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
              <Route path="perfil" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
              <Route path="auditoria" element={<Suspense fallback={<PageLoader />}><AuditPage /></Suspense>} />
            </Route>

            {/* Ruta 404 */}
            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
            </Routes>
            </AIProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
