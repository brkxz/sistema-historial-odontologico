import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/UI/Toast';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

// SVG Icon para Google
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const toast = useToast();

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Cargar SDK de Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'TU_GOOGLE_CLIENT_ID_AQUI') return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [GOOGLE_CLIENT_ID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor ingrese usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      toast.success('¡Bienvenido al sistema!');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useCallback(async () => {
    setError('');
    setSocialLoading('google');

    try {
      // Verificar si el SDK de Google está cargado
      if (!window.google?.accounts?.id) {
        setError('El SDK de Google no se ha cargado. Verifica tu GOOGLE_CLIENT_ID.');
        setSocialLoading('');
        return;
      }

      // Usar el flujo de One Tap / popup de Google
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            await loginWithGoogle(response.credential);
            toast.success('¡Bienvenido! Sesión iniciada con Google');
            navigate('/');
          } catch (err) {
            setError(err.message || 'Error al iniciar sesión con Google');
          } finally {
            setSocialLoading('');
          }
        },
      });

      // Mostrar el popup de selección de cuenta
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Si One Tap no se muestra, usar el botón renderizado como fallback
          const googleBtn = document.createElement('div');
          googleBtn.id = 'google-signin-fallback';
          googleBtn.style.display = 'none';
          document.body.appendChild(googleBtn);

          window.google.accounts.id.renderButton(googleBtn, {
            type: 'standard',
            size: 'large',
          });

          // Simular click
          const btn = googleBtn.querySelector('[role="button"]');
          if (btn) btn.click();
          
          setTimeout(() => {
            if (document.getElementById('google-signin-fallback')) {
              document.body.removeChild(googleBtn);
            }
            setSocialLoading('');
          }, 1000);
        }
      });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google');
      setSocialLoading('');
    }
  }, [GOOGLE_CLIENT_ID, loginWithGoogle, navigate, toast]);

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">🦷</div>
            <h1>Historial Odontológico</h1>
            <p>Sistema de Gestión Digital</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Usuario</label>
              <input
                id="login-username"
                type="text"
                className="form-input"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ width: '100%', paddingRight: '44px' }}
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading || socialLoading}
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                <>
                  <LogIn size={18} />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Separador y botón de Google */}
          <div className="login-social-section">
            <div className="login-divider">
              <span className="login-divider-line"></span>
              <span className="login-divider-text">o continuar con</span>
              <span className="login-divider-line"></span>
            </div>

            <div className="login-social-buttons">
              <button
                id="login-google"
                type="button"
                className="btn-social btn-google"
                onClick={handleGoogleLogin}
                disabled={loading || socialLoading}
              >
                {socialLoading === 'google' ? (
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                ) : (
                  <GoogleIcon />
                )}
                <span>Iniciar con Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
