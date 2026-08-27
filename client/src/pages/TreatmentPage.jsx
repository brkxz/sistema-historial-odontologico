import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { treatmentService, patientService, teethService } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { useAuth } from '../context/AuthContext';
import { Save, X, Printer, Search, CheckCircle } from 'lucide-react';

export default function TreatmentPage() {
  const [searchParams] = useSearchParams();
  const prefillPatientId = searchParams.get('patient_id');

  const [patient, setPatient] = useState(null);
  const [searchDni, setSearchDni] = useState('');
  const [allTeeth, setAllTeeth] = useState([]);
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [form, setForm] = useState({
    treatment_date: new Date().toISOString().split('T')[0],
    reason: '',
    procedure_performed: '',
    observations: '',
    next_appointment: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedTreatment, setSavedTreatment] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadTeeth();
    if (prefillPatientId) {
      loadPatient(prefillPatientId);
    }
  }, []);

  const loadTeeth = async () => {
    try {
      const data = await teethService.getAll();
      setAllTeeth(data.teeth);
    } catch (error) {
      console.error('Error al cargar dientes:', error);
    }
  };

  const loadPatient = async (id) => {
    try {
      const data = await patientService.getById(id);
      setPatient(data.patient);
    } catch {
      toast.error('Error al cargar paciente');
    }
  };

  const searchPatient = async () => {
    if (!searchDni.trim()) return;
    try {
      const data = await patientService.searchByDni(searchDni.trim());
      setPatient(data.patient);
      toast.success(`Paciente encontrado: ${data.patient.first_name} ${data.patient.last_name}`);
    } catch {
      toast.error('Paciente no encontrado');
    }
  };

  const toggleTooth = (tooth) => {
    setSelectedTeeth((prev) => {
      const exists = prev.find((t) => t.tooth_id === tooth.id);
      if (exists) {
        return prev.filter((t) => t.tooth_id !== tooth.id);
      }
      return [...prev, { tooth_id: tooth.id, tooth_number: tooth.tooth_number, name: tooth.name, condition: 'caries', surface: '', notes: '' }];
    });
  };

  const updateToothDetail = (toothId, field, value) => {
    setSelectedTeeth((prev) =>
      prev.map((t) => (t.tooth_id === toothId ? { ...t, [field]: value } : t))
    );
  };

  const handleSubmit = async (andPrint = false) => {
    if (!patient) {
      toast.warning('Seleccione un paciente');
      return;
    }
    if (!form.reason) {
      toast.warning('Ingrese el motivo de consulta');
      return;
    }

    setSaving(true);
    try {
      const data = await treatmentService.create({
        patient_id: patient.id,
        ...form,
        teeth: selectedTeeth.map(({ tooth_id, condition, surface, notes }) => ({
          tooth_id, condition, surface, notes,
        })),
      });

      setSavedTreatment(data.treatment);
      setSaved(true);
      toast.success('Atención registrada exitosamente');

      if (andPrint) {
        printTreatment(data.treatment);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
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
          <div class="field"><span class="field-label">Fecha:</span><span class="field-value">${new Date(form.treatment_date).toLocaleDateString('es-PE')}</span></div>
          <div class="field"><span class="field-label">Motivo de Consulta:</span><span class="field-value">${form.reason}</span></div>
          <div class="field"><span class="field-label">Diente(s):</span><span class="field-value">${selectedTeeth.map(t => t.tooth_number + ' - ' + t.name).join(', ') || 'No especificado'}</span></div>
          <div class="field"><span class="field-label">Procedimiento:</span><span class="field-value">${form.procedure_performed || '-'}</span></div>
          <div class="field"><span class="field-label">Observaciones:</span><span class="field-value">${form.observations || '-'}</span></div>
          <div class="field"><span class="field-label">Próxima Cita:</span><span class="field-value">${form.next_appointment ? new Date(form.next_appointment).toLocaleDateString('es-PE') : 'No programada'}</span></div>
          <div class="field"><span class="field-label">Odontólogo:</span><span class="field-value">${user?.full_name}</span></div>
        </div>
        <div class="footer">
          <div class="signature">Firma del Paciente</div>
          <div class="signature">Firma del Odontólogo<br/>${user?.full_name}</div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Vista de atención guardada exitosamente
  if (saved) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card animate-in">
          <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ marginBottom: '8px' }}>¡Atención Registrada!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            La atención de <strong>{patient?.first_name} {patient?.last_name}</strong> ha sido guardada correctamente
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate(`/historial/${patient.id}`)}>
              Ver Historial
            </button>
            <button className="btn btn-secondary" onClick={() => savedTreatment && printTreatment(savedTreatment)}>
              <Printer size={18} /> Imprimir Atención
            </button>
            <button className="btn btn-success" onClick={() => { setSaved(false); setForm({ treatment_date: new Date().toISOString().split('T')[0], reason: '', procedure_performed: '', observations: '', next_appointment: '' }); setSelectedTeeth([]); }}>
              Nueva Atención
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Agrupar dientes por cuadrante para selección
  const quadrants = {
    superior_derecho: allTeeth.filter((t) => t.quadrant === 'superior_derecho').sort((a, b) => b.tooth_number - a.tooth_number),
    superior_izquierdo: allTeeth.filter((t) => t.quadrant === 'superior_izquierdo').sort((a, b) => a.tooth_number - b.tooth_number),
    inferior_izquierdo: allTeeth.filter((t) => t.quadrant === 'inferior_izquierdo').sort((a, b) => b.tooth_number - a.tooth_number),
    inferior_derecho: allTeeth.filter((t) => t.quadrant === 'inferior_derecho').sort((a, b) => a.tooth_number - b.tooth_number),
  };

  return (
    <div className="treatment-form">
      <h1 className="page-title">Nueva Atención</h1>
      <p className="page-subtitle mb-lg">Registrar una nueva atención odontológica</p>

      {/* Selección de paciente */}
      <div className="card mb-lg treatment-form-section">
        <h3><Search size={18} /> Paciente</h3>
        {patient ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="patient-avatar" style={{ width: 44, height: 44, fontSize: 'var(--font-size-md)' }}>
                {patient.first_name?.[0]}{patient.last_name?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{patient.first_name} {patient.last_name}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  DNI: {patient.dni} • Edad: {patient.age || '-'}
                </div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setPatient(null)}>Cambiar</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Ingrese DNI del paciente..."
              value={searchDni}
              onChange={(e) => setSearchDni(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPatient()}
            />
            <button className="btn btn-primary" onClick={searchPatient}>Buscar</button>
          </div>
        )}
      </div>

      {/* Formulario de atención */}
      <div className="card mb-lg treatment-form-section">
        <h3>📋 Datos de la Atención</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input
              type="date"
              className="form-input"
              value={form.treatment_date}
              onChange={(e) => setForm({ ...form, treatment_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Próxima Cita</label>
            <input
              type="date"
              className="form-input"
              value={form.next_appointment}
              onChange={(e) => setForm({ ...form, next_appointment: e.target.value })}
            />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Motivo de Consulta *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Dolor en molar superior, limpieza dental..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Procedimiento Realizado</label>
            <textarea
              className="form-textarea"
              placeholder="Describa el procedimiento realizado..."
              value={form.procedure_performed}
              onChange={(e) => setForm({ ...form, procedure_performed: e.target.value })}
            />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Observaciones</label>
            <textarea
              className="form-textarea"
              placeholder="Observaciones adicionales..."
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Selección de dientes */}
      <div className="card mb-lg treatment-form-section">
        <h3>🦷 Diente(s) Atendido(s)</h3>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Seleccione los dientes involucrados en la atención (click para seleccionar/deseleccionar)
        </p>

        {/* Mini odontograma para selección */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="odontogram-row-label">Superior</div>
          <div className="odontogram-row">
            {[...quadrants.superior_derecho, ...quadrants.superior_izquierdo].map((tooth) => {
              const isSelected = selectedTeeth.some((t) => t.tooth_id === tooth.id);
              return (
                <div
                  key={tooth.id}
                  className={`tooth-wrapper ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleTooth(tooth)}
                  title={`${tooth.tooth_number} - ${tooth.name}`}
                >
                  <div className={`tooth ${isSelected ? 'caries' : ''}`}>
                    {tooth.tooth_number}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="odontogram-divider" />
          <div className="odontogram-row">
            {[...quadrants.inferior_izquierdo.reverse(), ...quadrants.inferior_derecho.reverse()].map((tooth) => {
              const isSelected = selectedTeeth.some((t) => t.tooth_id === tooth.id);
              return (
                <div
                  key={tooth.id}
                  className={`tooth-wrapper ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleTooth(tooth)}
                  title={`${tooth.tooth_number} - ${tooth.name}`}
                >
                  <div className={`tooth ${isSelected ? 'caries' : ''}`}>
                    {tooth.tooth_number}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="odontogram-row-label">Inferior</div>
        </div>

        {/* Detalle de dientes seleccionados */}
        {selectedTeeth.length > 0 && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Dientes seleccionados ({selectedTeeth.length}):
            </h4>
            {selectedTeeth.map((st) => (
              <div
                key={st.tooth_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  flexWrap: 'wrap',
                }}
              >
                <span className="badge badge-info">#{st.tooth_number}</span>
                <span style={{ fontSize: 'var(--font-size-sm)', flex: '0 0 120px' }}>{st.name}</span>
                <select
                  className="form-select"
                  style={{ flex: 1, minWidth: '140px', padding: '6px 10px', fontSize: 'var(--font-size-xs)' }}
                  value={st.condition}
                  onChange={(e) => updateToothDetail(st.tooth_id, 'condition', e.target.value)}
                >
                  <option value="sano">Sano</option>
                  <option value="caries">Caries</option>
                  <option value="obturado">Obturado</option>
                  <option value="ausente">Ausente</option>
                  <option value="fracturado">Fracturado</option>
                  <option value="endodoncia">Endodoncia</option>
                  <option value="corona">Corona</option>
                  <option value="puente">Puente</option>
                  <option value="sellante">Sellante</option>
                  <option value="protesis">Prótesis</option>
                </select>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => toggleTooth({ id: st.tooth_id })}
                  title="Quitar"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-lg" onClick={() => handleSubmit(false)} disabled={saving}>
          {saving ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><Save size={18} /> Guardar Atención</>}
        </button>
        <button className="btn btn-success btn-lg" onClick={() => handleSubmit(true)} disabled={saving}>
          <Printer size={18} /> Guardar e Imprimir
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>
          <X size={18} /> Cancelar
        </button>
      </div>
    </div>
  );
}
