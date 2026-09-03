import { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { BarChart3, Users, ClipboardList, Calendar, TrendingUp, Download } from 'lucide-react';

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [treatmentsByDate, setTreatmentsByDate] = useState([]);
  const [treatmentsByDentist, setTreatmentsByDentist] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Cargar cada reporte independientemente para que un error no afecte a los demás
      const [summaryResult, byDateResult, byDentistResult] = await Promise.allSettled([
        reportService.getSummary(),
        reportService.getTreatmentsByDate(startDate, endDate),
        reportService.getTreatmentsByDentist(startDate, endDate),
      ]);

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      }
      if (byDateResult.status === 'fulfilled') {
        setTreatmentsByDate(byDateResult.value?.treatments || []);
      }
      if (byDentistResult.status === 'fulfilled') {
        setTreatmentsByDentist(byDentistResult.value?.treatments || []);
      }

      // Solo mostrar error si todos fallaron
      const allFailed = [summaryResult, byDateResult, byDentistResult].every(r => r.status === 'rejected');
      if (allFailed) {
        toast.error('Error al cargar reportes. Verifica tu conexión.');
      }
    } catch (error) {
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadReports();
  };

  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = typeof row[h] === 'object' ? JSON.stringify(row[h]) : row[h];
        return `"${val}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Archivo exportado');
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        <p>Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Estadísticas y consultas del sistema</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="dashboard-stats mb-lg">
        <div className="stat-card animate-in">
          <div className="stat-card-info">
            <h3>Total Pacientes</h3>
            <div className="stat-value">{summary?.totalPatients || 0}</div>
          </div>
          <div className="stat-card-icon teal"><Users size={22} /></div>
        </div>
        <div className="stat-card animate-in">
          <div className="stat-card-info">
            <h3>Total Atenciones</h3>
            <div className="stat-value">{summary?.totalTreatments || 0}</div>
          </div>
          <div className="stat-card-icon blue"><ClipboardList size={22} /></div>
        </div>
        <div className="stat-card animate-in">
          <div className="stat-card-info">
            <h3>Atenciones Hoy</h3>
            <div className="stat-value">{summary?.todayTreatments || 0}</div>
          </div>
          <div className="stat-card-icon green"><TrendingUp size={22} /></div>
        </div>
        <div className="stat-card animate-in">
          <div className="stat-card-info">
            <h3>Este Mes</h3>
            <div className="stat-value">{summary?.monthTreatments || 0}</div>
          </div>
          <div className="stat-card-icon purple"><Calendar size={22} /></div>
        </div>
      </div>

      {/* Filtro por fechas */}
      <div className="card mb-lg">
        <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, marginBottom: '16px' }}>
          <Calendar size={18} style={{ display: 'inline', marginRight: 8 }} />
          Filtrar por Rango de Fechas
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label className="form-label">Desde</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Hasta</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleFilter}>
            Filtrar
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Atenciones por Fecha */}
        <div className="card animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>
              Atenciones por Fecha
            </h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => exportCSV(treatmentsByDate, 'atenciones_por_fecha')}
            >
              <Download size={14} /> Exportar
            </button>
          </div>

          {treatmentsByDate.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <p>No hay datos en el rango seleccionado</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {treatmentsByDate.slice(0, 15).map((t, i) => (
                    <tr key={i}>
                      <td>{new Date(t.treatment_date).toLocaleDateString('es-PE')}</td>
                      <td>
                        <span className="badge badge-primary">{t.count}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Atenciones por Odontólogo */}
        <div className="card animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>
              Atenciones por Odontólogo
            </h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => exportCSV(treatmentsByDentist.map(t => ({
                odontologo: t.dentist?.full_name,
                cantidad: t.count
              })), 'atenciones_por_odontologo')}
            >
              <Download size={14} /> Exportar
            </button>
          </div>

          {treatmentsByDentist.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <p>No hay datos disponibles</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {treatmentsByDentist.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{t.dentist?.full_name || 'Desconocido'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        height: '8px',
                        width: `${Math.min(parseInt(t.count) * 20, 200)}px`,
                        background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                        borderRadius: 'var(--radius-full)',
                      }}
                    />
                    <span className="badge badge-primary">{t.count}</span>
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
