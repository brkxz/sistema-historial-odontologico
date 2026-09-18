import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Inicializar con datos del localStorage inmediatamente (sin esperar API)
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (token && savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {
      // Datos corruptos
    }
    return null;
  });

  // Loading solo es true si NO hay datos locales (primera visita o sesión expirada)
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    // Si hay datos locales, no bloqueamos → loading = false inmediato
    return !!(token && savedUser) ? false : false;
    // En realidad nunca bloqueamos: si no hay token, no hay loading; si hay token, usamos localStorage
  });

  const hasValidated = useRef(false);

  useEffect(() => {
    // Validar token con el servidor en background (sin bloquear la UI)
    if (!hasValidated.current) {
      hasValidated.current = true;
      validateTokenInBackground();
    }
  }, []);

  const validateTokenInBackground = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // No hay sesión, nada que validar

    try {
      const data = await authService.getMe();
      // Actualizar con datos frescos del servidor
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
      // Token inválido o expirado → cerrar sesión silenciosamente
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const loginWithGoogle = async (token) => {
    const data = await authService.loginWithGoogle(token);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };


  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isDentist = user?.role === 'odontologo';

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, isAdmin, isDentist }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
