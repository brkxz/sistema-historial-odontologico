import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { treatmentService, patientService, teethService } from '../services/api';
import { getClinicalSuggestion, formatClinicalNotes } from '../services/aiService';
import { useToast } from '../components/UI/Toast';
import { useAuth } from '../context/AuthContext';
import { useAI } from '../context/AIContext';
import { useVoice } from '../hooks/useVoice';
import { useSoundFeedback } from '../hooks/useSoundFeedback';
import { Save, X, Printer, Search, CheckCircle, Mic, MicOff, Layers, UserCheck, Sparkles, Bot, Wand2 } from 'lucide-react';

export default function TreatmentPage() {
  const [searchParams] = useSearchParams();
  const prefillPatientId = searchParams.get('patient_id');

  const [patient, setPatient] = useState(null);
  const [searchDni, setSearchDni] = useState('');
  const [allTeeth, setAllTeeth] = useState([]);
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [activeArchTab, setActiveArchTab] = useState('all'); // 'all', 'upper', 'lower'
  const [dictatingField, setDictatingField] = useState(null); // 'reason', 'procedure_performed', 'observations'
  const [dictationPreview, setDictationPreview] = useState(''); // Preview en tiempo real del dictado
  const [isFormatting, setIsFormatting] = useState(null); // Campo que se está formateando con IA
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
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { setCurrentPatient, apiKeyConfigured } = useAI();
  const { isListening, interimTranscript, startListening, stopListening, audioLevel } = useVoice();
  const { playStartSound, playStopSound, playConfirmSound } = useSoundFeedback();

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
      setCurrentPatient(data.patient);
    } catch {
      toast.error('Error al cargar paciente');
    }
  };

  const searchPatient = async () => {
    if (!searchDni.trim()) return;
    try {
      const data = await patientService.searchByDni(searchDni.trim());
      setPatient(data.patient);
      setCurrentPatient(data.patient);
      toast.success(`Paciente encontrado: ${data.patient.first_name} ${data.patient.last_name}`);
    } catch {
      toast.error('Paciente no encontrado');
    }
  };

  // Dictado clínico por voz mejorado (usa hook useVoice compartido)
  const startDictation = useCallback((field) => {
    // Si ya estamos dictando este campo, detener
    if (isListening && dictatingField === field) {
      stopListening();
      playStopSound();
      setDictatingField(null);
      setDictationPreview('');
      return;
    }

    // Si estamos dictando otro campo, detener primero
    if (isListening) {
      stopListening();
    }

    setDictatingField(field);
    setDictationPreview('');
    playStartSound();
    toast.info('🎙️ Hable ahora... Dictado continuo activado');

    startListening({
      continuous: true,
      autoRestart: true,
      silenceTimeout: 6000,
      onInterim: (text) => {
        setDictationPreview(text);
      },
      onResult: (text) => {
        playConfirmSound();
        setForm((prev) => ({
          ...prev,
          [field]: prev[field] ? `${prev[field]}. ${text}` : text,
        }));
        setDictationPreview('');
      },
    });
  }, [isListening, dictatingField, startListening, stopListening, playStartSound, playStopSound, playConfirmSound, toast]);

  // Detener dictado cuando el componente se desmonta
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Auto-formateo de notas clínicas con IA
  const handleFormatWithAI = useCallback(async (field) => {
    const text = form[field];
    if (!text || !apiKeyConfigured) return;

    setIsFormatting(field);
    try {
      const formatted = await formatClinicalNotes(text, field);
      setForm((prev) => ({ ...prev, [field]: formatted }));
      toast.success('Texto formateado por IA');
    } catch {
      toast.error('Error al formatear con IA');
    } finally {
      setIsFormatting(null);
    }
  }, [form, apiKeyConfigured, toast]);

  const toggleTooth = (tooth) => {
    setSelectedTeeth((prev) => {
      const exists = prev.find((t) => t.tooth_id === tooth.id);
      if (exists) {
        return prev.filter((t) => t.tooth_id !== tooth.id);
      }
      return [
        ...prev,
        {
          tooth_id: tooth.id,
          tooth_number: tooth.tooth_number,
          name: tooth.name,
          condition: 'caries',
          surface: 'Oclusal',
          notes: '',
        },
      ];
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
          tooth_id,
          condition,
          surface,
          notes,
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
        <title>Atención Odontológica - Hospital San Ramón</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { text-align: center; border-bottom: 3px solid #0D9488; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #0D9488; font-size: 20px; margin-bottom: 4px; }
          .header p { color: #666; font-size: 12px; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 13px; font-weight: 700; color: #0D9488; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
          .field { display: flex; margin-bottom: 8px; font-size: 13px; }
          .field-label { width: 180px; font-weight: 600; color: #555; }
          .field-value { flex: 1; }
          .footer { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature { text-align: center; padding-top: 40px; border-top: 1px solid #333; width: 200px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏥 HOSPITAL SAN RAMÓN — RED DE SALUD CHANCHAMAYO</h1>
          <p>Área de Odontología • Ficha Clínica de Atención</p>
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
          <div class="field"><span class="field-label">Diente(s) Tratados:</span><span class="field-value">${selectedTeeth.map(t => '#' + t.tooth_number + ' (' + t.condition + ')').join(', ') || 'General'}</span></div>
          <div class="field"><span class="field-label">Procedimiento:</span><span class="field-value">${form.procedure_performed || '-'}</span></div>
          <div class="field"><span class="field-label">Observaciones/Receta:</span><span class="field-value">${form.observations || '-'}</span></div>
          <div class="field"><span class="field-label">Próxima Cita:</span><span class="field-value">${form.next_appointment ? new Date(form.next_appointment).toLocaleDateString('es-PE') : 'No programada'}</span></div>
          <div class="field"><span class="field-label">Odontólogo:</span><span class="field-value">${user?.full_name || 'Dr. Odontólogo'}</span></div>
        </div>
        <div class="footer">
          <div class="signature">Firma del Paciente</div>
          <div class="signature">Firma y Sello del Odontólogo<br/>${user?.full_name || ''}</div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Vista de éxito al guardar
  if (saved) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card animate-in p-lg">
          <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ marginBottom: '8px' }}>¡Atención Registrada!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            La atención de <strong>{patient?.first_name} {patient?.last_name}</strong> ha sido guardada en la nube
          </p>
          <div className="treatment-saved-actions">
            <button className="btn btn-primary" onClick={() => navigate(`/historial/${patient.id}`)}>
              Ver Historial Completo
            </button>
            <button className="btn btn-secondary" onClick={() => savedTreatment && printTreatment(savedTreatment)}>
              <Printer size={18} /> Imprimir Ficha
            </button>
            <button
              className="btn btn-success"
              onClick={() => {
                setSaved(false);
                setForm({
                  treatment_date: new Date().toISOString().split('T')[0],
                  reason: '',
                  procedure_performed: '',
                  observations: '',
                  next_appointment: '',
                });
                setSelectedTeeth([]);
              }}
            >
              Registrar Otra Atención
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cuadrantes dentales
  const upperTeeth = [
    ...allTeeth.filter((t) => t.quadrant === 'superior_derecho').sort((a, b) => b.tooth_number - a.tooth_number),
    ...allTeeth.filter((t) => t.quadrant === 'superior_izquierdo').sort((a, b) => a.tooth_number - b.tooth_number),
  ];
  const lowerTeeth = [
    ...allTeeth.filter((t) => t.quadrant === 'inferior_izquierdo').sort((a, b) => b.tooth_number - a.tooth_number),
    ...allTeeth.filter((t) => t.quadrant === 'inferior_derecho').sort((a, b) => a.tooth_number - b.tooth_number),
  ];

  return (
    <div className="treatment-page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nueva Atención</h1>
          <p className="page-subtitle">Registrar consulta, diagnóstico y procedimiento clínico</p>
        </div>
      </div>

      {/* 1. Selección de Paciente */}
      <div className="card mb-md p-md treatment-card-section">
        <h3 className="treatment-section-header"><UserCheck size={18} /> Paciente a Atender</h3>
        {patient ? (
          <div className="patient-selected-box">
            <div className="patient-avatar-sm">
              {patient.first_name?.[0]}{patient.last_name?.[0]}
            </div>
            <div className="patient-selected-info">
              <div className="patient-selected-name">{patient.first_name} {patient.last_name}</div>
              <div className="patient-selected-meta">DNI: {patient.dni} • Edad: {patient.age || 'S/E'} años</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setPatient(null)}>
              Cambiar
            </button>
          </div>
        ) : (
          <div className="treatment-search-row">
            <input
              type="text"
              inputMode="numeric"
              className="form-input"
              placeholder="Ingrese DNI del paciente (8 dígitos)..."
              value={searchDni}
              onChange={(e) => setSearchDni(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPatient()}
            />
            <button className="btn btn-primary" onClick={searchPatient}>
              <Search size={18} /> Buscar
            </button>
          </div>
        )}
      </div>

      {/* 2. Selector Táctil de Dientes */}
      <div className="card mb-md p-md treatment-card-section">
        <div className="teeth-selector-header">
          <div>
            <h3 className="treatment-section-header">🦷 Dientes Involucrados</h3>
            <p className="teeth-selector-sub">Toca las piezas tratadas en esta sesión ({selectedTeeth.length} seleccionadas)</p>
          </div>
          <div className="arch-toggle-pills">
            <button
              className={`pill-btn ${activeArchTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveArchTab('all')}
            >
              Todos (32)
            </button>
            <button
              className={`pill-btn ${activeArchTab === 'upper' ? 'active' : ''}`}
              onClick={() => setActiveArchTab('upper')}
            >
              Superior
            </button>
            <button
              className={`pill-btn ${activeArchTab === 'lower' ? 'active' : ''}`}
              onClick={() => setActiveArchTab('lower')}
            >
              Inferior
            </button>
          </div>
        </div>

        {/* Scroll táctil de dientes */}
        <div className="treatment-teeth-scroll">
          {(activeArchTab === 'all' || activeArchTab === 'upper') && (
            <div className="treatment-teeth-row">
              <span className="arch-label-micro">Arcada Superior:</span>
              <div className="teeth-chips-flex">
                {upperTeeth.map((tooth) => {
                  const isSelected = selectedTeeth.some((t) => t.tooth_id === tooth.id);
                  return (
                    <button
                      key={tooth.id}
                      type="button"
                      className={`treatment-tooth-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleTooth(tooth)}
                    >
                      <span className="tooth-chip-num">{tooth.tooth_number}</span>
                      <span className="tooth-chip-type">{tooth.type?.slice(0, 3)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(activeArchTab === 'all' || activeArchTab === 'lower') && (
            <div className="treatment-teeth-row mt-sm">
              <span className="arch-label-micro">Arcada Inferior:</span>
              <div className="teeth-chips-flex">
                {lowerTeeth.map((tooth) => {
                  const isSelected = selectedTeeth.some((t) => t.tooth_id === tooth.id);
                  return (
                    <button
                      key={tooth.id}
                      type="button"
                      className={`treatment-tooth-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleTooth(tooth)}
                    >
                      <span className="tooth-chip-num">{tooth.tooth_number}</span>
                      <span className="tooth-chip-type">{tooth.type?.slice(0, 3)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Detalle de Dientes Seleccionados */}
        {selectedTeeth.length > 0 && (
          <div className="selected-teeth-list-mobile mt-md">
            {selectedTeeth.map((st) => (
              <div key={st.tooth_id} className="selected-tooth-item-card">
                <div className="selected-tooth-top">
                  <span className="badge badge-info">Pieza #{st.tooth_number}</span>
                  <span className="selected-tooth-name">{st.name}</span>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => toggleTooth({ id: st.tooth_id })}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="selected-tooth-inputs">
                  <select
                    className="form-select"
                    value={st.condition}
                    onChange={(e) => updateToothDetail(st.tooth_id, 'condition', e.target.value)}
                  >
                    <option value="sano">Sano / Profilaxis</option>
                    <option value="caries">Caries</option>
                    <option value="obturado">Obturado / Resina</option>
                    <option value="endodoncia">Endodoncia</option>
                    <option value="corona">Corona</option>
                    <option value="ausente">Extracción / Ausente</option>
                    <option value="sellante">Sellante</option>
                    <option value="fracturado">Fracturado</option>
                    <option value="protesis">Prótesis</option>
                  </select>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Superficie (ej. Oclusal, Vestibular)"
                    value={st.surface}
                    onChange={(e) => updateToothDetail(st.tooth_id, 'surface', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Formulario Clínico */}
      <div className="card mb-md p-md treatment-card-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h3 className="treatment-section-header">📋 Registro de Procedimiento</h3>
          {apiKeyConfigured && (
            <button
              className="ai-suggest-btn"
              onClick={async () => {
                if (!form.reason && selectedTeeth.length === 0) {
                  toast.warning('Ingresa un motivo o selecciona dientes para obtener sugerencias');
                  return;
                }
                setAiLoading(true);
                try {
                  const teethStr = selectedTeeth.map(t => `#${t.tooth_number} (${t.condition})`).join(', ');
                  const result = await getClinicalSuggestion(
                    form.reason || 'Consulta general',
                    teethStr || 'General',
                    patient?.age
                  );
                  setAiSuggestion(result);
                } catch {
                  toast.error('Error al obtener sugerencia IA');
                } finally {
                  setAiLoading(false);
                }
              }}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Analizando...</>
              ) : (
                <><Sparkles size={14} /> Sugerencia IA</>
              )}
            </button>
          )}
        </div>

        {aiSuggestion && (
          <div className="ai-suggestion-result">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--accent-light)', fontWeight: 700, fontSize: 'var(--font-size-xs)' }}>
              <Bot size={14} /> SUGERENCIA DE ODONTOIA
            </div>
            {aiSuggestion}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11 }}
                onClick={() => {
                  setForm(prev => ({ ...prev, procedure_performed: prev.procedure_performed ? `${prev.procedure_performed}\n${aiSuggestion}` : aiSuggestion }));
                  toast.success('Sugerencia aplicada al procedimiento');
                }}
              >
                Aplicar a Procedimiento
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11 }}
                onClick={() => setAiSuggestion('')}
              >
                Descartar
              </button>
            </div>
          </div>
        )}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Fecha de Atención *</label>
            <input
              type="date"
              className="form-input"
              value={form.treatment_date}
              onChange={(e) => setForm({ ...form, treatment_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Próxima Cita / Control</label>
            <input
              type="date"
              className="form-input"
              value={form.next_appointment}
              onChange={(e) => setForm({ ...form, next_appointment: e.target.value })}
            />
          </div>

          <div className="form-group full-width">
            <div className="field-label-with-voice">
              <label className="form-label">Motivo de Consulta y Síntomas *</label>
              <div className="voice-field-actions">
                {form.reason && apiKeyConfigured && (
                  <button
                    type="button"
                    className={`voice-format-btn ${isFormatting === 'reason' ? 'formatting' : ''}`}
                    onClick={() => handleFormatWithAI('reason')}
                    disabled={isFormatting !== null}
                    title="Formatear con IA"
                  >
                    <Wand2 size={12} /> {isFormatting === 'reason' ? 'Formateando...' : 'IA'}
                  </button>
                )}
                <button
                  type="button"
                  className={`voice-mini-btn ${isListening && dictatingField === 'reason' ? 'listening' : ''}`}
                  onClick={() => startDictation('reason')}
                  title={isListening && dictatingField === 'reason' ? 'Detener dictado' : 'Dictar por voz'}
                >
                  {isListening && dictatingField === 'reason' ? <><MicOff size={14} /> Detener</> : <><Mic size={14} /> Dictar</>}
                </button>
              </div>
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Dolor pulsátil en molar con frío, revisión semestral..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
            {isListening && dictatingField === 'reason' && dictationPreview && (
              <div className="dictation-live-preview">
                <div className="dictation-live-dot" />
                <span>{dictationPreview}</span>
              </div>
            )}
          </div>

          <div className="form-group full-width">
            <div className="field-label-with-voice">
              <label className="form-label">Procedimiento Realizado</label>
              <div className="voice-field-actions">
                {form.procedure_performed && apiKeyConfigured && (
                  <button
                    type="button"
                    className={`voice-format-btn ${isFormatting === 'procedure_performed' ? 'formatting' : ''}`}
                    onClick={() => handleFormatWithAI('procedure_performed')}
                    disabled={isFormatting !== null}
                    title="Formatear con IA"
                  >
                    <Wand2 size={12} /> {isFormatting === 'procedure_performed' ? 'Formateando...' : 'IA'}
                  </button>
                )}
                <button
                  type="button"
                  className={`voice-mini-btn ${isListening && dictatingField === 'procedure_performed' ? 'listening' : ''}`}
                  onClick={() => startDictation('procedure_performed')}
                  title={isListening && dictatingField === 'procedure_performed' ? 'Detener dictado' : 'Dictar por voz'}
                >
                  {isListening && dictatingField === 'procedure_performed' ? <><MicOff size={14} /> Detener</> : <><Mic size={14} /> Dictar</>}
                </button>
              </div>
            </div>
            <textarea
              className="form-textarea"
              placeholder="Describa el tratamiento, materiales (3M, ionómero) o medicación utilizada..."
              value={form.procedure_performed}
              onChange={(e) => setForm({ ...form, procedure_performed: e.target.value })}
            />
            {isListening && dictatingField === 'procedure_performed' && dictationPreview && (
              <div className="dictation-live-preview">
                <div className="dictation-live-dot" />
                <span>{dictationPreview}</span>
              </div>
            )}
          </div>

          <div className="form-group full-width">
            <div className="field-label-with-voice">
              <label className="form-label">Observaciones, Receta e Indicaciones</label>
              <div className="voice-field-actions">
                {form.observations && apiKeyConfigured && (
                  <button
                    type="button"
                    className={`voice-format-btn ${isFormatting === 'observations' ? 'formatting' : ''}`}
                    onClick={() => handleFormatWithAI('observations')}
                    disabled={isFormatting !== null}
                    title="Formatear con IA"
                  >
                    <Wand2 size={12} /> {isFormatting === 'observations' ? 'Formateando...' : 'IA'}
                  </button>
                )}
                <button
                  type="button"
                  className={`voice-mini-btn ${isListening && dictatingField === 'observations' ? 'listening' : ''}`}
                  onClick={() => startDictation('observations')}
                  title={isListening && dictatingField === 'observations' ? 'Detener dictado' : 'Dictar por voz'}
                >
                  {isListening && dictatingField === 'observations' ? <><MicOff size={14} /> Detener</> : <><Mic size={14} /> Dictar</>}
                </button>
              </div>
            </div>
            <textarea
              className="form-textarea"
              placeholder="Fármacos recetados, posología (ej: Amoxicilina 500mg c/8h) o cuidados post-atención..."
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
            />
            {isListening && dictatingField === 'observations' && dictationPreview && (
              <div className="dictation-live-preview">
                <div className="dictation-live-dot" />
                <span>{dictationPreview}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Botones de Acción Móviles */}
      <div className="treatment-mobile-action-bar">
        <button
          type="button"
          className="btn btn-primary btn-lg action-btn-full"
          onClick={() => handleSubmit(false)}
          disabled={saving}
        >
          {saving ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><Save size={18} /> Guardar Atención</>}
        </button>
        <button
          type="button"
          className="btn btn-success btn-lg action-btn-full"
          onClick={() => handleSubmit(true)}
          disabled={saving}
        >
          <Printer size={18} /> Guardar e Imprimir Ficha
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-lg action-btn-full"
          onClick={() => navigate(-1)}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
