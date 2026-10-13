import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { treatmentService, patientService, reportService } from '../services/api';
import { useToast } from '../components/UI/Toast';
import {
  Calendar, User, Printer, ArrowLeft, Search,
  ChevronRight, Clock, Filter, X, FileText,
} from 'lucide-react';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDateLong = (d) =>
  new Date(d).toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export default function HistoryPage() {
  const { patientId } = useParams();
  const navigate      = useNavigate();
  const toast         = useToast();

  const [recent,     setRecent]     = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [searchDni,  setSearchDni]  = useState('');
  const [searching,  setSearching]  = useState(false);

  const now = new Date();
  const [filterYear,  setFilterYear]  = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDate,  setFilterDate]  = useState('');

  const [treatments,        setTreatments]        = useState([]);
  const [patient,           setPatient]           = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  const loadRecent = useCallback(async () => {
    setLoadingAll(true);
    try {
      const data = await reportService.getRecentTreatments();
      const list = data.treatments || data || [];
      const sorted = [...list].sort(
        (a, b) => new Date(b.updated_at || b.treatment_date) - new Date(a.updated_at || a.treatment_date)
      );
      setRecent(sorted);
    } catch {
      toast.error('Error al cargar historiales recientes');
    } finally {
      setLoadingAll(false);
    }
  }, [toast]);

  const loadHistory = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await treatmentService.getByPatient(id);
      setTreatments(data.treatments);
      setPatient(data.patient);
    } catch {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (patientId) {
      loadHistory(patientId);
    } else {
      setLoading(false);
      loadRecent();
    }
  }, [patientId, loadHistory, loadRecent]);

  const searchByDni = async () => {
    if (!searchDni.trim()) return;
    setSearching(true);
    try {
      const data = await patientService.searchByDni(searchDni.trim());
      navigate(`/panel/historial/${data.patient.id}`);
    } catch {
      toast.error('Paciente no encontrado con ese DNI');
    } finally {
      setSearching(false);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set(recent.map(t => new Date(t.treatment_date).getFullYear()));
    return [...years].sort((a, b) => b - a);
  }, [recent]);

  const filtered = useMemo(() => {
    return recent.filter(t => {
      const d = new Date(t.treatment_date);
      if (filterDate) {
        const sel = new Date(filterDate + 'T00:00:00');
        return d.toDateString() === sel.toDateString();
      }
      if (filterYear  && d.getFullYear() !== Number(filterYear))  return false;
      if (filterMonth && d.getMonth()    !== Number(filterMonth))  return false;
      return true;
    });
  }, [recent, filterYear, filterMonth, filterDate]);

  const clearFilters = () => { setFilterYear(''); setFilterMonth(''); setFilterDate(''); };
  const hasFilters   = filterYear || filterMonth || filterDate;

  const printTreatment = (treatment) => {
    const printWindow = window.open('', '_blank');
    const patName = patient
      ? `${patient.first_name} ${patient.last_name}`
      : `${treatment.patient?.first_name ?? ''} ${treatment.patient?.last_name ?? ''}`;
    const patDni = patient?.dni ?? treatment.patient?.dni ?? '-';
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Atencion Odontologica</title>
<style>* {margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1a1a1a;}
.header{text-align:center;border-bottom:3px solid #0D9488;padding-bottom:20px;margin-bottom:30px;}
.header h1{color:#0D9488;font-size:22px;margin-bottom:4px;}.header p{color:#666;font-size:13px;}
.section{margin-bottom:24px;}.section-title{font-size:14px;font-weight:700;color:#0D9488;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;border-bottom:1px solid #e5e5e5;padding-bottom:6px;}
.field{display:flex;margin-bottom:8px;}.field-label{width:180px;font-weight:600;color:#555;font-size:13px;}.field-value{flex:1;font-size:13px;}
.footer{margin-top:60px;display:flex;justify-content:space-between;}.signature{text-align:center;padding-top:40px;border-top:1px solid #333;width:200px;font-size:12px;}
@media print{body{padding:20px;}}</style></head><body>
<div class="header"><h1>HISTORIAL DE ATENCION ODONTOLOGICA</h1><p>Clinica Dental - Sistema de Historial Digital</p></div>
<div class="section"><div class="section-title">Datos del Paciente</div>
<div class="field"><span class="field-label">Nombre Completo:</span><span class="field-value">${patName}</span></div>
<div class="field"><span class="field-label">DNI:</span><span class="field-value">${patDni}</span></div></div>
<div class="section"><div class="section-title">Datos de la Atencion</div>
<div class="field"><span class="field-label">Fecha:</span><span class="field-value">${new Date(treatment.treatment_date).toLocaleDateString('es-PE')}</span></div>
<div class="field"><span class="field-label">Motivo:</span><span class="field-value">${treatment.reason}</span></div>
<div class="field"><span class="field-label">Procedimiento:</span><span class="field-value">${treatment.procedure_performed || '-'}</span></div>
<div class="field"><span class="field-label">Observaciones:</span><span class="field-value">${treatment.observations || '-'}</span></div>
<div class="field"><span class="field-label">Proximo Control:</span><span class="field-value">${treatment.next_appointment ? new Date(treatment.next_appointment).toLocaleDateString('es-PE') : 'No programada'}</span></div>
<div class="field"><span class="field-label">Odontologo:</span><span class="field-value">${treatment.dentist?.full_name}</span></div></div>
<div class="footer"><div class="signature">Firma del Paciente</div><div class="signature">Firma del Odontologo<br/>${treatment.dentist?.full_name}</div></div>
<script>window.onload = () => window.print();</script></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ---- VISTA: Historial de paciente especifico ----
  if (patientId) {
    if (loading) {
      return (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Cargando historial...</p>
        </div>
      );
    }

    return (
      <div>
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-ghost btn-icon" onClick={() => navigate('/panel/historial')}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="page-title">
                Historial de {patient?.first_name} {patient?.last_name}
              </h1>
              <p className="page-subtitle">DNI: {patient?.dni} &bull; {treatments.length} atenciones registradas</p>
            </div>
          </div>
          <button
            className="btn btn-success"
            onClick={() => navigate(`/panel/nueva-atencion?patient_id=${patientId}`)}
          >
            Nueva Atenci&oacute;n
          </button>
        </div>

        {treatments.length === 0 ? (
          <div className="empty-state card">
            <FileText size={48} />
            <h3>Sin atenciones registradas</h3>
            <p>Este paciente aun no tiene atenciones odontologicas registradas</p>
          </div>
        ) : (
          <div className="treatment-list">
            {treatments.map((t) => (
              <div
                key={t.id}
                className="treatment-card"
                onClick={() => setSelectedTreatment(selectedTreatment?.id === t.id ? null : t)}
              >
                <div className="treatment-card-header">
                  <div className="treatment-date">
                    <Calendar size={16} />
                    {fmtDateLong(t.treatment_date)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="treatment-dentist">
                      <User size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {t.dentist?.full_name}
                    </span>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={(e) => { e.stopPropagation(); printTreatment(t); }}
                      title="Imprimir"
                    >
                      <Printer size={16} />
                    </button>
                  </div>
                </div>
                <div className="treatment-card-body">
                  <div className="treatment-field">
                    <span className="treatment-field-label">Motivo</span>
                    <span className="treatment-field-value">{t.reason}</span>
                  </div>
                  <div className="treatment-field">
                    <span className="treatment-field-label">Procedimiento</span>
                    <span className="treatment-field-value">{t.procedure_performed || '-'}</span>
                  </div>
                  <div className="treatment-field">
                    <span className="treatment-field-label">Dientes</span>
                    <span className="treatment-field-value">
                      {t.treatmentTeeth?.map((tt) => tt.tooth?.tooth_number).join(', ') || '-'}
                    </span>
                  </div>
                  <div className="treatment-field">
                    <span className="treatment-field-label">Proxima Cita</span>
                    <span className="treatment-field-value">
                      {t.next_appointment
                        ? new Date(t.next_appointment).toLocaleDateString('es-PE')
                        : 'No programada'}
                    </span>
                  </div>
                </div>
                {selectedTreatment?.id === t.id && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <div className="treatment-field">
                      <span className="treatment-field-label">Observaciones</span>
                      <span className="treatment-field-value">{t.observations || 'Sin observaciones'}</span>
                    </div>
                    {t.treatmentTeeth?.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <span className="treatment-field-label">Detalle de dientes:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                          {t.treatmentTeeth.map((tt, i) => (
                            <span key={i} className="badge badge-info">
                              #{tt.tooth?.tooth_number} - {tt.condition || 'N/A'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- VISTA: Historial general con filtros ----
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial Completo</h1>
          <p className="page-subtitle">Atenciones ordenadas por ultima actualizacion</p>
        </div>
      </div>

      <div className="hist-toolbar">
        <div className="hist-search-box">
          <Search size={16} className="hist-search-icon" />
          <input
            type="text"
            className="hist-search-input"
            placeholder="Buscar paciente por DNI..."
            value={searchDni}
            onChange={(e) => setSearchDni(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchByDni()}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={searchByDni}
            disabled={searching || !searchDni.trim()}
          >
            {searching ? <div className="spinner-sm" /> : 'Buscar'}
          </button>
        </div>

        <div className="hist-filters">
          <Filter size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

          <select
            className="hist-select"
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); setFilterDate(''); }}
          >
            <option value="">Año</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            className="hist-select"
            value={filterMonth}
            onChange={(e) => { setFilterMonth(e.target.value); setFilterDate(''); }}
          >
            <option value="">Mes</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>

          <input
            type="date"
            className="hist-select"
            value={filterDate}
            max={now.toISOString().slice(0, 10)}
            onChange={(e) => { setFilterDate(e.target.value); setFilterYear(''); setFilterMonth(''); }}
          />

          {hasFilters && (
            <button className="btn btn-ghost btn-sm hist-clear-btn" onClick={clearFilters}>
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {loadingAll ? (
        <div className="loading-overlay" style={{ minHeight: '200px' }}>
          <div className="spinner" />
          <p>Cargando historiales...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: '24px' }}>
          <FileText size={48} />
          <h3>{hasFilters ? 'Sin resultados para ese filtro' : 'Sin atenciones registradas'}</h3>
          <p>{hasFilters ? 'Intenta con otro periodo de tiempo.' : 'Aun no hay atenciones en el sistema.'}</p>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: '12px' }} onClick={clearFilters}>
              Quitar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            {filtered.length} atenci{filtered.length !== 1 ? 'ones' : 'on'} encontrada{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="hist-list">
            {filtered.map((t) => {
              const pat = t.patient;
              return (
                <div
                  key={t.id}
                  className="hist-row"
                  onClick={() => pat?.id && navigate(`/panel/historial/${pat.id}`)}
                >
                  <div className="hist-avatar">
                    {pat?.first_name?.[0]}{pat?.last_name?.[0]}
                  </div>
                  <div className="hist-info">
                    <span className="hist-name">{pat?.first_name} {pat?.last_name}</span>
                    <span className="hist-dni">DNI: {pat?.dni}</span>
                  </div>
                  <div className="hist-detail">
                    <span className="hist-reason">{t.reason}</span>
                    <span className="hist-procedure">{t.procedure_performed || 'Sin procedimiento'}</span>
                  </div>
                  <div className="hist-meta">
                    <span className="hist-date">
                      <Calendar size={12} /> {fmtDate(t.treatment_date)}
                    </span>
                    <span className="hist-doc">
                      <User size={12} /> {t.dentist?.full_name || 'N/A'}
                    </span>
                    {t.updated_at && t.updated_at !== t.created_at && (
                      <span className="hist-updated">
                        <Clock size={11} /> Act. {fmtDate(t.updated_at)}
                      </span>
                    )}
                  </div>
                  <div className="hist-action">
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={(e) => { e.stopPropagation(); printTreatment(t); }}
                      title="Imprimir"
                    >
                      <Printer size={15} />
                    </button>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}