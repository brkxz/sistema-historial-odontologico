import { useState, useEffect } from 'react';
import { odontogramService, patientService, teethService } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { Search, ZoomIn, ZoomOut, Layers, CheckCircle2, ChevronRight } from 'lucide-react';

const CONDITIONS = [
  { value: 'sano', label: 'Sano', color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' },
  { value: 'caries', label: 'Caries', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' },
  { value: 'obturado', label: 'Obturado', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.2)' },
  { value: 'ausente', label: 'Ausente', color: '#64748B', bg: 'rgba(100, 116, 139, 0.2)' },
  { value: 'fracturado', label: 'Fracturado', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)' },
  { value: 'endodoncia', label: 'Endodoncia', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.2)' },
  { value: 'corona', label: 'Corona', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.2)' },
  { value: 'puente', label: 'Puente', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.2)' },
  { value: 'sellante', label: 'Sellante', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.2)' },
  { value: 'protesis', label: 'Prótesis', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.2)' },
];

export default function OdontogramPage() {
  const [patient, setPatient] = useState(null);
  const [searchDni, setSearchDni] = useState('');
  const [allTeeth, setAllTeeth] = useState([]);
  const [odontogramData, setOdontogramData] = useState({});
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upper', 'lower'
  const [isZoomed, setIsZoomed] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadTeeth();
  }, []);

  const loadTeeth = async () => {
    try {
      const data = await teethService.getAll();
      setAllTeeth(data.teeth);
    } catch (error) {
      console.error('Error al cargar dientes:', error);
    }
  };

  const searchPatient = async () => {
    if (!searchDni.trim()) return;
    setLoading(true);
    try {
      const data = await patientService.searchByDni(searchDni.trim());
      setPatient(data.patient);
      await loadOdontogram(data.patient.id);
    } catch {
      toast.error('Paciente no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const loadOdontogram = async (patientId) => {
    try {
      const data = await odontogramService.getByPatient(patientId);
      const map = {};
      data.odontogram.forEach((entry) => {
        map[entry.tooth_id] = entry;
      });
      setOdontogramData(map);
    } catch (error) {
      console.error('Error al cargar odontograma:', error);
    }
  };

  const updateTooth = async (condition, surface = '', notes = '') => {
    if (!selectedTooth || !patient) return;
    try {
      await odontogramService.update({
        patient_id: patient.id,
        tooth_id: selectedTooth.id,
        condition,
        surface,
        notes,
      });
      setOdontogramData((prev) => ({
        ...prev,
        [selectedTooth.id]: { ...prev[selectedTooth.id], condition, surface, notes },
      }));
      toast.success(`Diente ${selectedTooth.tooth_number} marcado como ${condition}`);
    } catch (error) {
      toast.error('Error al actualizar diente');
    }
  };

  // Agrupar dientes por cuadrantes
  const upperRight = allTeeth.filter((t) => t.quadrant === 'superior_derecho').sort((a, b) => b.tooth_number - a.tooth_number);
  const upperLeft = allTeeth.filter((t) => t.quadrant === 'superior_izquierdo').sort((a, b) => a.tooth_number - b.tooth_number);
  const lowerLeft = allTeeth.filter((t) => t.quadrant === 'inferior_izquierdo').sort((a, b) => b.tooth_number - a.tooth_number);
  const lowerRight = allTeeth.filter((t) => t.quadrant === 'inferior_derecho').sort((a, b) => a.tooth_number - b.tooth_number);

  const upperTeeth = [...upperRight, ...upperLeft];
  const lowerTeeth = [...lowerLeft, ...lowerRight];

  const getToothCondition = (toothId) => odontogramData[toothId]?.condition || '';

  const renderToothCard = (tooth) => {
    const condKey = getToothCondition(tooth.id);
    const condObj = CONDITIONS.find((c) => c.value === condKey);
    const isSelected = selectedTooth?.id === tooth.id;

    return (
      <div
        key={tooth.id}
        className={`tooth-touch-item ${isSelected ? 'selected' : ''} ${isZoomed ? 'zoomed' : ''}`}
        onClick={() => setSelectedTooth(tooth)}
      >
        <div
          className={`tooth-box ${condKey || 'default'}`}
          style={condObj ? { borderColor: condObj.color, backgroundColor: condObj.bg } : {}}
        >
          <span className="tooth-num">{tooth.tooth_number}</span>
          {condObj && <span className="tooth-dot" style={{ backgroundColor: condObj.color }} />}
        </div>
        <span className="tooth-label-micro">
          {condObj ? condObj.label.slice(0, 4) : tooth.type?.slice(0, 3)}
        </span>
      </div>
    );
  };

  return (
    <div className="odontogram-page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Odontograma Digital</h1>
          <p className="page-subtitle">Exploración visual y marcado de piezas dentales</p>
        </div>
      </div>

      {/* Buscar paciente */}
      <div className="card mb-md p-md">
        {patient ? (
          <div className="patient-active-banner">
            <div className="patient-active-info">
              <div className="patient-avatar-sm">
                {patient.first_name?.[0]}{patient.last_name?.[0]}
              </div>
              <div>
                <div className="patient-active-name">{patient.first_name} {patient.last_name}</div>
                <div className="patient-active-dni">DNI: {patient.dni} • {patient.gender === 'F' ? 'Femenino' : 'Masculino'}</div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setPatient(null); setOdontogramData({}); setSelectedTooth(null); }}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="odontogram-search-row">
            <input
              type="text"
              inputMode="numeric"
              className="form-input"
              placeholder="Ingresa DNI del paciente (8 dígitos)..."
              value={searchDni}
              onChange={(e) => setSearchDni(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPatient()}
            />
            <button className="btn btn-primary" onClick={searchPatient} disabled={loading}>
              <Search size={18} /> {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        )}
      </div>

      {patient && (
        <>
          {/* Controles móviles: Pestañas de arcada + Zoom */}
          <div className="odontogram-controls-bar">
            <div className="segmented-tabs">
              <button
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <Layers size={16} /> Todos (32)
              </button>
              <button
                className={`tab-btn ${activeTab === 'upper' ? 'active' : ''}`}
                onClick={() => setActiveTab('upper')}
              >
                🦷 Superior (16)
              </button>
              <button
                className={`tab-btn ${activeTab === 'lower' ? 'active' : ''}`}
                onClick={() => setActiveTab('lower')}
              >
                🦷 Inferior (16)
              </button>
            </div>

            <button
              className={`btn btn-secondary btn-icon btn-sm zoom-toggle-btn ${isZoomed ? 'active' : ''}`}
              onClick={() => setIsZoomed(!isZoomed)}
              title={isZoomed ? 'Vista normal' : 'Agrandar dientes'}
            >
              {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
            </button>
          </div>

          {/* Gráfico del Odontograma */}
          <div className="odontogram-board-card">
            {(activeTab === 'all' || activeTab === 'upper') && (
              <div className="arcada-section">
                <div className="arcada-header">
                  <span>Arcada Superior (18 - 28)</span>
                  <span className="arcada-badge">Maxilar</span>
                </div>
                <div className="teeth-scroll-container">
                  <div className="teeth-row-flex">
                    {upperTeeth.map(renderToothCard)}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'all' && <div className="odontogram-arch-divider" />}

            {(activeTab === 'all' || activeTab === 'lower') && (
              <div className="arcada-section">
                <div className="arcada-header">
                  <span>Arcada Inferior (48 - 38)</span>
                  <span className="arcada-badge">Mandíbula</span>
                </div>
                <div className="teeth-scroll-container">
                  <div className="teeth-row-flex">
                    {lowerTeeth.map(renderToothCard)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel Flotante / Modal Inferior del Diente Seleccionado */}
          {selectedTooth && (
            <div className="tooth-editor-modal">
              <div className="tooth-editor-card">
                <div className="tooth-editor-header">
                  <div>
                    <span className="tooth-badge-number">Pieza #{selectedTooth.tooth_number}</span>
                    <h3 className="tooth-editor-title">{selectedTooth.name}</h3>
                    <p className="tooth-editor-sub">
                      {selectedTooth.type?.toUpperCase()} • {selectedTooth.quadrant?.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                  <button className="btn btn-ghost btn-sm close-editor-btn" onClick={() => setSelectedTooth(null)}>
                    ✕
                  </button>
                </div>

                <div className="tooth-editor-body">
                  <label className="tooth-section-label">Toca una condición para marcar:</label>
                  <div className="condition-chips-grid">
                    {CONDITIONS.map((c) => {
                      const isActive = getToothCondition(selectedTooth.id) === c.value;
                      return (
                        <button
                          key={c.value}
                          className={`condition-chip ${isActive ? 'active' : ''}`}
                          style={isActive ? { backgroundColor: c.color, color: '#fff', borderColor: c.color } : {}}
                          onClick={() => updateTooth(c.value)}
                        >
                          <span className="chip-dot" style={{ backgroundColor: c.color }} />
                          <span className="chip-text">{c.label}</span>
                          {isActive && <CheckCircle2 size={16} className="chip-check" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leyenda Compacta */}
          <div className="card mt-md p-md">
            <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Guía de Colores
            </h4>
            <div className="legend-pills-grid">
              {CONDITIONS.map((c) => (
                <div key={c.value} className="legend-pill">
                  <span className="legend-pill-dot" style={{ backgroundColor: c.color }} />
                  <span className="legend-pill-name">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
