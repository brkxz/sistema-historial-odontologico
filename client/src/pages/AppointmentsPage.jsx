import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft, ChevronRight, RefreshCw, Calendar,
  Users, Clock, User, Stethoscope, AlertCircle,
} from 'lucide-react';
import api from '../services/api';

const DIAS_CORTO = { Lunes:'Lun', Martes:'Mar', 'Miércoles':'Mié', Jueves:'Jue', Viernes:'Vie', Sábado:'Sáb' };
const COLORES_DOCTOR = [
  { bg: '#EFF6FF', border: '#BFDBFE', header: '#2563EB', dot: '#3B82F6' },
  { bg: '#F0FDF4', border: '#BBF7D0', header: '#15803D', dot: '#22C55E' },
  { bg: '#FDF4FF', border: '#E9D5FF', header: '#7C3AED', dot: '#A855F7' },
  { bg: '#FFF7ED', border: '#FED7AA', header: '#C2410C', dot: '#F97316' },
  { bg: '#FFF1F2', border: '#FECDD3', header: '#BE123C', dot: '#F43F5E' },
  { bg: '#F0FDFA', border: '#99F6E4', header: '#0F766E', dot: '#14B8A6' },
];

function getColorForDoctor(name, map) {
  if (!map[name]) {
    map[name] = COLORES_DOCTOR[Object.keys(map).length % COLORES_DOCTOR.length];
  }
  return map[name];
}

function formatShortDate(isoDate) {
  const [, m, d] = isoDate.split('-');
  return `${d}/${m}`;
}

function isToday(isoDate) {
  return isoDate === new Date().toISOString().slice(0, 10);
}

function getLunesISO(offsetWeeks = 0) {
  const now = new Date();
  const dow = now.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  now.setDate(now.getDate() + diffToMonday + offsetWeeks * 7);
  return now.toISOString().slice(0, 10);
}

// ── Tarjeta de paciente ──────────────────────────────────────────────────────
function CitaCard({ cita, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
      padding: '0.5rem 0.625rem',
      background: '#fff',
      border: `1px solid ${color.border}`,
      borderRadius: 8,
      marginBottom: 4,
    }}>
      <span style={{
        fontSize: '0.7rem', fontWeight: 700,
        color: color.header, minWidth: 38, paddingTop: 1,
        fontFamily: 'monospace',
      }}>{cita.hora}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.3, wordBreak: 'break-word' }}>
          {cita.nombre}
        </div>
        {cita.consultorio && (
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 1 }}>
            {cita.consultorio}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card de doctor ───────────────────────────────────────────────────────────
function DoctorCard({ doctor, citas, color }) {
  const shortName = doctor.split(' ').slice(0, 4).join(' ');
  return (
    <div style={{
      background: color.bg, border: `1px solid ${color.border}`,
      borderRadius: 10, overflow: 'hidden', marginBottom: 8,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.5rem 0.75rem',
        background: color.header + '15',
        borderBottom: `1px solid ${color.border}`,
      }}>
        <Stethoscope size={13} color={color.header} />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: color.header, lineHeight: 1.2 }}>
          {shortName}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
          background: color.header, color: '#fff',
          borderRadius: 999, padding: '1px 7px',
        }}>{citas.length}</span>
      </div>
      <div style={{ padding: '0.5rem 0.5rem 0.25rem' }}>
        {citas.map((c, i) => <CitaCard key={i} cita={c} color={color} />)}
      </div>
    </div>
  );
}

// ── Columna de día ────────────────────────────────────────────────────────────
function DayColumn({ dia, doctorColorMap }) {
  const today = isToday(dia.fecha);
  return (
    <div style={{
      flex: 1, minWidth: 0,
      border: today ? '2px solid #2563EB' : '1px solid #e2e8f0',
      borderRadius: 12,
      background: today ? '#EFF6FF' : '#fff',
      overflow: 'hidden',
      boxShadow: today ? '0 4px 12px rgba(37,99,235,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Header del día */}
      <div style={{
        padding: '0.625rem 0.75rem',
        background: today ? '#2563EB' : '#f8fafc',
        borderBottom: `1px solid ${today ? '#1D4ED8' : '#e2e8f0'}`,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: today ? '#BFDBFE' : '#94a3b8', textTransform: 'uppercase' }}>
          {DIAS_CORTO[dia.diaNombre] || dia.diaNombre}
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: today ? '#fff' : '#1e293b', lineHeight: 1.2 }}>
          {formatShortDate(dia.fecha)}
        </div>
        <div style={{
          marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: '0.65rem', fontWeight: 600,
          color: today ? '#DBEAFE' : '#64748b',
        }}>
          <Users size={10} />
          {dia.totalPacientes} pac.
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '0.5rem', maxHeight: 520, overflowY: 'auto' }}>
        {dia.doctores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: '#cbd5e1', fontSize: '0.75rem' }}>
            <Calendar size={24} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.4 }} />
            Sin citas
          </div>
        ) : (
          dia.doctores.map((doc, i) => (
            <DoctorCard
              key={i}
              doctor={doc.nombre}
              citas={doc.citas}
              color={getColorForDoctor(doc.nombre, doctorColorMap)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const { isAdmin } = useAuth();
  const [weekOffset, setWeekOffset]   = useState(0);
  const [semana,     setSemana]       = useState(null);
  const [loading,    setLoading]      = useState(false);
  const [error,      setError]        = useState(null);
  const [doctorColorMap]              = useState({});

  const fetchSemana = useCallback(async (offset) => {
    setLoading(true);
    setError(null);
    try {
      const fechaInicio = getLunesISO(offset);
      const { data } = await api.get(`/agenda/semanal?fechaInicio=${fechaInicio}`);
      setSemana(data);
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo cargar la agenda. Verifica la conexión con Google Sheets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSemana(weekOffset); }, [weekOffset, fetchSemana]);

  const handlePrev  = () => setWeekOffset(w => w - 1);
  const handleNext  = () => setWeekOffset(w => w + 1);
  const handleToday = () => setWeekOffset(0);

  const totalSemana = semana?.total ?? 0;
  const semanaLabel = semana
    ? (() => {
        const d = new Date(semana.semanaInicio + 'T12:00:00');
        const fin = new Date(d); fin.setDate(d.getDate() + 5);
        const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
        return `${d.getDate()} ${meses[d.getMonth()]} — ${fin.getDate()} ${meses[fin.getMonth()]} ${fin.getFullYear()}`;
      })()
    : '—';

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Calendar size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Agenda Semanal
          </h1>
          <p className="page-subtitle">
            Citas por doctor desde Google Sheets · {semanaLabel}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Estadística total */}
          <div style={{
            background: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: 10, padding: '0.5rem 1rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <Users size={16} color="#2563EB" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1D4ED8' }}>
              {totalSemana} pacientes
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>esta semana</span>
          </div>
        </div>
      </div>

      {/* Navegación de semana */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 12, padding: '0.625rem 1rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <button className="btn btn-ghost btn-sm" onClick={handlePrev} disabled={loading}>
          <ChevronLeft size={18} />
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
            {semanaLabel}
          </span>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={handleNext} disabled={loading}>
          <ChevronRight size={18} />
        </button>

        <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />

        <button
          className={`btn btn-sm ${weekOffset === 0 ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handleToday} disabled={loading}
        >
          Hoy
        </button>

        <button className="btn btn-ghost btn-sm" onClick={() => fetchSemana(weekOffset)} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'rem-pulsing' : ''} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 10, padding: '0.875rem 1rem',
          color: '#991B1B', fontSize: '0.85rem',
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Error al cargar la agenda:</strong> {error}
            <div style={{ marginTop: '0.25rem', fontSize: '0.78rem', color: '#B91C1C' }}>
              Verifica que el panel de Recordatorios WA esté conectado y las credenciales de Google Sheets configuradas.
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 280,
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              borderRadius: 12, animation: 'rem-pulse 1.5s infinite',
            }} />
          ))}
        </div>
      )}

      {/* Grid semanal */}
      {!loading && semana && (
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
          {semana.semana.map((dia, i) => (
            <DayColumn key={i} dia={dia} doctorColorMap={doctorColorMap} />
          ))}
        </div>
      )}

      {/* Leyenda de doctores */}
      {!loading && semana && (() => {
        const allDoctors = [...new Set(
          semana.semana.flatMap(d => d.doctores.map(doc => doc.nombre))
        )];
        if (!allDoctors.length) return null;
        return (
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 12, padding: '0.875rem 1rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>
              Doctores esta semana
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {allDoctors.map((name, i) => {
                const color = getColorForDoctor(name, doctorColorMap);
                const shortName = name.split(' ').slice(0, 4).join(' ');
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    background: color.bg, border: `1px solid ${color.border}`,
                    borderRadius: 999, padding: '0.25rem 0.75rem',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color.header, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: color.header }}>{shortName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
