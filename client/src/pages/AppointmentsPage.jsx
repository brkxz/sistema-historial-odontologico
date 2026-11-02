import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, RefreshCw, Calendar,
  Users, Clock, Stethoscope, AlertCircle, User,
} from 'lucide-react';
import api from '../services/api';

/* ── Helpers ── */
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS_LARGO  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DIAS_CORTO  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const COLORES = [
  { bg:'#EFF6FF', border:'#BFDBFE', accent:'#2563EB', light:'#DBEAFE' },
  { bg:'#F0FDF4', border:'#BBF7D0', accent:'#15803D', light:'#DCFCE7' },
  { bg:'#FDF4FF', border:'#E9D5FF', accent:'#7C3AED', light:'#EDE9FE' },
  { bg:'#FFF7ED', border:'#FED7AA', accent:'#C2410C', light:'#FFEDD5' },
  { bg:'#FFF1F2', border:'#FECDD3', accent:'#BE123C', light:'#FFE4E6' },
  { bg:'#F0FDFA', border:'#99F6E4', accent:'#0F766E', light:'#CCFBF1' },
];

function getLunes(offsetWeeks = 0) {
  const now = new Date();
  const dow = now.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  now.setDate(now.getDate() + diff + offsetWeeks * 7);
  now.setHours(12, 0, 0, 0);
  return now;
}

function toISO(d) { return d.toISOString().slice(0, 10); }

function isoToDisplay(iso) {
  const d = new Date(iso + 'T12:00:00');
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function isToday(iso) { return iso === toISO(new Date()); }

/* ── Tarjeta de doctor ── */
function DoctorCard({ doctor, citas, color }) {
  const shortName = doctor.replace(/^(C\.D\.|ESP\. C\.D\.)\s*/i, '').split(' ').slice(0, 3).join(' ');
  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${color.border}`,
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
    }}>
      {/* Header doctor */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        padding: '0.75rem 1rem',
        background: color.light,
        borderBottom: `1px solid ${color.border}`,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: color.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Stethoscope size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: color.accent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {shortName}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {citas.length} {citas.length === 1 ? 'paciente' : 'pacientes'}
          </div>
        </div>
        <span style={{
          background: color.accent, color: '#fff',
          fontSize: '0.75rem', fontWeight: 700,
          borderRadius: 999, padding: '2px 10px', flexShrink: 0,
        }}>{citas.length}</span>
      </div>

      {/* Lista de citas */}
      <div style={{ padding: '0.5rem' }}>
        {citas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            Sin citas
          </div>
        ) : (
          citas.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.5rem 0.625rem',
              borderRadius: 8,
              background: i % 2 === 0 ? '#f8fafc' : '#fff',
              marginBottom: 2,
            }}>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700,
                color: color.accent, fontFamily: 'monospace',
                background: color.light, borderRadius: 6,
                padding: '2px 6px', flexShrink: 0,
              }}>{c.hora}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
                  {c.nombre}
                </div>
                {c.consultorio && (
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{c.consultorio}</div>
                )}
              </div>
              {c.celular && (
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0 }}>
                  {c.celular.slice(-4)}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Página principal ── */
export default function AppointmentsPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [semana,     setSemana]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [diaSelIdx,  setDiaSelIdx]  = useState(() => {
    const d = new Date().getDay();
    return d === 0 || d === 7 ? 0 : d - 1; // lunes=0
  });

  const fetchSemana = useCallback(async (offset) => {
    setLoading(true);
    setError(null);
    try {
      const fechaInicio = toISO(getLunes(offset));
      const data = await api.get(`/agenda/semanal?fechaInicio=${fechaInicio}`);
      setSemana(data);
    } catch (e) {
      setError(e.message || 'Error al cargar la agenda.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSemana(weekOffset); }, [weekOffset, fetchSemana]);

  /* Día seleccionado */
  const diaActual = semana?.semana?.[diaSelIdx] ?? null;
  const colorMap  = {};
  const getColor  = (name) => {
    if (!colorMap[name]) colorMap[name] = COLORES[Object.keys(colorMap).length % COLORES.length];
    return colorMap[name];
  };

  /* Label de semana */
  const semanaLabel = semana
    ? (() => {
        const ini = new Date(semana.semanaInicio + 'T12:00:00');
        const fin = new Date(ini); fin.setDate(ini.getDate() + 5);
        return `${ini.getDate()} – ${fin.getDate()} de ${MESES[fin.getMonth()]} ${fin.getFullYear()}`;
      })()
    : '—';

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Calendar size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Agenda Semanal
          </h1>
          <p className="page-subtitle">
            Citas desde Google Sheets · {semanaLabel}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            background: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: 10, padding: '0.4rem 0.875rem',
            display: 'flex', alignItems: 'center', gap: '0.375rem',
          }}>
            <Users size={15} color="#2563EB" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1D4ED8' }}>
              {semana?.total ?? 0}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>esta semana</span>
          </div>
        </div>
      </div>

      {/* ── Navegación de semana ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 12, padding: '0.5rem 0.75rem',
      }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w - 1)} disabled={loading}>
          <ChevronLeft size={18} />
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
          {semanaLabel}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w + 1)} disabled={loading}>
          <ChevronRight size={18} />
        </button>
        <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
        <button className={`btn btn-sm ${weekOffset === 0 ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setWeekOffset(0); setDiaSelIdx(Math.max(0, new Date().getDay() - 1)); }}
          disabled={loading}>
          Hoy
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => fetchSemana(weekOffset)} disabled={loading}>
          <RefreshCw size={15} style={{ animation: loading ? 'rem-pulse 1s infinite' : 'none' }} />
        </button>
      </div>

      {/* ── Selector de día (pills) ── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(semana?.semana ?? Array.from({ length: 6 }, (_, i) => {
          const d = getLunes(weekOffset); d.setDate(d.getDate() + i);
          return { fecha: toISO(d), diaNombre: DIAS_LARGO[d.getDay()], totalPacientes: null };
        })).map((dia, i) => {
          const selected = diaSelIdx === i;
          const today    = isToday(dia.fecha);
          const d        = new Date(dia.fecha + 'T12:00:00');
          return (
            <button
              key={i}
              onClick={() => setDiaSelIdx(i)}
              style={{
                flex: 1, minWidth: 80,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '0.625rem 0.5rem',
                borderRadius: 12,
                border: selected
                  ? '2px solid #2563EB'
                  : today
                    ? '2px solid #BFDBFE'
                    : '1.5px solid #e2e8f0',
                background: selected ? '#2563EB' : today ? '#EFF6FF' : '#fff',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: selected ? '0 4px 12px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                color: selected ? '#BFDBFE' : today ? '#2563EB' : '#94a3b8',
              }}>
                {DIAS_CORTO[d.getDay()]}
              </span>
              <span style={{
                fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.1,
                color: selected ? '#fff' : today ? '#1D4ED8' : '#1e293b',
              }}>
                {String(d.getDate()).padStart(2, '0')}
              </span>
              {dia.totalPacientes !== null && (
                <span style={{
                  marginTop: 3,
                  fontSize: '0.65rem', fontWeight: 600,
                  background: selected ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: selected ? '#fff' : '#64748b',
                  borderRadius: 999, padding: '1px 8px',
                }}>
                  {dia.totalPacientes} pac.
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 10, padding: '0.875rem 1rem',
          color: '#991B1B', fontSize: '0.85rem',
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Error al cargar la agenda:</strong> {error}
            <div style={{ marginTop: 4, fontSize: '0.78rem', color: '#B91C1C' }}>
              Verifica que las credenciales de Google Sheets estén configuradas en Render.
            </div>
          </div>
        </div>
      )}

      {/* ── Contenido del día seleccionado ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              height: 200, borderRadius: 14,
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              animation: 'rem-pulse 1.5s infinite',
            }} />
          ))}
        </div>
      ) : diaActual ? (
        <>
          {/* Título del día */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: isToday(diaActual.fecha) ? '#2563EB' : '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Calendar size={20} color={isToday(diaActual.fecha) ? '#fff' : '#64748b'} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {diaActual.diaNombre}, {isoToDisplay(diaActual.fecha)}
                {isToday(diaActual.fecha) && (
                  <span style={{
                    marginLeft: 8, fontSize: '0.7rem', fontWeight: 700,
                    background: '#DBEAFE', color: '#1D4ED8',
                    borderRadius: 999, padding: '2px 8px',
                  }}>Hoy</span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {diaActual.totalPacientes} {diaActual.totalPacientes === 1 ? 'paciente' : 'pacientes'} ·{' '}
                {diaActual.doctores.length} {diaActual.doctores.length === 1 ? 'doctor' : 'doctores'}
              </div>
            </div>
          </div>

          {/* Grid de doctores */}
          {diaActual.doctores.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '0.75rem',
              background: '#fff', border: '1.5px dashed #e2e8f0',
              borderRadius: 14, padding: '3rem 2rem', textAlign: 'center',
            }}>
              <Calendar size={40} color="#cbd5e1" />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#475569' }}>Sin citas para este día</div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', maxWidth: 320 }}>
                No hay citas registradas en Google Sheets para el {isoToDisplay(diaActual.fecha)}.
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem',
            }}>
              {diaActual.doctores.map((doc, i) => (
                <DoctorCard
                  key={i}
                  doctor={doc.nombre}
                  citas={doc.citas}
                  color={getColor(doc.nombre)}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
