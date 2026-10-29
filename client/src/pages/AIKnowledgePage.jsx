// ============================================================
// AIKnowledgePage — Panel para que el doctor gestione la base
// de conocimiento de Denty (agregar, editar, activar/desactivar)
// ============================================================

import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CATEGORIES = [
  'Servicios',
  'Horarios y Citas',
  'Precios',
  'Procedimientos',
  'Urgencias',
  'Medicamentos',
  'Higiene Bucal',
  'Equipo Médico',
  'SIS y Cobertura',
  'General',
];

const DEFAULT_FORM = {
  category: 'General',
  question: '',
  answer: '',
  priority: 0,
  is_active: true,
};

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export default function AIKnowledgePage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function fetchEntries() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/ai-knowledge`, { headers: getHeaders() });
      const data = await res.json();
      setEntries(data.knowledge || []);
    } catch {
      setError('Error al cargar la base de conocimiento');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchEntries(); }, []);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  function openNew() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEdit(entry) {
    setEditingId(entry.id);
    setForm({
      category: entry.category,
      question: entry.question,
      answer: entry.answer,
      priority: entry.priority || 0,
      is_active: entry.is_active,
    });
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);

    try {
      const url = editingId
        ? `${API_BASE}/ai-knowledge/${editingId}`
        : `${API_BASE}/ai-knowledge`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Error al guardar');

      showSuccess(editingId ? '✅ Actualizado correctamente' : '✅ Conocimiento agregado. Denty ya puede usar esta información.');
      setShowForm(false);
      fetchEntries();
    } catch {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(entry) {
    try {
      await fetch(`${API_BASE}/ai-knowledge/${entry.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ is_active: !entry.is_active }),
      });
      fetchEntries();
    } catch {
      setError('Error al actualizar estado');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta entrada? Esta acción no se puede deshacer.')) return;
    try {
      await fetch(`${API_BASE}/ai-knowledge/${id}`, { method: 'DELETE', headers: getHeaders() });
      showSuccess('🗑️ Entrada eliminada');
      fetchEntries();
    } catch {
      setError('Error al eliminar');
    }
  }

  const filtered = filterCat
    ? entries.filter(e => e.category === filterCat)
    : entries;

  const activeCount = entries.filter(e => e.is_active).length;

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fa-solid fa-brain" style={{ color: '#6366f1' }} /> Base de Conocimiento — Denty IA
          </h1>
          <p className="page-subtitle">
            Entrena a Denty agregando información del consultorio. Las entradas activas se inyectan en cada conversación automáticamente.
          </p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <i className="fa-solid fa-plus" /> Agregar conocimiento
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="ai-stat-card">
          <i className="fa-solid fa-database" style={{ color: '#6366f1' }} />
          <div>
            <strong style={{ fontSize: '1.4rem' }}>{entries.length}</strong>
            <span style={{ fontSize: '0.78rem', color: '#888', display: 'block' }}>Entradas totales</span>
          </div>
        </div>
        <div className="ai-stat-card">
          <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }} />
          <div>
            <strong style={{ fontSize: '1.4rem', color: '#10b981' }}>{activeCount}</strong>
            <span style={{ fontSize: '0.78rem', color: '#888', display: 'block' }}>Activas (Denty las usa)</span>
          </div>
        </div>
        <div className="ai-stat-card">
          <i className="fa-solid fa-robot" style={{ color: '#3b82f6' }} />
          <div>
            <strong style={{ fontSize: '1.4rem' }}>{CATEGORIES.length}</strong>
            <span style={{ fontSize: '0.78rem', color: '#888', display: 'block' }}>Categorías disponibles</span>
          </div>
        </div>
      </div>

      {/* MENSAJES */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
          {error} <button onClick={() => setError('')} style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* FORMULARIO */}
      {showForm && (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>
              <i className="fa-solid fa-pen-to-square" style={{ color: '#6366f1' }} /> {editingId ? 'Editar entrada' : 'Nueva entrada de conocimiento'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#888' }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div className="form-group" style={{ flex: '1', minWidth: '180px' }}>
                <label className="form-label">Categoría</label>
                <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ width: '120px' }}>
                <label className="form-label">Prioridad (0-100)</label>
                <input
                  className="form-control"
                  type="number" min="0" max="100"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group" style={{ width: '130px' }}>
                <label className="form-label">Estado</label>
                <select className="form-control" value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                  <option value="true">✅ Activa</option>
                  <option value="false">⏸ Inactiva</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Pregunta / Tema que Denty debe conocer</label>
              <input
                className="form-control"
                type="text"
                placeholder="Ej: ¿Cuánto cuesta una limpieza dental?"
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                required
                maxLength={500}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Respuesta que debe dar Denty</label>
              <textarea
                className="form-control"
                placeholder="Ej: La limpieza dental está cubierta por el SIS. Para pacientes sin SIS el costo es de S/ 40 soles..."
                value={form.answer}
                onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                required
                rows={4}
                maxLength={3000}
                style={{ resize: 'vertical' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#888' }}>{form.answer.length}/3000</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving
                  ? <><i className="fa-solid fa-spinner fa-spin" /> Guardando...</>
                  : <><i className="fa-solid fa-floppy-disk" /> {editingId ? 'Actualizar' : 'Guardar'}</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTRO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <i className="fa-solid fa-filter" style={{ color: '#888' }} />
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '180px' }}
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
        >
          <option value="">Todas las categorías ({entries.length})</option>
          {CATEGORIES.map(c => {
            const count = entries.filter(e => e.category === c).length;
            return count > 0 ? <option key={c} value={c}>{c} ({count})</option> : null;
          })}
        </select>
      </div>

      {/* LISTA */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          <i className="fa-solid fa-spinner fa-spin" /> Cargando base de conocimiento...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <i className="fa-solid fa-brain" style={{ fontSize: '2.5rem', color: '#d1d5db', display: 'block', marginBottom: '12px' }} />
          <p style={{ marginBottom: '16px' }}>
            {entries.length === 0
              ? 'Aún no has agregado ningún conocimiento. ¡Empieza a entrenar a Denty!'
              : 'No hay entradas en esta categoría.'}
          </p>
          {entries.length === 0 && (
            <button className="btn-primary" onClick={openNew}>
              <i className="fa-solid fa-plus" /> Agregar primera entrada
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(entry => (
            <div
              key={entry.id}
              style={{
                background: entry.is_active ? '#fff' : '#f9fafb',
                border: `1px solid ${entry.is_active ? '#e5e7eb' : '#e5e7eb'}`,
                borderRadius: '10px',
                padding: '14px 16px',
                opacity: entry.is_active ? 1 : 0.65,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '100px',
                  fontSize: '0.72rem',
                  background: '#ede9fe',
                  color: '#6d28d9',
                  fontWeight: 600,
                }}>
                  {entry.category}
                </span>
                {entry.priority > 0 && (
                  <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>★ {entry.priority}</span>
                )}
                <span style={{
                  fontSize: '0.72rem',
                  color: entry.is_active ? '#10b981' : '#9ca3af',
                  fontWeight: 600,
                }}>
                  {entry.is_active ? '● Activa' : '○ Inactiva'}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', color: '#1f2937' }}>
                <i className="fa-solid fa-circle-question" style={{ color: '#6366f1', marginRight: '6px' }} />
                {entry.question}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#4b5563', lineHeight: 1.5, marginBottom: '10px' }}>
                {entry.answer.length > 200 ? entry.answer.slice(0, 200) + '...' : entry.answer}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openEdit(entry)}
                  style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', color: '#374151' }}
                >
                  <i className="fa-solid fa-pen" /> Editar
                </button>
                <button
                  onClick={() => handleToggle(entry)}
                  style={{
                    padding: '4px 12px', borderRadius: '6px', border: '1px solid',
                    borderColor: entry.is_active ? '#fcd34d' : '#a7f3d0',
                    background: entry.is_active ? '#fffbeb' : '#ecfdf5',
                    cursor: 'pointer', fontSize: '0.8rem',
                    color: entry.is_active ? '#92400e' : '#065f46',
                  }}
                >
                  <i className={`fa-solid fa-toggle-${entry.is_active ? 'on' : 'off'}`} />
                  {entry.is_active ? ' Desactivar' : ' Activar'}
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fee2e2', cursor: 'pointer', fontSize: '0.8rem', color: '#991b1b' }}
                >
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
