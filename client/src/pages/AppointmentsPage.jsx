import { useState, useEffect, useCallback } from 'react';
import { appointmentService, patientService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/UI/Toast';
import {
  CalendarPlus, CalendarCheck, Clock, User, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Loader, Filter, Search, RefreshCw,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const STATUS_LABEL = {
  pending:   { label: 'Pendiente',  color: '#F59E0B' },
  confirmed: { label: 'Confirmada', color: '#3B82F6' },
  cancelled: { label: 'Cancelada',  color: '#EF4444' },
  completed: { label: 'Completada', color: '#10B981' },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { label: status, color: '#6B7280' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: s.color + '22', color: s.color,
    }}>
      {s.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d + 'T12:00:00').toLocaleDateString('es-PE', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

// ─── Modal: Nueva / Editar cita ─────────────────────────────────────────────
function AppointmentModal({ appointment, onClose, onSaved }) {
  const { user } = useAuth();
  const toast    = useToast();
  const [form, setForm]       = useState({
    patient_id:  appointment?.patient_id  || '',
    dentist_id:  appointment?.dentist_id  || user.id,
    date:        appointment?.date        || '',
    time:        appointment?.time        || '09:00',
    duration:    appointment?.duration    || 30,
    reason:      appointment?.reason      || '',
    notes:       appointment?.notes       || '',
    status:      appointment?.status      || 'pending',
  });
  const [patients,  setPatients]  = useState([]);
  const [dentists,  setDentists]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [pSearch,   setPSearch]   = useState('');
  const isEdit = !!appointment;

  useEffect(() => {
    userService.getDentists().then(d => setDentists(d.users || [])).catch(() => {});
    if (appointment?.patient) {
      setPatients([appointment.patient]);
    }
  }, [appointment]);

  useEffect(() => {
    if (pSearch.length < 2) return;
    const t = setTimeout(() => {
      patientService.getAll(pSearch).then(d => setPatients(d.patients || [])).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [pSearch]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.date || !form.time || !form.reason) {
      toast.warning('Completa los campos obligatorios');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await appointmentService.update(appointment.id, form);
        toast.success('Cita actualizada');
      } else {
        await appointmentService.create(form);
        toast.success('Cita creada');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar la cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560, width: '95%' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            <CalendarPlus size={20} /> {isEdit ? 'Editar Cita' : 'Nueva Cita'}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Paciente */}
          <div className="form-group">
            <label className="form-label">Paciente *</label>
            {appointment?.patient ? (
              <input className="form-input" value={`${appointment.patient.first_name} ${appointment.patient.last_name}`} readOnly />
            ) : (
              <>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 34 }}
                    placeholder="Buscar paciente por nombre o DNI..."
                    value={pSearch}
                    onChange={e => setPSearch(e.target.value)}
                  />
                </div>
                {patients.length > 0 && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, maxHeight: 140, overflowY: 'auto', background: 'var(--bg-card)' }}>
                    {patients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => { set('patient_id', p.id); setPSearch(`${p.first_name} ${p.last_name}`); setPatients([]); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 14 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <strong>{p.first_name} {p.last_name}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>DNI: {p.dni}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Fecha y hora */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input type="date" className="form-input" value={form.date} min={new Date().toISOString().split('T')[0]}
                onChange={e => set('date', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Hora *</label>
              <input type="time" className="form-input" value={form.time}
                onChange={e => set('time', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Duración (min)</label>
              <select className="form-input form-select" value={form.duration} onChange={e => set('duration', +e.target.value)}>
                {[15, 20, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>

          {/* Odontólogo (solo admin) */}
          {user.role === 'admin' && (
            <div className="form-group">
              <label className="form-label">Odontólogo</label>
              <select className="form-input form-select" value={form.dentist_id} onChange={e => set('dentist_id', +e.target.value)}>
                {dentists.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
          )}

          {/* Motivo */}
          <div className="form-group">
            <label className="form-label">Motivo *</label>
            <input className="form-input" placeholder="Ej: Limpieza dental, Extracción, Control..." value={form.reason}
              onChange={e => set('reason', e.target.value)} required />
          </div>

          {/* Notas */}
          <div className="form-group">
            <label className="form-label">Notas adicionales</label>
            <textarea className="form-input form-textarea" rows={2} value={form.notes}
              onChange={e => set('notes', e.target.value)} placeholder="Observaciones opcionales..." />
          </div>

          {/* Estado (solo edición) */}
          {isEdit && (
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-input form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="cancelled">Cancelada</option>
                <option value="completed">Completada</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader size={16} className="spin" /> : <CheckCircle size={16} />}
              {isEdit ? 'Guardar cambios' : 'Crear cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const { user }  = useAuth();
  const toast     = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate,   setFilterDate]   = useState('');
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const [cancelModal,  setCancelModal]  = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAll({
        status: filterStatus || undefined,
        date:   filterDate   || undefined,
        page, limit: LIMIT,
      });
      setAppointments(data.appointments || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Error al cargar citas');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDate, page, toast]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    try {
      await appointmentService.cancel(cancelModal.id, cancelReason);
      toast.success('Cita cancelada');
      setCancelModal(null);
      setCancelReason('');
      load();
    } catch (err) {
      toast.error(err.message || 'Error al cancelar');
    }
  };

  const handleComplete = async (id) => {
    try {
      await appointmentService.complete(id);
      toast.success('Cita marcada como completada');
      load();
    } catch (err) {
      toast.error(err.message || 'Error al completar');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda de Citas</h1>
          <p className="page-subtitle">Gestión de citas odontológicas · {total} total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={load} title="Actualizar">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <CalendarPlus size={16} /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-lg" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Filter size={16} style={{ alignSelf: 'center', color: 'var(--text-muted)' }} />
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 140 }}>
          <label className="form-label">Fecha</label>
          <input type="date" className="form-input" value={filterDate}
            onChange={e => { setFilterDate(e.target.value); setPage(1); }} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 140 }}>
          <label className="form-label">Estado</label>
          <select className="form-input form-select" value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmada</option>
            <option value="cancelled">Cancelada</option>
            <option value="completed">Completada</option>
          </select>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterDate(''); setPage(1); }}>
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <div className="card">
        {loading ? (
          <div className="loading-overlay" style={{ minHeight: 200 }}>
            <div className="spinner" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <CalendarCheck size={48} style={{ opacity: 0.2 }} />
            <p>No hay citas {filterStatus || filterDate ? 'con los filtros seleccionados' : 'registradas'}</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }}
              onClick={() => { setEditing(null); setShowModal(true); }}>
              <CalendarPlus size={15} /> Crear primera cita
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Paciente</th>
                    <th>Odontólogo</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{formatDate(a.date)}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                          {a.time} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({a.duration}min)</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : '-'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {a.patient?.phone || a.patient?.dni}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                            {a.dentist?.full_name?.[0]}
                          </div>
                          <span style={{ fontSize: 13 }}>{a.dentist?.full_name || '-'}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 180 }}>
                        <div style={{ fontSize: 13 }}>{a.reason}</div>
                        {a.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.notes}</div>}
                      </td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(a.status === 'pending' || a.status === 'confirmed') && (
                            <>
                              <button className="btn btn-ghost btn-sm" title="Editar"
                                onClick={() => { setEditing(a); setShowModal(true); }}>
                                ✏️
                              </button>
                              <button className="btn btn-ghost btn-sm" title="Completar"
                                onClick={() => handleComplete(a.id)}
                                style={{ color: '#10B981' }}>
                                <CheckCircle size={15} />
                              </button>
                              <button className="btn btn-ghost btn-sm" title="Cancelar"
                                onClick={() => { setCancelModal(a); setCancelReason(''); }}
                                style={{ color: '#EF4444' }}>
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '16px 0 4px' }}>
                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Página {page} de {totalPages}
                </span>
                <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal nueva/editar cita */}
      {showModal && (
        <AppointmentModal
          appointment={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={load}
        />
      )}

      {/* Modal cancelar cita */}
      {cancelModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setCancelModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#EF4444' }}>
                <XCircle size={20} /> Cancelar Cita
              </h2>
              <button className="modal-close" onClick={() => setCancelModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>
                ¿Cancelar la cita de <strong>{cancelModal.patient?.first_name} {cancelModal.patient?.last_name}</strong> del {formatDate(cancelModal.date)} a las {cancelModal.time}?
              </p>
              <div className="form-group">
                <label className="form-label">Motivo (opcional)</label>
                <input className="form-input" value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Ej: Paciente no se presentó, urgencia, etc." />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setCancelModal(null)}>Volver</button>
                <button className="btn btn-danger" onClick={handleCancel}>Sí, cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
