import { useState, useEffect } from 'react';
import { auditService } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { useAuth } from '../context/AuthContext';
import { Shield, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const ACTION_LABELS = {
  CREATE: { label: 'Crear', color: 'badge-success' },
  UPDATE: { label: 'Actualizar', color: 'badge-info' },
  DELETE: { label: 'Eliminar', color: 'badge-error' },
  LOGIN: { label: 'Login', color: 'badge-success' },
  LOGOUT: { label: 'Logout', color: '' },
  LOGIN_FAILED: { label: 'Login Fallido', color: 'badge-warning' },
  LOGIN_GOOGLE: { label: 'Login Google', color: 'badge-info' },
  CHANGE_PASSWORD: { label: 'Cambiar Clave', color: 'badge-warning' },
};

const ENTITY_LABELS = {
  patient: 'Paciente',
  treatment: 'Atención',
  odontogram: 'Odontograma',
  user: 'Usuario',
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    start_date: '',
    end_date: '',
  });

  const { isAdmin } = useAuth();
  const toast = useToast();

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getLogs({ page, limit: 30, ...filters });
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Error al cargar logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadLogs();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (!isAdmin) {
    return (
      <div className="empty-state card">
        <Shield size={48} />
        <h3>Acceso Restringido</h3>
        <p>Solo los administradores pueden ver los logs de auditoría</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Auditoría</h1>
          <p className="page-subtitle">Registro de todas las acciones del sistema ({total} eventos)</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Acción</label>
            <select
              className="form-select"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              style={{ minWidth: '150px' }}
            >
              <option value="">Todas</option>
              {Object.entries(ACTION_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Entidad</label>
            <select
              className="form-select"
              value={filters.entity}
              onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
              style={{ minWidth: '140px' }}
            >
              <option value="">Todas</option>
              {Object.entries(ENTITY_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Desde</label>
            <input
              type="date"
              className="form-input"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Hasta</label>
            <input
              type="date"
              className="form-input"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch} style={{ marginTop: '18px' }}>
            <Filter size={16} /> Filtrar
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setFilters({ action: '', entity: '', start_date: '', end_date: '' });
              setPage(1);
              setTimeout(loadLogs, 0);
            }}
            style={{ marginTop: '18px' }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Cargando logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state card">
          <Shield size={40} />
          <h3>Sin registros</h3>
          <p>No se encontraron eventos con los filtros actuales</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>ID</th>
                  <th>IP</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: '' };
                  return (
                    <>
                      <tr key={log.id} style={{ cursor: log.new_values ? 'pointer' : 'default' }}>
                        <td style={{ fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}>
                          {formatDate(log.created_at)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                            {log.user?.full_name || '—'}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                            @{log.user?.username || 'sistema'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${actionInfo.color}`}>
                            {actionInfo.label}
                          </span>
                        </td>
                        <td style={{ textTransform: 'capitalize', fontSize: 'var(--font-size-sm)' }}>
                          {ENTITY_LABELS[log.entity] || log.entity}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                          #{log.entity_id || '—'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', fontFamily: 'monospace' }}>
                          {log.ip_address || '—'}
                        </td>
                        <td>
                          {log.new_values && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            >
                              {expandedLog === log.id ? 'Ocultar' : 'Ver'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedLog === log.id && (
                        <tr key={`detail-${log.id}`}>
                          <td colSpan={7} style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.15)' }}>
                            {log.old_values && (
                              <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>ANTES:</span>
                                <pre style={{ margin: '4px 0 0', fontSize: '0.7rem', color: 'var(--error)', overflow: 'auto', maxHeight: '120px' }}>
                                  {JSON.stringify(JSON.parse(log.old_values), null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div>
                                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>DESPUÉS:</span>
                                <pre style={{ margin: '4px 0 0', fontSize: '0.7rem', color: 'var(--success)', overflow: 'auto', maxHeight: '120px' }}>
                                  {JSON.stringify(JSON.parse(log.new_values), null, 2)}
                                </pre>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                Página {page} de {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
