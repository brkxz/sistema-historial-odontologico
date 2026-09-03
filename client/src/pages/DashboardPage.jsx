import { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, Activity, TrendingUp, CalendarCheck, CalendarClock
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const summaryData = await reportService.getSummary();
      setStats(summaryData);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <p>Cargando...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Pacientes', value: stats?.totalPatients || 0, icon: Users, color: 'teal' },
    { label: 'Hoy', value: stats?.todayTreatments || 0, icon: Activity, color: 'blue' },
    { label: 'Este Mes', value: stats?.monthTreatments || 0, icon: TrendingUp, color: 'green' },
    { label: 'Total', value: stats?.totalTreatments || 0, icon: CalendarCheck, color: 'purple' },
    { label: 'Citas Próx.', value: stats?.upcomingAppointments || 0, icon: CalendarClock, color: 'amber' },
  ];

  const today = new Date();
  const dateStr = today.toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-glow" />
        <div className="home-hero-content">
          <div className="home-hero-icon">🦷</div>
          <h1 className="home-greeting">
            {getGreeting()}, Dr. {user?.full_name?.split(' ')[0]}
          </h1>
          <p className="home-date">{dateStr}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="home-stats">
        {statCards.map((card, i) => (
          <div key={i} className={`home-stat-card home-stat-${card.color}`}>
            <div className="home-stat-icon">
              <card.icon size={20} />
            </div>
            <div className="home-stat-value">{card.value}</div>
            <div className="home-stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Resumen del Día */}
      <div className="home-summary-card">
        <h2 className="home-summary-title">📊 Resumen del Día</h2>
        <div className="home-summary-grid">
          <div className="home-summary-item">
            <span className="home-summary-num">{stats?.todayTreatments || 0}</span>
            <span className="home-summary-text">Atenciones realizadas hoy</span>
          </div>
          <div className="home-summary-divider" />
          <div className="home-summary-item">
            <span className="home-summary-num">{stats?.upcomingAppointments || 0}</span>
            <span className="home-summary-text">Citas programadas esta semana</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="home-footer">
        <p>Sistema de Historial Odontológico Digital</p>
        <p className="home-footer-sub">Hospital San Ramón • v2.0</p>
      </div>
    </div>
  );
}
