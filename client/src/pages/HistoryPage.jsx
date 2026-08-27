import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { treatmentService, patientService } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { Calendar, User, Stethoscope, FileText, Printer, ArrowLeft, Eye } from 'lucide-react';

export default function HistoryPage() {
  const { patientId } = useParams();
  const [treatments, setTreatments] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [searchDni, setSearchDni] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (patientId) {
      loadHistory(patientId);
    } else {
      setLoading(false);
    }
  }, [patientId]);

  const loadHistory = async (id) => {
    setLoading(true);
    try {
      const data = await treatmentService.getByPatient(id);
      setTreatments(data.treatments);
      setPatient(data.patient);
    } catch (error) {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const searchByDni = async () => {
    if (!searchDni.trim()) return;
    try {
      const data = await patientService.searchByDni(searchDni.trim());
      navigate(`/historial/${data.patient.id}`);
    } catch {
      toast.error('Paciente no encontrado');
    }
  };

  const printTreatment = (treatment) => {
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Atención Odontológica</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { text-align: center; border-bottom: 3px solid #0D9488; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #0D9488; font-size: 22px; margin-bottom: 4px; }
          .header p { color: #666; font-size: 13px; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 14px; font-weight: 700; color: #0D9488; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
          .field { display: flex; margin-bottom: 8px; }
          .field-label { width: 180px; font-weight: 600; color: #555; font-size: 13px; }
          .field-value { flex: 1; font-size: 13px; }
          .footer { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature { text-align: center; padding-top: 40px; border-top: 1px solid #333; width: 200px; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🦷 HISTORIAL DE ATENCIÓN ODONTOLÓGICA</h1>
          <p>Clínica Dental - Sistema de Historial Digital</p>
        </div>
        <div class="section">
          <div class="section-title">Datos del Paciente</div>
          <div class="field"><span class="field-label">Nombre Completo:</span><span class="field-value">${patient?.first_name} ${patient?.last_name}</span></div>
          <div class="field"><span class="field-label">DNI:</span><span class="field-value">${patient?.dni}</span></div>
          <div class="field"><span class="field-label">Edad:</span><span class="field-value">${patient?.age || '-'} años</span></div>
        </div>
        <div class="section">
          <div class="section-title">Datos de la Atención</div>
          <div class="field"><span class="field-label">Fecha:</span><span class="field-value">${new Date(treatment.treatment_date).toLocaleDateString('es-PE')}</span></div>
          <div class="field"><span class="field-label">Motivo de Consulta:</span><span class="field-value">${treatment.reason}</span></div>
          <div class="field"><span class="field-label">Diente(s) Atendido(s):</span><span class="field-value">${treatment.treatmentTeeth?.map(t => t.tooth?.tooth_number + ' - ' + t.tooth?.name).join(', ') || 'No especificado'}</span></div>
          <div class="field"><span class="field-label">Procedimiento:</span><span class="field-value">${treatment.procedure_performed || '-'}</span></div>
          <div class="field"><span class="field-label">Observaciones:</span><span class="field-value">${treatment.observations || '-'}</span></div>
          <div class="field"><span class="field-label">Próxima Cita:</span><span class="field-value">${treatment.next_appointment ? new Date(treatment.next_appointment).toLocaleDateString('es-PE') : 'No programada'}</span></div>
          <div class="field"><span class="field-label">Odontólogo:</span><span class="field-value">${treatment.dentist?.full_name}</span></div>
        </div>
        <div class="footer">
          <div class="signature">Firma del Paciente</div>
          <div class="signature">Firma del Odontólogo<br/>${treatment.dentist?.full_name}</div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Si no hay patientId, mostrar buscador
  if (!patientId) {
    return (
      <div>
        <h1 className="page-title">Historial Completo</h1>
        <p className="page-subtitle mb-lg">Busque un paciente para consultar su historial de atenciones</p>

        <div className="card" style={{ maxWidth: '500px' }}>
          <div className="form-group mb-md">
            <label className="form-label">Buscar por DNI</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ingrese DNI..."
                value={searchDni}
                onChange={(e) => setSearchDni(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchByDni()}
              />
              <button className="btn btn-primary" onClick={searchByDni}>Buscar</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      {/* Header con info del paciente */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/historial')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">
              Historial de {patient?.first_name} {patient?.last_name}
            </h1>
            <p className="page-subtitle">DNI: {patient?.dni} • {treatments.length} atenciones registradas</p>
          </div>
        </div>
        <button
          className="btn btn-success"
          onClick={() => navigate(`/nueva-atencion?patient_id=${patientId}`)}
        >
          Nueva Atención
        </button>
      </div>

      {/* Lista de atenciones */}
      {treatments.length === 0 ? (
        <div className="empty-state card">
          <Stethoscope size={48} />
          <h3>Sin atenciones registradas</h3>
          <p>Este paciente aún no tiene atenciones odontológicas registradas</p>
        </div>
      ) : (
        <div className="treatment-list">
          {treatments.map((t) => (
            <div key={t.id} className="treatment-card" onClick={() => setSelectedTreatment(selectedTreatment?.id === t.id ? null : t)}>
              <div className="treatment-card-header">
                <div className="treatment-date">
                  <Calendar size={16} />
                  {new Date(t.treatment_date).toLocaleDateString('es-PE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
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
                  <span className="treatment-field-label">Próxima Cita</span>
                  <span className="treatment-field-value">
                    {t.next_appointment
                      ? new Date(t.next_appointment).toLocaleDateString('es-PE')
                      : 'No programada'}
                  </span>
                </div>
              </div>

              {/* Detalle expandido */}
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
