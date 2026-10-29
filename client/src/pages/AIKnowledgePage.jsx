// ============================================================
// AIKnowledgePage — Panel de Entrenamiento de Denty IA
// Pestañas: Dashboard · Conversaciones · Base de Conocimiento
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

function fmt(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  } catch { return dateStr; }
}

// ─── Componente: Badge de rating ───
function RatingBadge({ rating }) {
  if (rating === 1)  return <span style={badgeStyle('#d1fae5','#065f46')}>👍 Útil</span>;
  if (rating === -1) return <span style={badgeStyle('#fee2e2','#991b1b')}>👎 No útil</span>;
  return <span style={badgeStyle('#f3f4f6','#6b7280')}>⏳ Sin calificar</span>;
}
const badgeStyle = (bg, color) => ({
  padding: '2px 10px', borderRadius: '100px', fontSize: '0.72rem',
  fontWeight: 600, background: bg, color,
});

// ─── Componente: Modal Promover ───
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
    } catch {
      alert('Error al guardar. Intenta de nuevo.');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'560px', padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h3 style={{ margin:0, fontSize:'1.05rem' }}>
            🧠 Agregar al conocimiento de Denty
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'#888' }}>✕</button>
        </div>
        <p style={{ fontSize:'0.82rem', color:'#888', marginBottom:'16px' }}>
          Edita si es necesario antes de guardar. Denty usará esto en futuras conversaciones.
        </p>
        <div style={{ marginBottom:'12px' }}>
          <label style={{ fontSize:'0.8rem', fontWeight:600, display:'block', marginBottom:'4px' }}>Categoría</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'0.87rem' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:'12px' }}>
          <label style={{ fontSize:'0.8rem', fontWeight:600, display:'block', marginBottom:'4px' }}>Pregunta (lo que dijo el paciente)</label>
          <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2} maxLength={500} style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'0.85rem', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
        <div style={{ marginBottom:'20px' }}>
          <label style={{ fontSize:'0.8rem', fontWeight:600, display:'block', marginBottom:'4px' }}>Respuesta que dará Denty</label>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={5} maxLength={3000} style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'0.85rem', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
          <span style={{ fontSize:'0.72rem', color:'#aaa' }}>{answer.length}/3000</span>
        </div>
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:'8px', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:'0.87rem' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving || !question.trim() || !answer.trim()} style={{ padding:'9px 20px', borderRadius:'8px', border:'none', background:'#6366f1', color:'#fff', cursor:'pointer', fontSize:'0.87rem', fontWeight:600 }}>
            {saving ? '⏳ Guardando...' : '🧠 Guardar en conocimiento'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PESTAÑA 1: DASHBOARD DE ENTRENAMIENTO
// ═══════════════════════════════════════════════════════════
function TabDashboard({ stats, loadingStats }) {
  if (loadingStats) return <div style={{ textAlign:'center', padding:'60px', color:'#888' }}><i className="fa-solid fa-spinner fa-spin" /> Cargando estadísticas...</div>;
  if (!stats) return null;

  const ratingPct = stats.total_conversations > 0
    ? Math.round((stats.positive_ratings / stats.total_conversations) * 100)
    : 0;

  const trainingScore = Math.min(
    Math.round((stats.active_knowledge * 3) + (stats.positive_ratings * 2) + (stats.total_conversations * 0.5)),
    100
  );

  return (
    <div>
      {/* Progreso general */}
      <div style={{ background:'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)', borderRadius:'16px', padding:'24px', color:'#fff', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:'-20px', top:'-20px', fontSize:'8rem', opacity:0.08 }}>🧠</div>
        <h2 style={{ margin:'0 0 6px', fontSize:'1.1rem', fontWeight:700 }}>Nivel de Entrenamiento de Denty</h2>
        <p style={{ margin:'0 0 16px', opacity:0.8, fontSize:'0.85rem' }}>
          Mientras más conversaciones revises y más conocimiento agregues, mejor responderá Denty.
        </p>
        <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:'100px', height:'10px', marginBottom:'8px' }}>
          <div style={{ background:'#fff', borderRadius:'100px', height:'10px', width:`${trainingScore}%`, transition:'width 1s ease' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', opacity:0.85 }}>
          <span>Principiante</span>
          <span style={{ fontWeight:700 }}>{trainingScore}/100 puntos</span>
          <span>Experto</span>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'12px', marginBottom:'20px' }}>
        {[
          { icon:'💬', value: stats.total_conversations, label:'Conversaciones guardadas', color:'#3b82f6' },
          { icon:'👍', value: stats.positive_ratings, label:'Respuestas útiles', color:'#10b981' },
          { icon:'👎', value: stats.negative_ratings, label:'Respuestas a mejorar', color:'#ef4444' },
          { icon:'🧠', value: stats.active_knowledge, label:'Conocimientos activos', color:'#6366f1' },
          { icon:'📅', value: stats.recent_sessions_7d, label:'Usuarios (7 días)', color:'#f59e0b' },
          { icon:'✅', value: `${ratingPct}%`, label:'Tasa de satisfacción', color:'#10b981' },
        ].map((s, i) => (
          <div key={i} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'16px', display:'flex', gap:'12px', alignItems:'flex-start' }}>
            <span style={{ fontSize:'1.6rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:'1.5rem', fontWeight:800, color: s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'0.73rem', color:'#888', marginTop:'2px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Guía de cómo entrenar */}
      <div style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'20px' }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'0.95rem', color:'#374151' }}>🎯 Cómo entrenar a Denty paso a paso</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {[
            { step:'1', color:'#3b82f6', title:'Los pacientes chatean con Denty', desc:'Cada conversación se guarda automáticamente en la pestaña "Conversaciones".' },
            { step:'2', color:'#6366f1', title:'Revisa las conversaciones', desc:'Ve a la pestaña "Conversaciones", lee los intercambios y encuentra preguntas comunes o respuestas que se pueden mejorar.' },
            { step:'3', color:'#10b981', title:'Agrega al conocimiento', desc:'Cuando veas una buena pregunta-respuesta, haz clic en "🧠 Entrenar con esto" para guardarla en la base de conocimiento.' },
            { step:'4', color:'#f59e0b', title:'Denty mejora automáticamente', desc:'A partir de ese momento, Denty usará ese conocimiento en TODAS las conversaciones futuras.' },
          ].map(({ step, color, title, desc }) => (
            <div key={step} style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.85rem', flexShrink:0 }}>{step}</div>
              <div>
                <div style={{ fontWeight:600, fontSize:'0.87rem', color:'#1f2937' }}>{title}</div>
                <div style={{ fontSize:'0.8rem', color:'#6b7280', marginTop:'2px' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PESTAÑA 2: CONVERSACIONES
// ═══════════════════════════════════════════════════════════
function TabConversations({ onPromote }) {
  const [convs, setConvs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | positive | negative | unrated
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const LIMIT = 20;

  const fetchConvs = useCallback(async () => {
    setLoading(true);
    try {
      const ratingParam = filter !== 'all' ? `&rating=${filter}` : '';
      const res = await fetch(`${API_BASE}/ai/conversations?limit=${LIMIT}&offset=${page * LIMIT}${ratingParam}`, { headers: getHeaders() });
      const data = await res.json();
      setConvs(data.conversations || []);
      setTotal(data.total || 0);
    } catch { setConvs([]); }
    finally { setLoading(false); }
  }, [filter, page]);

  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  return (
    <div>
      {/* Filtros */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center' }}>
        {[['all','Todas'], ['unrated','Sin calificar'], ['positive','Útiles 👍'], ['negative','A mejorar 👎']].map(([val, label]) => (
          <button key={val} onClick={() => { setFilter(val); setPage(0); }} style={{
            padding:'6px 14px', borderRadius:'100px', border:'1px solid', cursor:'pointer', fontSize:'0.8rem', fontWeight:500,
            borderColor: filter === val ? '#6366f1' : '#e5e7eb',
            background: filter === val ? '#6366f1' : '#fff',
            color: filter === val ? '#fff' : '#374151',
          }}>{label}</button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:'0.8rem', color:'#888' }}>{total} conversación{total !== 1 ? 'es' : ''}</span>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#888' }}><i className="fa-solid fa-spinner fa-spin" /> Cargando...</div>
      ) : convs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px', color:'#aaa' }}>
          <div style={{ fontSize:'3rem', marginBottom:'12px' }}>💬</div>
          <p>No hay conversaciones {filter !== 'all' ? 'con este filtro' : 'aún'}.</p>
          {filter === 'all' && <p style={{ fontSize:'0.82rem' }}>Las conversaciones del chat público de Denty aparecerán aquí automáticamente.</p>}
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {convs.map(conv => (
              <div key={conv.id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', overflow:'hidden' }}>
                {/* Header de la conversación */}
                <div
                  onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                  style={{ padding:'12px 16px', cursor:'pointer', display:'flex', gap:'12px', alignItems:'flex-start' }}
                >
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'4px', flexWrap:'wrap' }}>
                      <RatingBadge rating={conv.rating} />
                      <span style={{ fontSize:'0.72rem', color:'#aaa' }}>{fmt(conv.created_at)}</span>
                      {conv.provider && <span style={{ fontSize:'0.7rem', color:'#c4b5fd', background:'#f5f3ff', padding:'1px 7px', borderRadius:'100px' }}>{conv.provider}</span>}
                    </div>
                    <div style={{ fontWeight:600, fontSize:'0.87rem', color:'#1f2937', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      👤 {conv.user_message?.slice(0, 100)}{conv.user_message?.length > 100 ? '...' : ''}
                    </div>
                  </div>
                  <i className={`fa-solid fa-chevron-${expanded === conv.id ? 'up' : 'down'}`} style={{ color:'#aaa', flexShrink:0, marginTop:'2px' }} />
                </div>

                {/* Contenido expandido */}
                {expanded === conv.id && (
                  <div style={{ padding:'0 16px 16px', borderTop:'1px solid #f3f4f6' }}>
                    <div style={{ background:'#f9fafb', borderRadius:'8px', padding:'12px', marginBottom:'10px', marginTop:'10px' }}>
                      <div style={{ fontSize:'0.73rem', fontWeight:700, color:'#9ca3af', marginBottom:'6px' }}>PREGUNTA DEL PACIENTE</div>
                      <div style={{ fontSize:'0.87rem', color:'#374151' }}>{conv.user_message}</div>
                    </div>
                    <div style={{ background:'#eff6ff', borderRadius:'8px', padding:'12px', marginBottom:'12px' }}>
                      <div style={{ fontSize:'0.73rem', fontWeight:700, color:'#3b82f6', marginBottom:'6px' }}>🦷 RESPUESTA DE DENTY</div>
                      <div style={{ fontSize:'0.87rem', color:'#1e3a5f', lineHeight:1.6 }}>{conv.ai_response}</div>
                    </div>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button
                        onClick={() => onPromote(conv)}
                        style={{ padding:'7px 16px', borderRadius:'8px', border:'none', background:'#6366f1', color:'#fff', cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}
                      >
                        🧠 Entrenar con esto
                      </button>
                      <span style={{ fontSize:'0.75rem', color:'#aaa', alignSelf:'center' }}>ID #{conv.id} · Sesión: {conv.session_id?.slice(0, 14)}...</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Paginación */}
          {total > LIMIT && (
            <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginTop:'16px' }}>
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding:'6px 16px', borderRadius:'8px', border:'1px solid #e5e7eb', background: page === 0 ? '#f9fafb' : '#fff', cursor: page === 0 ? 'default' : 'pointer' }}>← Anterior</button>
              <span style={{ alignSelf:'center', fontSize:'0.82rem', color:'#888' }}>Pág. {page + 1} de {Math.ceil(total / LIMIT)}</span>
              <button disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)} style={{ padding:'6px 16px', borderRadius:'8px', border:'1px solid #e5e7eb', background:(page + 1) * LIMIT >= total ? '#f9fafb' : '#fff', cursor:(page + 1) * LIMIT >= total ? 'default' : 'pointer' }}>Siguiente →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PESTAÑA 3: BASE DE CONOCIMIENTO
// ═══════════════════════════════════════════════════════════
function TabKnowledge({ refreshTrigger }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai-knowledge`, { headers: getHeaders() });
      const data = await res.json();
      setEntries(data.knowledge || []);
    } catch { setError('Error al cargar'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries, refreshTrigger]);

  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); }
  function openNew() { setEditingId(null); setForm(DEFAULT_FORM); setShowForm(true); }
  function openEdit(e) { setEditingId(e.id); setForm({ category:e.category, question:e.question, answer:e.answer, priority:e.priority||0, is_active:e.is_active }); setShowForm(true); }

  async function handleSave(evt) {
    evt.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      const url = editingId ? `${API_BASE}/ai-knowledge/${editingId}` : `${API_BASE}/ai-knowledge`;
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: getHeaders(), body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      showSuccess(editingId ? '✅ Actualizado' : '✅ Conocimiento agregado — Denty ya puede usarlo');
      setShowForm(false);
      fetchEntries();
    } catch { setError('Error al guardar'); }
    finally { setSaving(false); }
  }

  async function handleToggle(entry) {
    try {
      await fetch(`${API_BASE}/ai-knowledge/${entry.id}`, { method:'PUT', headers:getHeaders(), body:JSON.stringify({ is_active:!entry.is_active }) });
      fetchEntries();
    } catch { setError('Error al actualizar'); }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta entrada?')) return;
    try {
      await fetch(`${API_BASE}/ai-knowledge/${id}`, { method:'DELETE', headers:getHeaders() });
      showSuccess('🗑️ Eliminada');
      fetchEntries();
    } catch { setError('Error al eliminar'); }
  }

  const filtered = filterCat ? entries.filter(e => e.category === filterCat) : entries;
  const activeCount = entries.filter(e => e.is_active).length;

  return (
    <div>
      {/* Stats bar */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'8px 14px', fontSize:'0.82rem', color:'#1d4ed8' }}>
          🧠 <strong>{activeCount}</strong> entradas activas que Denty usa ahora mismo
        </div>
        <div style={{ background:'#f5f3ff', border:'1px solid #ddd6fe', borderRadius:'8px', padding:'8px 14px', fontSize:'0.82rem', color:'#6d28d9' }}>
          📦 <strong>{entries.length}</strong> entradas totales
        </div>
        <button className="btn-primary" onClick={openNew} style={{ marginLeft:'auto' }}>
          <i className="fa-solid fa-plus" /> Nueva entrada
        </button>
      </div>

      {/* Mensajes */}
      {successMsg && <div style={{ padding:'10px 14px', borderRadius:'8px', background:'#d1fae5', color:'#065f46', marginBottom:'12px', fontSize:'0.87rem' }}>{successMsg}</div>}
      {error && <div style={{ padding:'10px 14px', borderRadius:'8px', background:'#fee2e2', color:'#991b1b', marginBottom:'12px', fontSize:'0.87rem' }}>{error} <button onClick={() => setError('')} style={{ marginLeft:'8px', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>✕</button></div>}

      {/* Formulario */}
      {showForm && (
        <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'20px', marginBottom:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <strong style={{ fontSize:'0.95rem' }}>{editingId ? '✏️ Editar entrada' : '➕ Nueva entrada de conocimiento'}</strong>
            <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#888', fontSize:'1.1rem' }}>✕</button>
          </div>
          <form onSubmit={handleSave}>
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'10px' }}>
              <div style={{ flex:'1', minWidth:'160px' }}>
                <label style={{ fontSize:'0.78rem', fontWeight:600, display:'block', marginBottom:'3px' }}>Categoría</label>
                <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category:e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ width:'100px' }}>
                <label style={{ fontSize:'0.78rem', fontWeight:600, display:'block', marginBottom:'3px' }}>Prioridad</label>
                <input className="form-control" type="number" min="0" max="100" value={form.priority} onChange={e => setForm(f => ({ ...f, priority:parseInt(e.target.value)||0 }))} />
              </div>
              <div style={{ width:'120px' }}>
                <label style={{ fontSize:'0.78rem', fontWeight:600, display:'block', marginBottom:'3px' }}>Estado</label>
                <select className="form-control" value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active:e.target.value === 'true' }))}>
                  <option value="true">✅ Activa</option>
                  <option value="false">⏸ Inactiva</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom:'10px' }}>
              <label style={{ fontSize:'0.78rem', fontWeight:600, display:'block', marginBottom:'3px' }}>Pregunta / Tema</label>
              <input className="form-control" type="text" placeholder="¿Cuánto cuesta una limpieza dental?" value={form.question} onChange={e => setForm(f => ({ ...f, question:e.target.value }))} required maxLength={500} />
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ fontSize:'0.78rem', fontWeight:600, display:'block', marginBottom:'3px' }}>Respuesta que dará Denty</label>
              <textarea className="form-control" placeholder="Escribe aquí la respuesta ideal..." value={form.answer} onChange={e => setForm(f => ({ ...f, answer:e.target.value }))} required rows={4} maxLength={3000} style={{ resize:'vertical' }} />
              <span style={{ fontSize:'0.72rem', color:'#aaa' }}>{form.answer.length}/3000</span>
            </div>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? '⏳ Guardando...' : <><i className="fa-solid fa-floppy-disk" /> {editingId ? 'Actualizar' : 'Guardar'}</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtro */}
      <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'12px', flexWrap:'wrap' }}>
        <select className="form-control" style={{ width:'auto', minWidth:'180px' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Todas las categorías ({entries.length})</option>
          {CATEGORIES.map(c => { const n = entries.filter(e => e.category === c).length; return n > 0 ? <option key={c} value={c}>{c} ({n})</option> : null; })}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#888' }}><i className="fa-solid fa-spinner fa-spin" /> Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px', color:'#aaa' }}>
          <div style={{ fontSize:'3rem', marginBottom:'12px' }}>🧠</div>
          <p>{entries.length === 0 ? 'Aún no hay conocimiento guardado. Agrega entradas o usa el botón "Entrenar con esto" en las conversaciones.' : 'No hay entradas en esta categoría.'}</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {filtered.map(entry => (
            <div key={entry.id} style={{ background: entry.is_active ? '#fff' : '#f9fafb', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'14px 16px', opacity: entry.is_active ? 1 : 0.65 }}>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'6px', alignItems:'center' }}>
                <span style={{ padding:'2px 10px', borderRadius:'100px', fontSize:'0.72rem', background:'#ede9fe', color:'#6d28d9', fontWeight:600 }}>{entry.category}</span>
                {entry.priority > 0 && <span style={{ fontSize:'0.72rem', color:'#f59e0b' }}>★ {entry.priority}</span>}
                <span style={{ fontSize:'0.72rem', fontWeight:600, color: entry.is_active ? '#10b981' : '#9ca3af' }}>{entry.is_active ? '● Activa' : '○ Inactiva'}</span>
              </div>
              <div style={{ fontWeight:600, fontSize:'0.87rem', color:'#1f2937', marginBottom:'4px' }}>❓ {entry.question}</div>
              <div style={{ fontSize:'0.82rem', color:'#4b5563', lineHeight:1.5, marginBottom:'10px' }}>
                {entry.answer.length > 180 ? entry.answer.slice(0, 180) + '...' : entry.answer}
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => openEdit(entry)} style={{ padding:'4px 12px', borderRadius:'6px', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:'0.8rem' }}><i className="fa-solid fa-pen" /> Editar</button>
                <button onClick={() => handleToggle(entry)} style={{ padding:'4px 12px', borderRadius:'6px', border:'1px solid', borderColor: entry.is_active ? '#fcd34d' : '#a7f3d0', background: entry.is_active ? '#fffbeb' : '#ecfdf5', cursor:'pointer', fontSize:'0.8rem', color: entry.is_active ? '#92400e' : '#065f46' }}>
                  <i className={`fa-solid fa-toggle-${entry.is_active ? 'on' : 'off'}`} /> {entry.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => handleDelete(entry.id)} style={{ padding:'4px 12px', borderRadius:'6px', border:'1px solid #fecaca', background:'#fee2e2', cursor:'pointer', fontSize:'0.8rem', color:'#991b1b' }}><i className="fa-solid fa-trash" /></button>
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
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [knowledgeRefresh]);

  function handlePromoteSaved() {
    setPromoteConv(null);
    setTab('knowledge');
    setKnowledgeRefresh(n => n + 1);
  }

  const TABS = [
    { id:'dashboard', label:'📊 Dashboard', desc:'Estado del entrenamiento' },
    { id:'conversations', label:'💬 Conversaciones', desc:'Mensajes del chat público' },
    { id:'knowledge', label:'🧠 Conocimiento', desc:'Base de datos de Denty' },
  ];

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom:'24px' }}>
        <div>
          <h1 className="page-title">
            🧠 Entrenamiento de Denty IA
          </h1>
          <p className="page-subtitle">
            Revisa las conversaciones del chat, califica las respuestas y agrega conocimiento. Denty mejora con cada entrada que guardas.
          </p>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:'flex', gap:'4px', background:'#f1f5f9', borderRadius:'10px', padding:'4px', marginBottom:'24px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex:1, padding:'10px 8px', borderRadius:'8px', border:'none', cursor:'pointer',
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? '#1f2937' : '#6b7280',
              fontWeight: tab === t.id ? 700 : 400,
              fontSize:'0.85rem',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition:'all 0.18s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      {tab === 'dashboard' && <TabDashboard stats={stats} loadingStats={loadingStats} />}
      {tab === 'conversations' && <TabConversations onPromote={setPromoteConv} />}
      {tab === 'knowledge' && <TabKnowledge refreshTrigger={knowledgeRefresh} />}

      {/* MODAL PROMOVER */}
      {promoteConv && (
        <PromoteModal
          conv={promoteConv}
          onClose={() => setPromoteConv(null)}
          onSave={handlePromoteSaved}
        />
      )}
    </div>
  );
}
