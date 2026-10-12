import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/UI/Toast';
import { Eye, EyeOff, LogIn, AlertCircle, ShieldCheck, ChevronLeft } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import dentalLogo from '../assets/dental-logo.png';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const [username, setUsername]           = useState('');
  const [password, setPassword]           = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [error, setError]                 = useState('');
  const navigate                          = useNavigate();
  const { login, loginWithGoogle }        = useAuth();
  const toast                             = useToast();

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) return;
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'TU_GOOGLE_CLIENT_ID_AQUI') return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true; script.defer = true;
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
    } finally { setLoading(false); }
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
    <div className="lp-page">

      {/* Botón volver */}
      <button className="lp-back" onClick={() => navigate('/')}>
        <ChevronLeft size={16} /> Volver al sitio
      </button>

      {/* Tarjeta central */}
      <div className="lp-card">

        {/* Panel izquierdo — azul */}
        <div className="lp-left">
          {/* Logo diente */}
          <img src={dentalLogo} alt="Logo Dental" className="lp-logo" />

          {/* Texto grande */}
          <div className="lp-left-text">
            <h2 className="lp-big-title">PORTAL<br/>ODONTOLÓGICO</h2>
            <p className="lp-left-desc">
              Accede al historial completo de pacientes, registra atenciones,
              gestiona odontogramas y genera reportes clínicos desde una sola plataforma.
            </p>
          </div>
        </div>

        {/* Panel derecho — blanco */}
        <div className="lp-right">

          {/* Ícono de hospital */}
          <div className="lp-form-icon">
            <i className="fa-solid fa-hospital" />
          </div>

          <h1 className="lp-form-title">INICIA SESIÓN</h1>
          <p className="lp-form-sub">Hospital San Ramón · Chanchamayo</p>

          <form className="lp-form" onSubmit={handleSubmit}>
            {error && (
              <div className="lp-error">
                <AlertCircle size={14} /> <span>{error}</span>
              </div>
            )}

            <input
              id="login-username"
              type="text"
              className="lp-input"
              placeholder="Usuario o Correo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />

            <div className="lp-pw-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="lp-input"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className="lp-pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button id="login-submit" type="submit" className="lp-btn-primary" disabled={loading || socialLoading}>
              {loading
                ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: '#fff transparent #fff #fff' }} />
                : <><LogIn size={16} /> Entrar</>
              }
            </button>
          </form>

          {/* Google */}
          <div className="lp-divider"><span>o continuar con</span></div>
          <button id="login-google" type="button" className="lp-btn-google"
            onClick={handleGoogleLogin} disabled={loading || socialLoading}>
            {socialLoading === 'google'
              ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              : <GoogleIcon />
            }
            Continuar con Google
          </button>

          <div className="lp-footer">
            <ShieldCheck size={12} /> Conexión cifrada SSL 256-bit · Solo personal autorizado
          </div>
        </div>

      </div>
    </div>
  );
}
