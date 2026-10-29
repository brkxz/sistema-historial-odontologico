// ============================================================
// AIKnowledgePage — Panel de Entrenamiento de Denty IA
// ============================================================

import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CATEGORIES = [
  'Servicios', 'Horarios y Citas', 'Precios', 'Procedimientos',
  'Urgencias', 'Medicamentos', 'Higiene Bucal', 'Equipo Médico',
  'SIS y Cobertura', 'General',
];

const DEFAULT_FORM = { category: 'General', question: '', answer: '', priority: 0, is_active: true };

function getHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d)); }
  catch { return d; }
}

// ─── Stat card ───
function StatCard({ icon, iconColor, value, label }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px' }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        background: `${iconColor}18`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <i className={icon} style={{ color: iconColor, fontSize: '1.1rem' }} />
      </div>
      <div>
        <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '3px' }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Badge rating ───
function RatingBadge({ rating }) {
  if (rating === 1)  return <span className="badge badge-success"><i className="fa-solid fa-thumbs-up" /> Útil</span>;
  if (rating === -1) return <span className="badge badge-danger"><i className="fa-solid fa-thumbs-down" /> No útil</span>;
  return <span className="badge badge-secondary"><i className="fa-regular fa-clock" /> Sin calificar</span>;
}

// ─── Modal: Promover conversación a conocimiento ───
function PromoteModal({ conv, onClose, onSave }) {
  const [category, setCategory] = useState('General');
  const [question, setQuestion] = useState(conv.user_message || '');
  const [answer, setAnswer] = useState(conv.ai_response || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/ai/promote`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ conversation_id: conv.id, category, question_override: question, answer_override: answer }),
      });
      if (!res.ok) throw new Error();
      onSave();
    } catch { alert('Error al guardar. Intenta de nuevo.'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '560px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-brain" style={{ color: '#6366f1' }} />
            Agregar al conocimiento de Denty
          </h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px', marginTop: '4px' }}>
          Edita si es necesario. Denty usará esto en conversaciones futuras.
        </p>
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label">Categoría</label>
          <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label">Pregunta del paciente</label>
          <input className="form-input" type="text" value={question} onChange={e => setQuestion(e.target.value)} maxLength={500} />
        </div>
        <div className="form-group" style={{ marginBottom: '22px' }}>
          <label className="form-label">Respuesta que dará Denty</label>
          <textarea className="form-textarea" value={answer} onChange={e => setAnswer(e.target.value)} rows={5} maxLength={3000} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{answer.length}/3000</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !question.trim() || !answer.trim()}>
            {saving
              ? <><i className="fa-solid fa-spinner fa-spin" /> Guardando...</>
              : <><i className="fa-solid fa-brain" /> Guardar en conocimiento</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 1: DASHBOARD
// ═══════════════════════════════════════════════════════════
function TabDashboard({ stats, loading }) {
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} /> Cargando estadísticas...
    </div>
  );
  if (!stats) return null;

  const ratingPct = stats.total_conversations > 0
    ? Math.round((stats.positive_ratings / stats.total_conversations) * 100) : 0;

  const score = Math.min(
    Math.round((stats.active_knowledge * 3) + (stats.positive_ratings * 2) + (stats.total_conversations * 0.5)), 100
  );
  const level = score < 20 ? 'Principiante' : score < 50 ? 'En desarrollo' : score < 80 ? 'Avanzado' : 'Experto';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Progreso */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
        border: 'none', padding: '24px', position: 'relative', overflow: 'hidden',
      }}>
        <i className="fa-solid fa-brain" style={{
          position: 'absolute', right: '-10px', top: '-10px',
          fontSize: '7rem', opacity: 0.07, color: '#fff',
        }} />
        <div style={{ color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>Nivel de entrenamiento de Denty</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: '3px' }}>
                Agrega conocimiento y revisa conversaciones para mejorar las respuestas.
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)', borderRadius: '8px',
              padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
            }}>
              {level}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '100px', height: '8px', marginBottom: '6px' }}>
            <div style={{ background: '#fff', borderRadius: '100px', height: '8px', width: `${score}%`, transition: 'width 1s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.7 }}>
            <span>0 pts</span>
            <span style={{ fontWeight: 700, opacity: 1 }}>{score} / 100 puntos</span>
            <span>100 pts</span>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <StatCard icon="fa-solid fa-comments"    iconColor="#3b82f6" value={stats.total_conversations}  label="Conversaciones guardadas" />
        <StatCard icon="fa-solid fa-thumbs-up"   iconColor="#10b981" value={stats.positive_ratings}     label="Respuestas útiles" />
        <StatCard icon="fa-solid fa-thumbs-down" iconColor="#ef4444" value={stats.negative_ratings}     label="A mejorar" />
        <StatCard icon="fa-solid fa-brain"       iconColor="#6366f1" value={stats.active_knowledge}     label="Conocimientos activos" />
        <StatCard icon="fa-solid fa-users"       iconColor="#f59e0b" value={stats.recent_sessions_7d || 0} label="Usuarios (7 días)" />
        <StatCard icon="fa-solid fa-chart-line"  iconColor="#10b981" value={`${ratingPct}%`}            label="Tasa de satisfacción" />
      </div>

      {/* Guía */}
      <div className="card" style={{ padding: '22px' }}>
        <h3 style={{ margin: '0 0 18px', fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-route" style={{ color: '#6366f1' }} /> Cómo entrenar a Denty paso a paso
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { n: '1', color: '#3b82f6', icon: 'fa-solid fa-comments',         title: 'Los pacientes chatean con Denty',   desc: 'Cada conversación del chat público se guarda automáticamente en la base de datos.' },
            { n: '2', color: '#6366f1', icon: 'fa-solid fa-magnifying-glass',  title: 'Revisa las conversaciones',          desc: 'En la pestaña "Conversaciones" puedes leer las preguntas de los pacientes y las respuestas de Denty.' },
            { n: '3', color: '#10b981', icon: 'fa-solid fa-brain',             title: 'Entrena con las mejores respuestas', desc: 'Haz clic en "Entrenar con esto" para guardar una buena conversación en la base de conocimiento.' },
            { n: '4', color: '#f59e0b', icon: 'fa-solid fa-bolt',              title: 'Denty mejora automáticamente',       desc: 'Desde ese momento, Denty usa ese conocimiento en todas las conversaciones futuras.' },
          ].map(({ n, color, icon, title, desc }) => (
            <div key={n} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%', background: color,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
              }}>
                {n}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className={icon} style={{ color }} /> {title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2: CONVERSACIONES
// ═══════════════════════════════════════════════════════════
function TabConversations({ onPromote }) {
  const [convs, setConvs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter !== 'all' ? `&rating=${filter}` : '';
      const res = await fetch(`${API_BASE}/ai/conversations?limit=${LIMIT}&offset=${page * LIMIT}${q}`, { headers: getHeaders() });
      const data = await res.json();
      setConvs(data.conversations || []);
      setTotal(data.total || 0);
    } catch { setConvs([]); }
    finally { setLoading(false); }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const filters = [
    { val: 'all',      label: 'Todas' },
    { val: 'unrated',  label: 'Sin calificar' },
    { val: 'positive', label: 'Útiles' },
    { val: 'negative', label: 'A mejorar' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {filters.map(f => (
          <button
            key={f.val}
            className={`btn btn-sm ${filter === f.val ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setFilter(f.val); setPage(0); }}
            style={{ borderRadius: '100px' }}
          >
            {f.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {total} resultado{total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} /> Cargando...
        </div>
      ) : convs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <i className="fa-solid fa-comments" style={{ fontSize: '2.5rem', color: 'var(--border)', display: 'block', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 6px' }}>
            {filter === 'all' ? 'Aún no hay conversaciones.' : 'No hay conversaciones con este filtro.'}
          </p>
          {filter === 'all' && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Las conversaciones del chat de Denty aparecerán aquí automáticamente.
            </p>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {convs.map(conv => (
              <div key={conv.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                  style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '5px' }}>
                      <RatingBadge rating={conv.rating} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{fmtDate(conv.created_at)}</span>
                      {conv.provider && <span className="badge badge-primary">{conv.provider}</span>}
                    </div>
                    <div style={{ fontWeight: 500, fontSize: '0.87rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <i className="fa-solid fa-user" style={{ color: 'var(--text-muted)', marginRight: '6px', fontSize: '0.75rem' }} />
                      {conv.user_message?.slice(0, 120)}{(conv.user_message?.length || 0) > 120 ? '…' : ''}
                    </div>
                  </div>
                  <i className={`fa-solid fa-chevron-${expanded === conv.id ? 'up' : 'down'}`}
                    style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '4px', fontSize: '0.8rem' }} />
                </div>

                {expanded === conv.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px' }}>
                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '12px 14px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Pregunta del paciente
                      </div>
                      <div style={{ fontSize: '0.87rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{conv.user_message}</div>
                    </div>
                    <div style={{ background: 'var(--primary-50, #eff6ff)', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.06em', marginBottom: '6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="fa-solid fa-tooth" /> Respuesta de Denty
                      </div>
                      <div style={{ fontSize: '0.87rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{conv.ai_response}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => onPromote(conv)}>
                        <i className="fa-solid fa-brain" /> Entrenar con esto
                      </button>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ID #{conv.id}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {total > LIMIT && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px', alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <i className="fa-solid fa-arrow-left" /> Anterior
              </button>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {page + 1} / {Math.ceil(total / LIMIT)}
              </span>
              <button className="btn btn-secondary btn-sm" disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)}>
                Siguiente <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 3: BASE DE CONOCIMIENTO
// ═══════════════════════════════════════════════════════════
function TabKnowledge({ refreshTrigger }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai-knowledge`, { headers: getHeaders() });
      setEntries((await res.json()).knowledge || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }
  function openNew() { setEditingId(null); setForm(DEFAULT_FORM); setShowForm(true); }
  function openEdit(e) {
    setEditingId(e.id);
    setForm({ category: e.category, question: e.question, answer: e.answer, priority: e.priority || 0, is_active: e.is_active });
    setShowForm(true);
  }

  async function handleSave(ev) {
    ev.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      const url = editingId ? `${API_BASE}/ai-knowledge/${editingId}` : `${API_BASE}/ai-knowledge`;
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: getHeaders(), body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      showToast(editingId ? 'Entrada actualizada correctamente' : 'Conocimiento guardado — Denty ya puede usarlo');
      setShowForm(false); load();
    } catch { showToast('Error al guardar. Intenta de nuevo.'); }
    finally { setSaving(false); }
  }

  async function handleToggle(entry) {
    try {
      await fetch(`${API_BASE}/ai-knowledge/${entry.id}`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify({ is_active: !entry.is_active }),
      });
      load();
    } catch { }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta entrada?')) return;
    try {
      await fetch(`${API_BASE}/ai-knowledge/${id}`, { method: 'DELETE', headers: getHeaders() });
      showToast('Entrada eliminada'); load();
    } catch { }
  }

  const filtered = filterCat ? entries.filter(e => e.category === filterCat) : entries;
  const active = entries.filter(e => e.is_active).length;

  return (
    <div>
      {toast && (
        <div className="card" style={{
          background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46',
          padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <i className="fa-solid fa-circle-check" /> {toast}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="badge badge-primary">
          <i className="fa-solid fa-brain" /> {active} activas
        </span>
        <span className="badge badge-secondary">{entries.length} totales</span>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => {
            const n = entries.filter(e => e.category === c).length;
            return n > 0 ? <option key={c} value={c}>{c} ({n})</option> : null;
          })}
        </select>
        <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={openNew}>
          <i className="fa-solid fa-plus" /> Nueva entrada
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-pen-to-square" style={{ color: '#6366f1' }} />
              {editingId ? 'Editar entrada' : 'Nueva entrada de conocimiento'}
            </h3>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowForm(false)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 130px', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Prioridad</label>
                <input className="form-input" type="number" min="0" max="100" value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-select" value={form.is_active ? 'true' : 'false'}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Pregunta / Tema</label>
              <input className="form-input" type="text" placeholder="Ej: Cuanto cuesta una limpieza dental"
                value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} required maxLength={500} />
            </div>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label">Respuesta que dará Denty</label>
              <textarea className="form-textarea" placeholder="Escribe la respuesta ideal que Denty debe dar a los pacientes..."
                value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                required rows={4} maxLength={3000} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{form.answer.length}/3000</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving
                  ? <><i className="fa-solid fa-spinner fa-spin" /> Guardando...</>
                  : <><i className="fa-solid fa-floppy-disk" /> {editingId ? 'Actualizar' : 'Guardar'}</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} /> Cargando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <i className="fa-solid fa-brain" style={{ fontSize: '2.5rem', color: 'var(--border)', display: 'block', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px' }}>
            {entries.length === 0
              ? 'Aún no hay conocimiento guardado. Agrega entradas o usa "Entrenar con esto" en las conversaciones.'
              : 'No hay entradas en esta categoría.'}
          </p>
          {entries.length === 0 && (
            <button className="btn btn-primary" onClick={openNew}>
              <i className="fa-solid fa-plus" /> Agregar primera entrada
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(entry => (
            <div key={entry.id} className="card" style={{ padding: '14px 18px', opacity: entry.is_active ? 1 : 0.55 }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-primary">{entry.category}</span>
                {entry.priority > 0 && (
                  <span className="badge badge-secondary">
                    <i className="fa-solid fa-arrow-up" /> {entry.priority}
                  </span>
                )}
                <span className={`badge ${entry.is_active ? 'badge-success' : 'badge-secondary'}`}>
                  <i className={`fa-solid fa-circle${entry.is_active ? '-check' : ''}`} />
                  {entry.is_active ? ' Activa' : ' Inactiva'}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                <i className="fa-solid fa-circle-question" style={{ color: '#6366f1', marginRight: '6px' }} />
                {entry.question}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
                {entry.answer.length > 200 ? entry.answer.slice(0, 200) + '…' : entry.answer}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(entry)}>
                  <i className="fa-solid fa-pen" /> Editar
                </button>
                <button
                  className={`btn btn-sm ${entry.is_active ? 'btn-secondary' : 'btn-success'}`}
                  onClick={() => handleToggle(entry)}
                >
                  <i className={`fa-solid fa-toggle-${entry.is_active ? 'off' : 'on'}`} />
                  {entry.is_active ? ' Desactivar' : ' Activar'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(entry.id)}>
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function AIKnowledgePage() {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [promoteConv, setPromoteConv] = useState(null);
  const [knowledgeRefresh, setKnowledgeRefresh] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/ai/stats`, { headers: getHeaders() })
      .then(r => r.json()).then(setStats).catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [knowledgeRefresh]);

  function handlePromoteSaved() {
    setPromoteConv(null);
    setTab('knowledge');
    setKnowledgeRefresh(n => n + 1);
  }

  const TABS = [
    { id: 'dashboard',     icon: 'fa-solid fa-chart-bar',  label: 'Dashboard' },
    { id: 'conversations', icon: 'fa-solid fa-comments',   label: 'Conversaciones' },
    { id: 'knowledge',     icon: 'fa-solid fa-brain',      label: 'Conocimiento' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fa-solid fa-brain" style={{ color: '#6366f1', marginRight: '10px' }} />
            Entrenamiento de Denty IA
          </h1>
          <p className="page-subtitle">
            Revisa conversaciones del chat, califica respuestas y agrega conocimiento. Denty mejora con cada entrada que guardas.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '2px', background: 'var(--bg-tertiary)',
        borderRadius: '10px', padding: '4px', marginBottom: '24px',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              background: tab === t.id ? 'var(--bg-card)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: tab === t.id ? 700 : 400,
              fontSize: '0.86rem',
              boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <i className={t.icon} style={{ fontSize: '0.85rem', color: tab === t.id ? '#6366f1' : 'inherit' }} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard'     && <TabDashboard stats={stats} loading={loadingStats} />}
      {tab === 'conversations' && <TabConversations onPromote={setPromoteConv} />}
      {tab === 'knowledge'     && <TabKnowledge refreshTrigger={knowledgeRefresh} />}

      {promoteConv && (
        <PromoteModal conv={promoteConv} onClose={() => setPromoteConv(null)} onSave={handlePromoteSaved} />
      )}
    </div>
  );
}
