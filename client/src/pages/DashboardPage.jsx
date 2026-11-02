// ============================================================
// DashboardPage — Panel de Inicio con Gráficos + Recordatorio de Citas
// Sistema Odontológico · CSSR
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService, appointmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  Users, Activity, CalendarCheck, CalendarClock,
  Search, PlusCircle, ChevronRight, Clock, FileText,
  ArrowUpRight, Stethoscope, TrendingUp, UserPlus,
  Calendar, CheckCircle2, XCircle, AlertCircle, Phone,
  Bell, CalendarDays,
} from 'lucide-react';
import '../styles/dashboard.css';

// ── Helpers de fecha ──────────────────────────────────────────
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAY_NAMES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function formatMonth(ym) {
  const [, m] = ym.split('-');
  return MONTH_NAMES[parseInt(m, 10) - 1];
}

function formatDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function formatAppointmentDate(dateStr) {
  const d    = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0,0,0,0);
  const diff  = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff <= 6)  return `En ${diff} días`;
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function isToday(dateStr) {
  const d     = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

// ── Tooltip personalizado ─────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="db-tooltip">
      <p className="db-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Paleta de colores ─────────────────────────────────────────
const COLORS_PIE  = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
const COLOR_AREA  = '#2563EB';
const COLOR_BAR_A = '#2563EB';
const COLOR_BAR_B = '#10B981';

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  icon: AlertCircle },
  confirmed: { label: 'Confirmada', color: '#10B981', bg: 'rgba(16,185,129,0.1)',  icon: CheckCircle2 },
  cancelled: { label: 'Cancelada',  color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   icon: XCircle },
  completed: { label: 'Completada', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: CheckCircle2 },
};

// ── SparkBar ──────────────────────────────────────────────────
function SparkBar({ data, color }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="db-spark">
      {data.slice(-7).map((d, i) => (
        <div
          key={i}
          className="db-spark-bar"
          style={{ height: `${Math.max(4, (d.count / max) * 32)}px`, background: color }}
          title={`${formatDay(d.treatment_date)}: ${d.count}`}
        />
      ))}
    </div>
  );
}

// ── Tarjeta de cita ───────────────────────────────────────────
function AppointmentCard({ apt, onComplete, onCancel }) {
  const cfg         = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
  const StatusIcon  = cfg.icon;
  const patientName = apt.patient
    ? `${apt.patient.first_name} ${apt.patient.last_name}`
    : 'Paciente';
  const dateLabel = formatAppointmentDate(apt.date);
  const today     = isToday(apt.date);

  return (
    <div className={`db-apt-card ${today ? 'db-apt-card--today' : ''}`}>
      {today && <div className="db-apt-today-stripe" />}
      <div className="db-apt-time-col">
        <span className="db-apt-time">{apt.time}</span>
        <span className="db-apt-duration">{apt.duration} min</span>
      </div>
      <div className="db-apt-body">
        <div className="db-apt-patient">{patientName}</div>
        <div className="db-apt-reason">
          <CalendarDays size={12} />
          {apt.reason}
        </div>
        {apt.patient?.phone && (
          <div className="db-apt-phone">
            <Phone size={11} />
            {apt.patient.phone}
          </div>
        )}
        <div className="db-apt-meta">
          {apt.dentist?.full_name && (
            <span className="db-apt-dentist">
              <Stethoscope size={11} /> {apt.dentist.full_name.split(' ').slice(0,2).join(' ')}
            </span>
          )}
          <span className="db-apt-date-label" style={{ color: today ? '#2563EB' : '#94A3B8' }}>
            {dateLabel}
          </span>
        </div>
      </div>
      <div className="db-apt-right">
        <span className="db-apt-status" style={{ color: cfg.color, background: cfg.bg }}>
          <StatusIcon size={11} />
          {cfg.label}
        </span>
        {apt.status !== 'cancelled' && apt.status !== 'completed' && (
          <div className="db-apt-actions">
            <button
              className="db-apt-btn db-apt-btn--ok"
              title="Marcar completada"
              onClick={() => onComplete(apt.id)}
            >
              <CheckCircle2 size={14} />
            </button>
            <button
              className="db-apt-btn db-apt-btn--cancel"
              title="Cancelar cita"
              onClick={() => onCancel(apt.id)}
            >
              <XCircle size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats,       setStats]       = useState(null);
  const [charts,      setCharts]      = useState(null);
  const [recent,      setRecent]      = useState([]);
  const [todayApts,   setTodayApts]   = useState([]);
  const [upcomingApts,setUpcomingApts]= useState([]);
  const [aptTab,      setAptTab]      = useState('today'); // 'today' | 'upcoming'
  const [loading,     setLoading]     = useState(true);
  const { user } = useAuth();
  const navigate  = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem('odonto_token') || localStorage.getItem('token') || '';
      const [summary, recentData, chartData, todayData, upcomingData] = await Promise.all([
        reportService.getSummary().catch(() => null),
        reportService.getRecentTreatments().catch(() => ({ treatments: [] })),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/reports/dashboard-charts`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()).catch(() => null),
        appointmentService.getToday().catch(() => ({ appointments: [] })),
        appointmentService.getUpcoming().catch(() => ({ appointments: [] })),
      ]);
      setStats(summary);
      setRecent(recentData?.treatments || []);
      setCharts(chartData);
      setTodayApts(todayData?.appointments || []);
      setUpcomingApts(upcomingData?.appointments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleComplete = useCallback(async (id) => {
    try {
      await appointmentService.complete(id);
      setTodayApts(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
      setUpcomingApts(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
    } catch { /* silencioso */ }
  }, []);

  const handleCancel = useCallback(async (id) => {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    try {
      await appointmentService.cancel(id);
      setTodayApts(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
      setUpcomingApts(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    } catch { /* silencioso */ }
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
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
    { label: 'Pacientes',       value: stats?.totalPatients      || 0, sub: 'Registrados en total',  icon: Users,         color: '#0D9488', bg: 'rgba(13,148,136,0.1)'  },
    { label: 'Atenciones hoy', value: stats?.todayTreatments    || 0, sub: 'Realizadas hoy',         icon: Activity,      color: '#2563EB', bg: 'rgba(37,99,235,0.1)'   },
    { label: 'Este mes',        value: stats?.monthTreatments    || 0, sub: 'Atenciones del mes',     icon: CalendarCheck, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)'  },
    { label: 'Citas pendientes',value: todayApts.filter(a => a.status === 'pending' || a.status === 'confirmed').length, sub: 'Para hoy', icon: CalendarClock, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  ];

  // Datos para gráficos
  const areaData = (charts?.byDay || []).map(d => ({
    name: formatDay(d.treatment_date),
    Atenciones: parseInt(d.count, 10),
  }));

  const barData = (() => {
    const monthMap = {};
    (charts?.byMonth || []).forEach(d => {
      monthMap[d.month] = { ...(monthMap[d.month] || {}), Atenciones: parseInt(d.count, 10) };
    });
    (charts?.newPatients || []).forEach(d => {
      monthMap[d.month] = { ...(monthMap[d.month] || {}), Pacientes: parseInt(d.count, 10) };
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ name: formatMonth(k), ...v }));
  })();

  const pieData = (charts?.byDentist || []).filter(d => d.count > 0)
    .map(d => ({ name: d.name, value: d.count }));

  const genderData = (charts?.byGender || []).map(g => ({
    name: g.gender === 'M' ? 'Masculino' : g.gender === 'F' ? 'Femenino' : 'No especificado',
    value: parseInt(g.count, 10),
  }));

  const displayApts = aptTab === 'today' ? todayApts : upcomingApts;
  const pendingToday = todayApts.filter(a => a.status === 'pending' || a.status === 'confirmed').length;

  return (
    <div className="db-wrap">

      {/* ── CABECERA ── */}
      <div className="db-header">
        <div className="db-greet-left">
          <div className="db-avatar"><Stethoscope size={30} /></div>
          <div>
            <p className="db-role">
              {user?.role === 'admin' ? 'Administrador Clínico' : 'Odontólogo'} · Centro de Salud San Ramón
            </p>
            <h1 className="db-title">{getGreeting()}, Dr. {doctorName}</h1>
            <p className="db-date"><Clock size={14} /> {today}</p>
          </div>
        </div>
        <div className="db-quick">
          <button className="btn btn-primary" onClick={() => navigate('/panel/nueva-atencion')}>
            <PlusCircle size={18} /> Nueva Atención
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/panel/buscar')}>
            <Search size={18} /> Buscar DNI
          </button>
        </div>
      </div>

      {/* ── MÉTRICAS ── */}
      <div className="db-metrics">
        {metrics.map((m, i) => (
          <div key={i} className="db-metric-card" style={{ '--mc': m.bg }}>
            <div className="db-metric-icon" style={{ background: m.bg, color: m.color }}>
              <m.icon size={24} />
            </div>
            <div className="db-metric-body">
              <div className="db-metric-val">{m.value}</div>
              <div className="db-metric-lbl">{m.label}</div>
              <div className="db-metric-sub">{m.sub}</div>
            </div>
            {i === 1 && <SparkBar data={charts?.byDay} color={m.color} />}
          </div>
        ))}
      </div>

      {/* ── FILA: Gráfico área + Panel de citas ── */}
      <div className="db-charts-row">

        {/* Área — últimos 30 días */}
        <div className="db-chart-card db-chart-card--wide">
          <div className="db-chart-hd">
            <div>
              <span className="db-chart-title"><TrendingUp size={16} /> Atenciones últimos 30 días</span>
              <p className="db-chart-sub">Actividad diaria del consultorio</p>
            </div>
            <span className="db-chart-badge" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563EB' }}>
              {stats?.monthTreatments || 0} este mes
            </span>
          </div>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLOR_AREA} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLOR_AREA} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} interval={Math.floor(areaData.length / 6)} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Atenciones" stroke={COLOR_AREA} strokeWidth={2.5} fill="url(#gradArea)" dot={false} activeDot={{ r: 5, fill: COLOR_AREA, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="db-chart-empty">Sin datos suficientes aún</div>
          )}
        </div>

        {/* ── PANEL CITAS HOY / PRÓXIMAS ── */}
        <div className="db-chart-card db-apt-panel">
          <div className="db-chart-hd">
            <div>
              <span className="db-chart-title">
                <Bell size={15} /> Recordatorio de citas
              </span>
              <p className="db-chart-sub">Gestiona las citas del día</p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/panel/agenda')}
            >
              Ver agenda <ChevronRight size={14} />
            </button>
          </div>

          {/* Tabs */}
          <div className="db-apt-tabs">
            <button
              className={`db-apt-tab ${aptTab === 'today' ? 'active' : ''}`}
              onClick={() => setAptTab('today')}
            >
              <Calendar size={13} /> Hoy
              {pendingToday > 0 && (
                <span className="db-apt-tab-badge">{pendingToday}</span>
              )}
            </button>
            <button
              className={`db-apt-tab ${aptTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setAptTab('upcoming')}
            >
              <CalendarClock size={13} /> Próximas 7 días
              {upcomingApts.filter(a => a.status !== 'cancelled').length > 0 && (
                <span className="db-apt-tab-badge db-apt-tab-badge--muted">
                  {upcomingApts.filter(a => a.status !== 'cancelled').length}
                </span>
              )}
            </button>
          </div>

          {/* Lista de citas */}
          <div className="db-apt-list">
            {displayApts.length === 0 ? (
              <div className="db-apt-empty">
                <CalendarDays size={36} style={{ opacity: 0.2 }} />
                <p>{aptTab === 'today' ? 'Sin citas para hoy' : 'Sin citas los próximos 7 días'}</p>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 10 }}
                  onClick={() => navigate('/panel/agenda')}
                >
                  <PlusCircle size={14} /> Nueva cita
                </button>
              </div>
            ) : (
              displayApts.map(apt => (
                <AppointmentCard
                  key={apt.id}
                  apt={apt}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                />
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── FILA: Barras + Pie dentistas + Pie género ── */}
      <div className="db-charts-row db-charts-row--3">

        {/* Barras por mes */}
        <div className="db-chart-card">
          <div className="db-chart-hd">
            <div>
              <span className="db-chart-title"><CalendarCheck size={16} /> Actividad mensual</span>
              <p className="db-chart-sub">Últimos 6 meses</p>
            </div>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.72rem', paddingTop: 8 }} />
                <Bar dataKey="Atenciones" fill={COLOR_BAR_A} radius={[6,6,0,0]} maxBarSize={28} />
                <Bar dataKey="Pacientes"  fill={COLOR_BAR_B} radius={[6,6,0,0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="db-chart-empty">Sin datos suficientes aún</div>
          )}
        </div>

        {/* Pie odontólogos */}
        <div className="db-chart-card">
          <div className="db-chart-hd">
            <div>
              <span className="db-chart-title"><Stethoscope size={16} /> Por odontólogo</span>
              <p className="db-chart-sub">Distribución de atenciones</p>
            </div>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="db-pie-legend">
                {pieData.map((d, i) => (
                  <div key={i} className="db-pie-legend-item">
                    <span className="db-pie-dot" style={{ background: COLORS_PIE[i % COLORS_PIE.length] }} />
                    <span className="db-pie-name">{d.name}</span>
                    <span className="db-pie-val">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="db-chart-empty">Sin datos aún</div>
          )}
        </div>

        {/* Atenciones recientes */}
        <div className="db-panel db-chart-card--flex">
          <div className="db-panel-hd">
            <span className="db-panel-ttl"><FileText size={16} /> Atenciones recientes</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/panel/historial')}>
              Ver todas <ChevronRight size={14} />
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="db-empty">
              <Stethoscope size={40} style={{ opacity: 0.2 }} />
              <p>Sin atenciones registradas</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}
                onClick={() => navigate('/panel/nueva-atencion')}>
                <PlusCircle size={15} /> Iniciar primera atención
              </button>
            </div>
          ) : (
            <div className="db-list">
              {recent.slice(0, 5).map((t) => (
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
                      DNI: {t.patient?.dni || '-'} · {t.reason || 'Consulta Odontológica'}
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
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
