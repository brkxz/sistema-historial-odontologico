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

  const [loading] = useState(false);

  const hasValidated = useRef(false);

  useEffect(() => {
    // Validar token con el servidor en background (sin bloquear la UI)
    if (!hasValidated.current) {
      hasValidated.current = true;
      validateTokenInBackground();
    }
  }, []);

  // Mantener el servidor de Render despierto: ping cada 5 minutos mientras hay sesion
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://odontologia-api-9a6v.onrender.com';
    const ping = () => fetch(`${API_BASE}/api/health`, { method: 'GET', mode: 'cors' }).catch(() => {});
    ping(); // Ping inmediato al cargar
    const interval = setInterval(ping, 5 * 60 * 1000); // Cada 5 minutos (Render duerme a los 15min)
    return () => clearInterval(interval);
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


  const logout = async () => {
    try {
      // Revocar token en el servidor (invalidación real del JWT)
      await authService.logout();
    } catch {
      // Si falla, igual limpiamos localmente
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
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
