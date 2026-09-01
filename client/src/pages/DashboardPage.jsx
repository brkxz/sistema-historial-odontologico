import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAI } from '../context/AIContext';
import {
  Users, ClipboardList, CalendarCheck, CalendarClock,
  TrendingUp, Search, FilePlus, ArrowRight
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

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        <p>Cargando panel...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Pacientes', value: stats?.totalPatients || 0, icon: Users, color: 'teal' },
    { label: 'Atenciones Hoy', value: stats?.todayTreatments || 0, icon: ClipboardList, color: 'blue' },
    { label: 'Atenciones del Mes', value: stats?.monthTreatments || 0, icon: TrendingUp, color: 'green' },
    { label: 'Total Atenciones', value: stats?.totalTreatments || 0, icon: CalendarCheck, color: 'purple' },
    { label: 'Próximas Citas', value: stats?.upcomingAppointments || 0, icon: CalendarClock, color: 'amber' },
  ];

  return (
    <div>
      {/* Saludo */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">
          ¡Bienvenido, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="page-subtitle">
          Panel del Sistema de Historial Odontológico Digital
        </p>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card animate-in">
            <div className="stat-card-info">
              <h3>{card.label}</h3>
              <div className="stat-value">{card.value}</div>
            </div>
            <div className={`stat-card-icon ${card.color}`}>
              <card.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions + Recent */}
      <div className="dashboard-grid">
        {/* Accesos rápidos */}
        <div className="card animate-in">
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, marginBottom: '16px' }}>
            Accesos Rápidos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn btn-primary w-full" onClick={() => navigate('/buscar')}>
              <Search size={18} /> Buscar Paciente por DNI
            </button>
            <button className="btn btn-secondary w-full" onClick={() => navigate('/nueva-atencion')}>
              <FilePlus size={18} /> Registrar Nueva Atención
            </button>
            <button className="btn btn-secondary w-full" onClick={() => navigate('/pacientes')}>
              <Users size={18} /> Ver Todos los Pacientes
            </button>
          </div>
        </div>

        {/* Atenciones recientes */}
        <div className="card animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>
              Atenciones Recientes
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/historial')}>
              Ver todo <ArrowRight size={14} />
            </button>
          </div>

          {recentTreatments.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <p>No hay atenciones registradas aún</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentTreatments.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {t.patient?.first_name} {t.patient?.last_name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      {t.reason}
                    </div>
                  </div>
                  <span className="badge badge-primary">
                    {new Date(t.treatment_date).toLocaleDateString('es-PE')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
        <div className="ai-dashboard-chips">
          <span className="ai-dashboard-chip">💬 Chat clínico</span>
          <span className="ai-dashboard-chip">🎙️ Comandos de voz</span>
          <span className="ai-dashboard-chip">💊 Recetas</span>
          <span className="ai-dashboard-chip">🦷 Diagnósticos</span>
          <span className="ai-dashboard-chip">📋 Dictado IA</span>
        </div>
      </div>
    </div>
  );
}
