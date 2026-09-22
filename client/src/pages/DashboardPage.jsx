import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAI } from '../context/AIContext';
import {
  Users, Activity, TrendingUp, CalendarCheck, CalendarClock, Stethoscope,
  Search, PlusCircle, Sparkles, ChevronRight, Mic, ShieldCheck, Clock, FileText,
  UserCheck, ArrowUpRight
} from 'lucide-react';
import emptyDental from '../assets/empty-dental.jpg';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentTreatments, setRecentTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { openAssistant, isListening, startVoiceListening } = useAI();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const [summaryData, recentData] = await Promise.all([
        reportService.getSummary().catch(() => null),
        reportService.getRecentTreatments().catch(() => ({ treatments: [] }))
      ]);
      setStats(summaryData);
      setRecentTreatments(recentData?.treatments || []);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        <p>Cargando panel odontológico...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Pacientes', value: stats?.totalPatients || 0, sub: 'Registrados', icon: Users, color: 'teal' },
    { label: 'Atenciones Hoy', value: stats?.todayTreatments || 0, sub: 'Turno actual', icon: Activity, color: 'blue' },
    { label: 'Este Mes', value: stats?.monthTreatments || 0, sub: 'Mes en curso', icon: TrendingUp, color: 'green' },
    { label: 'Historial Total', value: stats?.totalTreatments || 0, sub: 'Completados', icon: CalendarCheck, color: 'purple' },
    { label: 'Citas Próximas', value: stats?.upcomingAppointments || 0, sub: 'Próx. 7 días', icon: CalendarClock, color: 'amber' },
  ];

  const today = new Date();
  const dateStr = today.toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const doctorName = user?.full_name || 'Doctor';
  const roleName = user?.role === 'admin' ? 'Administrador Clínico' : 'Odontólogo Especialista';

  return (
    <div className="dashboard-container">
      {/* Hero Banner Principal */}
      <div className="dashboard-hero-card">
        <div className="dashboard-hero-glow" />
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-left">
            <div className="dashboard-avatar-wrap">
              <div className="dashboard-avatar-icon">
                <Stethoscope size={30} strokeWidth={2} />
              </div>
              <span className="dashboard-status-dot" title="Sistema en línea" />
            </div>
            <div>
              <div className="dashboard-badge-role">
                <ShieldCheck size={13} /> {roleName} • Hospital San Ramón
              </div>
              <h1 className="dashboard-greeting-text">
                {getGreeting()}, Dr. {doctorName}
              </h1>
              <p className="dashboard-date-text">
                <Clock size={13} /> {dateStr}
              </p>
            </div>
          </div>

          {/* Botonera de Acciones Rápidas */}
          <div className="dashboard-quick-actions">
            <button
              className="btn btn-primary btn-sm dashboard-action-btn"
              onClick={() => navigate('/tratamientos/nuevo')}
            >
              <PlusCircle size={16} /> Nueva Atención
            </button>
            <button
              className="btn btn-secondary btn-sm dashboard-action-btn"
              onClick={() => navigate('/buscar')}
            >
              <Search size={16} /> Buscar DNI
            </button>
            <button
              className="btn btn-secondary btn-sm dashboard-action-btn"
              onClick={() => navigate('/odontograma')}
              style={{ borderColor: 'rgba(13, 148, 136, 0.4)', color: 'var(--primary-light)' }}
            >
              🦷 Odontograma
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="dashboard-stats-grid">
        {statCards.map((card, i) => (
          <div key={i} className={`dash-stat-card dash-stat-${card.color}`}>
            <div className="dash-stat-top">
              <span className="dash-stat-label">{card.label}</span>
              <div className="dash-stat-icon">
                <card.icon size={18} />
              </div>
            </div>
            <div className="dash-stat-value">{card.value}</div>
            <div className="dash-stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Grid de 2 Columnas: Atenciones Recientes vs Widget Clínico & OdontoIA */}
      <div className="dashboard-content-grid">
        {/* Columna Izquierda: Atenciones Recientes */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div className="dashboard-panel-title">
              <FileText size={18} className="text-primary" />
              <h3>Atenciones Clínicas Recientes</h3>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/historial')}
            >
              Ver Todas <ChevronRight size={15} />
            </button>
          </div>

          {recentTreatments.length === 0 ? (
            <div className="dashboard-empty-panel">
              <img src={emptyDental} alt="Sin atenciones" className="dashboard-empty-svg" />
              <h4>No hay atenciones registradas hoy</h4>
              <p>Inicia una nueva consulta odontológica para el primer paciente del turno.</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/tratamientos/nuevo')}
                style={{ marginTop: '12px' }}
              >
                <PlusCircle size={15} /> Iniciar Atención
              </button>
            </div>
          ) : (
            <div className="dashboard-recent-list">
              {recentTreatments.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="dashboard-recent-item"
                  onClick={() => navigate(`/historial/${t.patient_id}`)}
                >
                  <div className="dashboard-recent-avatar">
                    {t.patient?.first_name?.[0] || 'P'}{t.patient?.last_name?.[0] || ''}
                  </div>
                  <div className="dashboard-recent-info">
                    <div className="dashboard-recent-name">
                      {t.patient ? `${t.patient.first_name} ${t.patient.last_name}` : 'Paciente'}
                    </div>
                    <div className="dashboard-recent-meta">
                      <span className="badge-dni">DNI: {t.patient?.dni || '-'}</span>
                      <span className="recent-diagnostic">
                        {t.diagnosis || t.treatment_type || 'Consulta Odontológica'}
                      </span>
                    </div>
                  </div>
                  <div className="dashboard-recent-right">
                    <span className="dashboard-recent-date">
                      {t.treatment_date ? new Date(t.treatment_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : 'Hoy'}
                    </span>
                    <button
                      className="btn-icon-link"
                      title="Ver Ficha y Odontograma"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/odontograma?patientId=${t.patient_id}`);
                      }}
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Widget de Asistente IA Denty & Resumen Diario */}
        <div className="dashboard-side-column">
          {/* Card Asistente de Voz Denty */}
          <div className="dashboard-ai-card">
            <div className="dashboard-ai-glow" />
            <div className="dashboard-ai-content">
              <div className="dashboard-ai-header">
                <div className="dashboard-ai-badge">
                  <Sparkles size={14} /> OdontoIA Asistente de Voz
                </div>
                <button
                  className={`dashboard-ai-mic-btn ${isListening ? 'listening' : ''}`}
                  onClick={startVoiceListening}
                  title="Activar dictado por voz"
                >
                  <Mic size={18} />
                </button>
              </div>
              <h4 className="dashboard-ai-title">¿Cómo puedo ayudarte hoy?</h4>
              <p className="dashboard-ai-desc">
                Dicta números de DNI, registra diagnósticos por voz o navega por el sistema manos libres.
              </p>
              <div className="dashboard-ai-chips">
                <button
                  className="dashboard-ai-chip"
                  onClick={() => openAssistant('Buscar paciente por DNI')}
                >
                  🔍 Buscar Paciente
                </button>
                <button
                  className="dashboard-ai-chip"
                  onClick={() => openAssistant('Marcar caries en pieza 16')}
                >
                  🦷 Marcar Odontograma
                </button>
                <button
                  className="dashboard-ai-chip"
                  onClick={() => openAssistant('Ver estadísticas')}
                >
                  📊 Ver Estadísticas
                </button>
              </div>
            </div>
          </div>

          {/* Card Resumen de la Jornada */}
          <div className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div className="dashboard-panel-title">
                <UserCheck size={18} className="text-secondary" />
                <h3>Resumen de la Jornada</h3>
              </div>
            </div>
            <div className="dashboard-summary-split">
              <div className="dashboard-summary-box">
                <span className="dashboard-summary-big-num text-primary">
                  {stats?.todayTreatments || 0}
                </span>
                <span className="dashboard-summary-box-label">Atenciones Hoy</span>
                <span className="dashboard-summary-box-sub">Pacientes atendidos en sillón</span>
              </div>
              <div className="dashboard-summary-divider-v" />
              <div className="dashboard-summary-box">
                <span className="dashboard-summary-big-num text-secondary">
                  {stats?.upcomingAppointments || 0}
                </span>
                <span className="dashboard-summary-box-label">Citas Programadas</span>
                <span className="dashboard-summary-box-sub">En los próximos 7 días</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Hospital */}
      <div className="dashboard-footer">
        <p>Sistema de Historial Odontológico Digital • Hospital San Ramón Chanchamayo</p>
        <span className="dashboard-footer-ver">Versión 2.5 • OdontoDesign System</span>
      </div>
    </div>
  );
}

