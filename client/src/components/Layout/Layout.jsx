import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAI } from '../../context/AIContext';
import AIAssistant from '../AI/AIAssistant';
import {
  LayoutDashboard, Search, UserPlus, ClipboardList,
  History, Users, BarChart3, Settings, LogOut, Menu, X,
  Stethoscope, Home, FilePlus
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Panel Principal', section: 'general' },
  { path: '/buscar', icon: Search, label: 'Buscar Paciente', section: 'general' },
  { path: '/pacientes', icon: Users, label: 'Pacientes', section: 'general' },
  { path: '/nueva-atencion', icon: FilePlus, label: 'Nueva Atención', section: 'atenciones' },
  { path: '/historial', icon: History, label: 'Historial', section: 'atenciones' },
  { path: '/odontograma', icon: Stethoscope, label: 'Odontograma', section: 'atenciones' },
  { path: '/reportes', icon: BarChart3, label: 'Reportes', section: 'admin' },
  { path: '/usuarios', icon: UserPlus, label: 'Usuarios', section: 'admin', adminOnly: true },
];

const mobileNavItems = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/buscar', icon: Search, label: 'Buscar' },
  { path: '/nueva-atencion', icon: FilePlus, label: 'Atención' },
  { path: '/historial', icon: History, label: 'Historial' },
  { path: '/reportes', icon: BarChart3, label: 'Reportes' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentPage } = useAI();

  // Actualizar contexto de la IA con la página actual
  useEffect(() => {
    const item = navItems.find((n) => n.path === location.pathname);
    setCurrentPage(item?.label || location.pathname);
  }, [location.pathname, setCurrentPage]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  const getPageTitle = () => {
    const item = navItems.find((n) => n.path === location.pathname);
    return item?.label || 'Sistema Odontológico';
  };

  const filteredItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  // Group items by section
  const sections = {
    general: filteredItems.filter((i) => i.section === 'general'),
    atenciones: filteredItems.filter((i) => i.section === 'atenciones'),
    admin: filteredItems.filter((i) => i.section === 'admin'),
  };

  return (
    <div className="app-layout">
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🦷</div>
          <div className="sidebar-logo-text">
            Odontología Digital
            <span>Sistema de Historial</span>
          </div>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setSidebarOpen(false)}
            style={{ marginLeft: 'auto', display: sidebarOpen ? 'flex' : 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">General</div>
          {sections.general.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}

          <div className="sidebar-section-title">Atenciones</div>
          {sections.atenciones.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}

          {sections.admin.length > 0 && (
            <>
              <div className="sidebar-section-title">Administración</div>
              {sections.admin.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User info */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{getInitials(user?.full_name)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.full_name}</div>
            <div className="sidebar-user-role">
              {user?.role === 'admin' ? 'Administrador' : 'Odontólogo'}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="header-title">{getPageTitle()}</h2>
          </div>
          <div className="header-right">
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              {user?.full_name}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={22} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Asistente IA */}
      <AIAssistant />
    </div>
  );
}
