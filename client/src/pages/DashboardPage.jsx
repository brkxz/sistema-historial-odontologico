import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAI } from '../context/AIContext';
import {
  Users, ClipboardList, CalendarCheck, CalendarClock,
  TrendingUp, Search, FilePlus, ArrowRight, Sparkles,
  Activity, Stethoscope, Clock, ShieldCheck
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentTreatments, setRecentTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { togglePanel } = useAI();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryData, recentData] = await Promise.all([
        reportService.getSummary(),
        reportService.getRecentTreatments(),
      ]);
      setStats(summaryData);
      setRecentTreatments(recentData.treatments || []);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const getTimeEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    return '🌙';
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        <p>Cargando panel...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Pacientes', value: stats?.totalPatients || 0, icon: Users, color: 'teal', desc: 'Registrados en el sistema' },
    { label: 'Atenciones Hoy', value: stats?.todayTreatments || 0, icon: Activity, color: 'blue', desc: 'Consultas del día' },
    { label: 'Este Mes', value: stats?.monthTreatments || 0, icon: TrendingUp, color: 'green', desc: 'Atenciones realizadas' },
    { label: 'Total Atenciones', value: stats?.totalTreatments || 0, icon: ClipboardList, color: 'purple', desc: 'Historial completo' },
    { label: 'Próximas Citas', value: stats?.upcomingAppointments || 0, icon: CalendarClock, color: 'amber', desc: 'Próximos 7 días' },
  ];

  const quickActions = [
    { label: 'Buscar Paciente', desc: 'Buscar por DNI', icon: Search, route: '/buscar', variant: 'primary' },
    { label: 'Nueva Atención', desc: 'Registrar consulta', icon: FilePlus, route: '/nueva-atencion', variant: 'secondary' },
    { label: 'Ver Pacientes', desc: 'Lista completa', icon: Users, route: '/pacientes', variant: 'secondary' },
    { label: 'Reportes', desc: 'Estadísticas', icon: TrendingUp, route: '/reportes', variant: 'secondary' },
  ];

  return (
    <div className="dashboard-page">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-bg" />
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-text">
            <h1 className="dashboard-greeting">
              {getGreeting()}, Dr. {user?.full_name?.split(' ')[0]}! {getTimeEmoji()}
            </h1>
            <p className="dashboard-greeting-sub">
              Sistema de Historial Odontológico Digital — Hospital San Ramón
            </p>
            <div className="dashboard-hero-badges">
              <span className="dashboard-hero-badge">
                <ShieldCheck size={12} /> Sistema Activo
              </span>
              <span className="dashboard-hero-badge">
                <Clock size={12} /> {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="dashboard-hero-visual">
            <div className="dashboard-hero-tooth">🦷</div>
            <div className="dashboard-hero-ring ring-1" />
            <div className="dashboard-hero-ring ring-2" />
            <div className="dashboard-hero-ring ring-3" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card animate-in">
            <div className="stat-card-info">
              <h3>{card.label}</h3>
              <div className="stat-value">{card.value}</div>
              <span className="stat-card-desc">{card.desc}</span>
            </div>
            <div className={`stat-card-icon ${card.color}`}>
              <card.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-quick-actions">
        <h3 className="dashboard-section-title">
          <Sparkles size={18} /> Acciones Rápidas
        </h3>
        <div className="dashboard-actions-grid">
          {quickActions.map((action, i) => (
            <button
              key={i}
              className={`dashboard-action-card animate-in`}
              onClick={() => navigate(action.route)}
            >
              <div className={`dashboard-action-icon ${action.variant}`}>
                <action.icon size={22} />
              </div>
              <div className="dashboard-action-text">
                <strong>{action.label}</strong>
                <span>{action.desc}</span>
              </div>
              <ArrowRight size={16} className="dashboard-action-arrow" />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Recent + AI */}
      <div className="dashboard-grid">
        {/* Atenciones recientes */}
        <div className="card animate-in">
          <div className="dashboard-card-header">
            <h3>
              <Stethoscope size={18} /> Atenciones Recientes
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/historial')}>
              Ver todo <ArrowRight size={14} />
            </button>
          </div>

          {recentTreatments.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <ClipboardList size={32} />
              <p>No hay atenciones registradas aún</p>
            </div>
          ) : (
            <div className="dashboard-recent-list">
              {recentTreatments.slice(0, 5).map((t) => (
                <div key={t.id} className="dashboard-recent-item">
                  <div className="dashboard-recent-avatar">
                    {(t.patient?.first_name || '?')[0]}
                  </div>
                  <div className="dashboard-recent-info">
                    <strong>
                      {t.patient?.first_name} {t.patient?.last_name}
                    </strong>
                    <span>{t.reason || 'Sin motivo especificado'}</span>
                  </div>
                  <span className="badge badge-primary">
                    {new Date(t.treatment_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Assistant Card */}
        <div className="ai-dashboard-card" onClick={togglePanel}>
          <div className="ai-dashboard-header">
            <div className="ai-dashboard-icon">🤖</div>
            <div>
              <div className="ai-dashboard-title">OdontoIA — Asistente Inteligente</div>
              <div className="ai-dashboard-subtitle">IA conversacional con voz para asistencia clínica</div>
            </div>
          </div>
          <div className="ai-dashboard-features">
            <div className="ai-dashboard-feature">
              <span className="ai-feature-emoji">💬</span>
              <span>Chat clínico inteligente</span>
            </div>
            <div className="ai-dashboard-feature">
              <span className="ai-feature-emoji">🎙️</span>
              <span>Comandos y dictado por voz</span>
            </div>
            <div className="ai-dashboard-feature">
              <span className="ai-feature-emoji">💊</span>
              <span>Recetas y diagnósticos</span>
            </div>
            <div className="ai-dashboard-feature">
              <span className="ai-feature-emoji">📋</span>
              <span>Formateo de notas con IA</span>
            </div>
          </div>
          <div className="ai-dashboard-cta">
            Abrir Asistente <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
