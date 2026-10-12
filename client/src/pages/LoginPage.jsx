import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/UI/Toast';
import { Eye, EyeOff, LogIn, AlertCircle, User, Lock, ShieldCheck, ChevronLeft } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import dentalDoctorHero from '../assets/dental-doctor-hero.jpg';

// SVG Icon para Google
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
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
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) return;
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'TU_GOOGLE_CLIENT_ID_AQUI') return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, [GOOGLE_CLIENT_ID, isNative]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Por favor ingrese usuario y contraseña'); return; }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('¡Bienvenido al sistema!');
      navigate('/panel');
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginNative = useCallback(async () => {
    setError(''); setSocialLoading('google');
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      await GoogleAuth.initialize({ clientId: GOOGLE_CLIENT_ID, scopes: ['profile', 'email'], grantOfflineAccess: true });
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser?.authentication?.idToken;
      if (!idToken) throw new Error('No se pudo obtener el token de Google');
      await loginWithGoogle(idToken);
      toast.success('¡Bienvenido! Sesión iniciada con Google');
      navigate('/panel');
    } catch (err) {
      if (!err?.message?.includes('cancel')) setError(err.message || 'Error al iniciar sesión con Google');
    } finally { setSocialLoading(''); }
  }, [GOOGLE_CLIENT_ID, loginWithGoogle, navigate, toast]);

  const handleGoogleLoginWeb = useCallback(async () => {
    setError(''); setSocialLoading('google');
    try {
      if (!window.google?.accounts?.id) { setError('El SDK de Google no se ha cargado.'); setSocialLoading(''); return; }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            await loginWithGoogle(response.credential);
            toast.success('¡Bienvenido! Sesión iniciada con Google');
            navigate('/panel');
          } catch (err) {
            setError(err.message || 'Error al iniciar sesión con Google');
          } finally { setSocialLoading(''); }
        },
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const btn = document.createElement('div');
          btn.id = 'google-signin-fallback'; btn.style.display = 'none';
          document.body.appendChild(btn);
          window.google.accounts.id.renderButton(btn, { type: 'standard', size: 'large' });
          const el = btn.querySelector('[role="button"]');
          if (el) el.click();
          setTimeout(() => { document.getElementById('google-signin-fallback')?.remove(); setSocialLoading(''); }, 1000);
        }
      });
    } catch (err) { setError(err.message || 'Error al iniciar sesión'); setSocialLoading(''); }
  }, [GOOGLE_CLIENT_ID, loginWithGoogle, navigate, toast]);

  const handleGoogleLogin = isNative ? handleGoogleLoginNative : handleGoogleLoginWeb;

  return (
    <div className="login-page">
      {/* Fondo decorativo */}
      <div className="login-bg-glow-1" />
      <div className="login-bg-glow-2" />

      {/* Topbar */}
      <div className="login-topbar">
        <button className="login-back-btn" onClick={() => navigate('/')}>
          <ChevronLeft size={18} />
          <span>Volver al Sitio</span>
        </button>
        <div className="login-topbar-brand">
          <i className="fa-solid fa-tooth" style={{ color: '#2563EB', fontSize: '1rem' }} />
          <span>Servicio de Odontología</span>
        </div>
        <div style={{ width: '140px' }} />
      </div>

      {/* Layout split */}
      <div className="login-split-layout">

        {/* Panel izquierdo — doctor full-height */}
        <div className="login-panel-left">
          <div className="login-panel-left-inner">
            <div className="login-hero-badge">
              <i className="fa-solid fa-shield-halved" /> Portal Médico Seguro
            </div>
            <h2 className="login-panel-title">
              Sistema de Gestión<br />
              <span>Odontológica Digital</span>
            </h2>
            <p className="login-panel-desc">
              Accede al historial completo de pacientes, registra atenciones,
              gestiona odontogramas y genera reportes clínicos.
            </p>

            {/* Features */}
            <div className="login-features-list">
              {[
                { icon: 'fa-solid fa-file-medical', text: 'Historial clínico digital' },
                { icon: 'fa-solid fa-tooth', text: 'Odontograma interactivo' },
                { icon: 'fa-solid fa-robot', text: 'Asistente IA integrado' },
              ].map((f, i) => (
                <div key={i} className="login-feature-item">
                  <i className={f.icon} />
                  <span>{f.text}</span>
                </div>
              ))}
            </div>

            {/* Doctor — al fondo del panel */}
            <img
              src={dentalDoctorHero}
              alt="Doctor Odontólogo"
              className="login-hero-img"
            />
          </div>
        </div>

        {/* Panel derecho — formulario */}
        <div className="login-panel-right">
          <div className="login-card">
            <div className="login-card-glow" />

            <div className="login-header">
              <div className="login-hospital-badge">
                <i className="fa-solid fa-hospital" /> Hospital San Ramón · Chanchamayo
              </div>
              <h1 className="login-title">Iniciar Sesión</h1>
              <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {error && (
                <div className="login-error">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Usuario o Correo</label>
                <div className="input-icon-wrapper">
                  <User size={17} className="input-icon-left" />
                  <input
                    id="login-username"
                    type="text"
                    className="form-input input-with-icon"
                    placeholder="tu.usuario o correo@hospital.pe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <div className="input-icon-wrapper">
                  <Lock size={17} className="input-icon-left" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input input-with-icon input-with-right-icon"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="input-icon-btn-right"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                className="btn btn-primary btn-lg w-full login-btn-main"
                disabled={loading || socialLoading}
              >
                {loading ? (
                  <div className="spinner" style={{ width: 19, height: 19, borderWidth: 2 }} />
                ) : (
                  <><LogIn size={17} /><span>Iniciar Sesión</span></>
                )}
              </button>
            </form>

            {/* Google */}
            <div className="login-social-section">
              <div className="login-divider">
                <span className="login-divider-line" />
                <span className="login-divider-text">o continuar con</span>
                <span className="login-divider-line" />
              </div>
              <button
                id="login-google"
                type="button"
                className="btn-social btn-google"
                onClick={handleGoogleLogin}
                disabled={loading || socialLoading}
              >
                {socialLoading === 'google'
                  ? <div className="spinner" style={{ width: 17, height: 17, borderWidth: 2 }} />
                  : <GoogleIcon />
                }
                <span>Continuar con Google</span>
              </button>
            </div>

            <div className="login-security-footer">
              <ShieldCheck size={13} /> Conexión cifrada SSL 256-bit · Solo personal autorizado
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
