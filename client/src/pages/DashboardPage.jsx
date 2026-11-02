// ============================================================
// DashboardPage — Panel de Inicio con Gráficos
// Sistema Odontológico · CSSR
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/api';
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
} from 'lucide-react';
import '../styles/dashboard.css';

// ── Helpers de fecha ──────────────────────────────────────────
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatMonth(ym) {
  // ym = "2026-10"
  const [, m] = ym.split('-');
  return MONTH_NAMES[parseInt(m, 10) - 1];
}

function formatDay(dateStr) {
  // dateStr = "2026-10-25"
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
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

// ── Colores de la paleta ──────────────────────────────────────
const COLORS_PIE    = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
const COLOR_AREA    = '#2563EB';
const COLOR_BAR_A   = '#2563EB';
const COLOR_BAR_B   = '#10B981';

// ── Mini SparkBar (últimos 7 días en la métrica card) ─────────
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

// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats,     setStats]     = useState(null);
  const [charts,    setCharts]    = useState(null);
  const [recent,    setRecent]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const { user } = useAuth();
  const navigate   = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const [summary, recentData, chartData] = await Promise.all([
        reportService.getSummary().catch(() => null),
        reportService.getRecentTreatments().catch(() => ({ treatments: [] })),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/reports/dashboard-charts`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('odonto_token')}` },
        }).then(r => r.json()).catch(() => null),
      ]);
      setStats(summary);
      setRecent(recentData?.treatments || []);
      setCharts(chartData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
    {
      label: 'Pacientes',
      value: stats?.totalPatients || 0,
      sub: 'Registrados en total',
      icon: Users,
      color: '#0D9488',
      bg: 'rgba(13,148,136,0.1)',
    },
    {
      label: 'Atenciones hoy',
      value: stats?.todayTreatments || 0,
      sub: 'Realizadas hoy',
      icon: Activity,
      color: '#2563EB',
      bg: 'rgba(37,99,235,0.1)',
    },
    {
      label: 'Este mes',
      value: stats?.monthTreatments || 0,
      sub: 'Atenciones del mes',
      icon: CalendarCheck,
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.1)',
    },
    {
      label: 'Próximas citas',
      value: stats?.upcomingAppointments || 0,
      sub: 'Próximos 7 días',
      icon: CalendarClock,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.1)',
    },
  ];

  // Preparar datos para gráficos
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

  const pieData = (charts?.byDentist || [])
    .filter(d => d.count > 0)
    .map(d => ({ name: d.name, value: d.count }));

  const genderData = (charts?.byGender || []).map(g => ({
    name: g.gender === 'M' ? 'Masculino' : g.gender === 'F' ? 'Femenino' : 'No especificado',
    value: parseInt(g.count, 10),
  }));

  const hasAreaData  = areaData.length > 0;
  const hasBarData   = barData.length > 0;
  const hasPieData   = pieData.length > 0;
  const hasGender    = genderData.length > 0;

  return (
    <div className="db-wrap">

      {/* ── CABECERA ── */}
      <div className="db-header">
        <div className="db-greet-left">
          <div className="db-avatar">
            <Stethoscope size={30} />
          </div>
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
          <div
            key={i}
            className="db-metric-card"
            style={{ '--mc': m.bg }}
          >
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

      {/* ── GRÁFICOS FILA 1: Área + Barras ── */}
      <div className="db-charts-row">

        {/* Gráfico de área — atenciones últimos 30 días */}
        <div className="db-chart-card db-chart-card--wide">
          <div className="db-chart-hd">
            <div>
              <span className="db-chart-title">
                <TrendingUp size={16} /> Atenciones últimos 30 días
              </span>
              <p className="db-chart-sub">Actividad diaria del consultorio</p>
            </div>
            <span className="db-chart-badge" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563EB' }}>
              {stats?.monthTreatments || 0} este mes
            </span>
          </div>
          {hasAreaData ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLOR_AREA} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLOR_AREA} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false} axisLine={false}
                  interval={Math.floor(areaData.length / 6)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false} axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Atenciones"
                  stroke={COLOR_AREA}
                  strokeWidth={2.5}
                  fill="url(#gradArea)"
                  dot={false}
                  activeDot={{ r: 5, fill: COLOR_AREA, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="db-chart-empty">Sin datos suficientes aún</div>
          )}
        </div>

        {/* Gráfico de barras — por mes */}
        <div className="db-chart-card">
          <div className="db-chart-hd">
            <div>
              <span className="db-chart-title">
                <CalendarCheck size={16} /> Actividad mensual
              </span>
              <p className="db-chart-sub">Últimos 6 meses</p>
            </div>
          </div>
          {hasBarData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false} axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false} axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '0.72rem', paddingTop: 8 }}
                />
                <Bar dataKey="Atenciones" fill={COLOR_BAR_A} radius={[6,6,0,0]} maxBarSize={28} />
                <Bar dataKey="Pacientes"  fill={COLOR_BAR_B} radius={[6,6,0,0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="db-chart-empty">Sin datos suficientes aún</div>
          )}
        </div>
      </div>

      {/* ── GRÁFICOS FILA 2: Pie Dentistas + Pie Género + Recientes ── */}
      <div className="db-charts-row db-charts-row--3">

        {/* Pie — por odontólogo */}
        <div className="db-chart-card">
          <div className="db-chart-hd">
            <div>
              <span className="db-chart-title">
                <Stethoscope size={16} /> Por odontólogo
              </span>
              <p className="db-chart-sub">Distribución de atenciones</p>
            </div>
          </div>
          {hasPieData ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={40} outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                    ))}
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

        {/* Pie — por género */}
        <div className="db-chart-card">
          <div className="db-chart-hd">
            <div>
              <span className="db-chart-title">
                <UserPlus size={16} /> Pacientes por género
              </span>
              <p className="db-chart-sub">Total registrados</p>
            </div>
          </div>
          {hasGender ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%" cy="50%"
                    innerRadius={40} outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="db-pie-legend">
                {genderData.map((d, i) => (
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
