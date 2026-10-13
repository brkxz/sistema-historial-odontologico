import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, Activity, CalendarCheck, CalendarClock,
  Search, PlusCircle, ChevronRight, Clock, FileText,
  ArrowUpRight, Stethoscope
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats]             = useState(null);
  const [recentTreatments, setRecent] = useState([]);
  const [loading, setLoading]         = useState(true);
  const { user }                      = useAuth();
  const navigate                      = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const [summary, recent] = await Promise.all([
        reportService.getSummary().catch(() => null),
        reportService.getRecentTreatments().catch(() => ({ treatments: [] })),
      ]);
      setStats(summary);
      setRecent(recent?.treatments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos dias';
    if (h < 18) return 'Buenas tardes';
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

  const doctorName = user?.full_name || 'Doctor';
  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const metrics = [
    { label: 'Pacientes',  value: stats?.totalPatients          || 0, icon: Users,        color: '#0D9488' },
    { label: 'Hoy',        value: stats?.todayTreatments        || 0, icon: Activity,      color: '#3B82F6' },
    { label: 'Este mes',   value: stats?.monthTreatments        || 0, icon: CalendarCheck, color: '#8B5CF6' },
    { label: 'Proximas',   value: stats?.upcomingAppointments   || 0, icon: CalendarClock, color: '#F59E0B' },
  ];

  return (
    <div className="db-wrap">

      {/* Saludo */}
      <div className="db-header">
        <div className="db-greet-left">
          <div className="db-avatar">
            <Stethoscope size={30} />
          </div>
          <div>
            <p className="db-role">
              {user?.role === 'admin' ? 'Administrador Clinico' : 'Odontologo'} &bull; Hospital San Ramon
            </p>
            <h1 className="db-title">{getGreeting()}, Dr. {doctorName}</h1>
            <p className="db-date"><Clock size={14} /> {today}</p>
          </div>
        </div>
        <div className="db-quick">
          <button className="btn btn-primary" onClick={() => navigate('/panel/nueva-atencion')}>
            <PlusCircle size={18} /> Nueva Atencion
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/panel/buscar')}>
            <Search size={18} /> Buscar DNI
          </button>
        </div>
      </div>

      {/* Metricas */}
      <div className="db-metrics">
        {metrics.map((m, i) => (
          <div key={i} className="db-metric-card">
            <div className="db-metric-icon" style={{ background: m.color + '18', color: m.color }}>
              <m.icon size={26} />
            </div>
            <div>
              <div className="db-metric-val">{m.value}</div>
              <div className="db-metric-lbl">{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Atenciones recientes */}
      <div className="db-panel">
        <div className="db-panel-hd">
          <span className="db-panel-ttl"><FileText size={18} /> Atenciones Recientes</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/panel/historial')}>
            Ver todas <ChevronRight size={15} />
          </button>
        </div>

        {recentTreatments.length === 0 ? (
          <div className="db-empty">
            <Stethoscope size={48} style={{ opacity: 0.2 }} />
            <p>Sin atenciones registradas</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }}
              onClick={() => navigate('/panel/nueva-atencion')}>
              <PlusCircle size={16} /> Iniciar primera atencion
            </button>
          </div>
        ) : (
          <div className="db-list">
            {recentTreatments.slice(0, 6).map((t) => (
              <div key={t.id} className="db-item"
                onClick={() => navigate(`/panel/historial/${t.patient_id}`)}>
                <div className="db-item-av">
                  {t.patient?.first_name?.[0]}{t.patient?.last_name?.[0]}
                </div>
                <div className="db-item-info">
                  <span className="db-item-name">
                    {t.patient ? `${t.patient.first_name} ${t.patient.last_name}` : 'Paciente'}
                  </span>
                  <span className="db-item-meta">
                    DNI: {t.patient?.dni || '-'} &bull; {t.reason || 'Consulta Odontologica'}
                  </span>
                </div>
                <div className="db-item-right">
                  <span className="db-item-date">
                    {t.treatment_date
                      ? new Date(t.treatment_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
                      : 'Hoy'}
                  </span>
                  <button className="db-item-link" title="Ver odontograma"
                    onClick={(e) => { e.stopPropagation(); navigate(`/panel/odontograma?patientId=${t.patient_id}`); }}>
                    <ArrowUpRight size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}